# Bug Fix Log — LexiFluent
Ghi lại các lỗi liên quan đến backend hoặc tương tác BE↔FE để rút kinh nghiệm thiết kế.

---

## [2026-05-30] Token tự hết hạn dù chưa logout

### Triệu chứng
User chưa nhấn logout nhưng bị bắt đăng nhập lại, không nhất quán — xảy ra khi reload trang hoặc mở nhiều tab.

### Root Cause: Race condition với refresh token rotation

#### Bug 1 — Single-tab: AuthHydrator vs 401 interceptor chạy song song

Khi reload trang:
1. `AuthHydrator` gọi `authApi.refresh(RT1)` để khôi phục session
2. Đồng thời, một component nào đó gọi API → nhận 401 (access token chưa được khôi phục) → interceptor cũng gọi `refresh(RT1)`
3. Cả hai dùng cùng `RT1` → một trong hai thắng, server rotate RT1 → RT2
4. Cái còn lại gửi RT1 đã bị revoke → server phát hiện "token reuse" → `revokeAllByUserId()` → **toàn bộ session bị xóa**

#### Bug 2 — Multi-tab: Nhiều tab cùng cố refresh

Tương tự Bug 1 nhưng xảy ra giữa các tab. Mỗi tab có `isRefreshing` flag độc lập trong memory → không biết nhau đang refresh → cùng gửi RT1 → cascade logout.

### Fix

**Frontend (`axios.ts`)**: Thay `isRefreshing` flag + pending queue bằng `activeRefreshPromise` — một shared Promise duy nhất trong module scope.
- Mọi caller (`AuthHydrator`, interceptor, nhiều request 401 cùng lúc) gọi `getOrStartRefresh()` → nếu đã có promise đang chạy thì dùng chung, không tạo request mới.
- Thêm `BroadcastChannel('lexi_auth_sync')`: khi Tab A refresh thành công → push token mới sang Tab B → Tab B cập nhật `accessTokenRef` mà không cần gọi thêm refresh endpoint.

**Backend (`RefreshTokenService.java`)**: Bỏ `revokeAllByUserId()` khi phát hiện token reuse. Chỉ throw lỗi cho request đó, không cascade logout — hợp lý hơn cho multi-tab ở MVP.

### Bài học thiết kế

**1. In-memory state (accessToken) bị mất khi reload — cần khởi tạo lại bất đồng bộ**

Access token chỉ sống trong JS memory (`accessTokenRef.current`). Khi reload, nó trở về `null`. Việc khôi phục nó là async (gọi `/refresh`). Trong khoảng thời gian đó, bất kỳ request nào cũng sẽ không có token → 401. Phải đảm bảo có lock/guard ngăn request fire trong lúc hydration chưa xong, HOẶC đảm bảo refresh logic là idempotent (nhiều caller = 1 request duy nhất).

**2. Refresh token rotation tạo ra race condition khi có nhiều client cùng lúc**

Token rotation (old token → new token) là pattern bảo mật tốt, nhưng phải tính đến multi-consumer (multi-tab, concurrent requests). Nếu thiếu coordination, cả legitimate user cũng bị đá ra.

Các cách xử lý:
- **Shared promise / mutex**: 1 request duy nhất tại một thời điểm (fix đã áp dụng)
- **BroadcastChannel**: đồng bộ token mới sang các tab khác
- **Grace period trên server**: token đã rotate vẫn hợp lệ trong ~30s → chứa được race window
- **Không cascade revoke**: phát hiện reuse → chỉ reject request đó, không xóa hết session

**3. "Revoke all on reuse" quá aggressive cho UX thực tế**

Revoke tất cả session khi phát hiện token reuse là đúng về lý thuyết bảo mật (detect theft). Nhưng ở multi-tab scenario, đây là false positive. Với app không nhạy cảm cao (không phải banking), nên:
- Log cảnh báo để monitor
- Chỉ reject request hiện tại
- Để security team quyết định có cần alert hay không dựa trên pattern (frequency, IP...)

**4. Module-level state trong axios interceptor là global trong tab**

`isRefreshing`, `pendingQueue`, `activeRefreshPromise` sống ở module scope — không reset khi component unmount. Đây là ý muốn (singleton per tab), nhưng cần nhớ: chúng không được share giữa các tab (mỗi tab là một JS context riêng). Cross-tab coordination phải dùng `BroadcastChannel`, `localStorage` event, hoặc `SharedWorker`.

**5. `_retry` flag ngăn vòng lặp vô hạn**

Khi interceptor thêm Authorization header mới và retry request, response mới nếu lại 401 sẽ không trigger interceptor lần nữa vì `_retry = true`. Đây là pattern cần nhớ khi viết retry interceptor.

---

## [2026-05-30] 6 lỗ hổng bảo mật trong auth/security layer

### Triệu chứng
Review bảo mật phát hiện các vấn đề tiềm ẩn từ thiết kế, không biểu hiện thành lỗi rõ ràng trong dev.

### Root Cause (6 vấn đề)

1. **`passwordHash` bị serialize trong API response** — `User` entity trả về trực tiếp từ `GET /users/me`, field `passwordHash` không có `@JsonIgnore` → bcrypt hash lộ ra frontend.
2. **OAuth2 tokens trong URL query params** — `OAuth2LoginSuccessHandler` redirect với `?access_token=...&refresh_token=...` → tokens nằm trong browser history, server log, Referer header.
3. **Rate limiting có config nhưng không có code** — `application.yaml` khai báo `requests-per-minute: 30` nhưng không có filter nào enforce → login/register không có brute-force protection.
4. **`SessionCreationPolicy.IF_REQUIRED` trên JWT API** — Spring Security tạo HTTP session không cần thiết, mâu thuẫn với stateless JWT design.
5. **JWT secret = fallback key cho AES encryption** — `UserApiKeyEncryptor` fallback về `lexi.jwt.secret` → compromise JWT secret = compromise BYOK key.
6. **`tokenVersion` là feature chết** — `JwtAuthFilter` check tokenVersion mỗi request (DB hit) nhưng không có endpoint nào gọi `incrementTokenVersion()`.

### Fix

1. `@JsonIgnore` trên `passwordHash`, `googleId`, `tokenVersion` trong `User.java`.
2. `OAuthCodeService` — short-lived code (30s TTL, one-time use) trong Redis. Redirect `?code=xxx`, frontend POST `/auth/oauth2/exchange` → tokens trong response body.
3. `RateLimitFilter` — Redis sliding window per IP cho `/api/v1/auth/**`, fail-open khi Redis down.
4. `SessionCreationPolicy.STATELESS`.
5. Thêm `lexi.encryption.key` riêng trong `application.yaml`.
6. `POST /auth/logout-all` — revoke all refresh tokens + `incrementTokenVersion()`.

### Bài học thiết kế

**1. Không bao giờ trả entity trực tiếp từ API** — Dùng DTO hoặc ít nhất `@JsonIgnore` mọi sensitive field. Khi entity có nhiều field, rất dễ quên protect một field nào đó.

**2. Tokens không bao giờ đi qua URL** — URL xuất hiện trong: browser history, server access log, CDN log, Referer header. Pattern đúng: code exchange (code trong URL → tokens trong response body).

**3. Config ≠ implementation** — Đặt config values tạo cảm giác feature đã bật. Thực ra nó chỉ là data — cần code đọc và enforce. Luôn trace từ config → code để verify.

**4. Hai mục đích bảo mật khác nhau cần key khác nhau** — JWT signing và data encryption có threat model khác nhau. Dùng chung key: một lỗ hổng phá vỡ cả hai.

**5. Feature "incomplete" vẫn có cost** — `tokenVersion` check = 1 DB query mỗi request dù feature không có endpoint nào trigger. Dead code có chi phí: performance, complexity, misleading. Hoàn thiện hoặc xóa.

**6. Stateless API không nên tạo session** — `STATELESS` tắt hoàn toàn session creation. `IF_REQUIRED` tạo session khi cần, mâu thuẫn với JWT design và tăng attack surface.

---

## [2026-05-30] AI xử lý thất bại — Gemini API key bị leak

### Triệu chứng
Mọi bài viết submit đều chuyển sang status `FAILED` ngay sau vài giây. Frontend hiển thị "AI xử lý thất bại. Vui lòng thử lại hoặc liên hệ hỗ trợ."

### Root Cause
API key Gemini được hardcode trực tiếp làm default value trong `application.yaml`:
```yaml
api-key: ${GEMINI_API_KEY:AIzaSyBL...}
```
File này được commit lên git → Google's secret scanner phát hiện → tự động revoke key → mọi request trả về `403 PERMISSION_DENIED: "Your API key was reported as leaked"`. Fallback provider (OpenAI) cũng fail vì `OPENAI_API_KEY` để trống.

### Fix
1. Xóa hardcoded key, chỉ giữ env var placeholder: `api-key: ${GEMINI_API_KEY:}`
2. Lấy key mới tại aistudio.google.com/apikey
3. Set qua IntelliJ Run Configuration hoặc terminal: `$env:GEMINI_API_KEY = "new-key"`

### Bài học thiết kế
**Không bao giờ hardcode secrets trong file được commit**, kể cả dạng fallback default. Pattern `${VAR:defaultValue}` trông vô hại nhưng thực chất embed secret vào git history mãi mãi. Dùng `${VAR}` (không có default) để ứng dụng fail-fast khi thiếu config thay vì silently dùng exposed key. Với dev local, dùng IntelliJ env vars hoặc `.env` file (đã gitignored).

---
