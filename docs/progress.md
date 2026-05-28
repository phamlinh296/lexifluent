# LexiFluent — Mức độ hoàn thiện các chức năng

> Cập nhật: 2026-05-27

---

## Tổng quan nhanh

| Chức năng | Backend | Frontend | DB | Mức độ |
|---|---|---|---|---|
| Auth (đăng ký/đăng nhập) | ✅ | ✅ | ✅ | **~90%** |
| Google OAuth2 | ✅ code | ✅ callback | ✅ | **~70%** (chưa test E2E) |
| Hồ sơ người dùng | ✅ | ✅ | ✅ | **~85%** |
| Cài đặt & BYOK API key | ✅ | ✅ | ✅ | **~80%** |
| Viết bài (Writing) | ✅ | ✅ | ✅ | **~85%** |
| AI Feedback pipeline | ✅ | ✅ | ✅ | **~80%** (cần API key) |
| Vocabulary extraction | ✅ | ✅ | ✅ | **~75%** |
| Flashcard + SRS review | ✅ | ✅ | ✅ | **~80%** |
| Analytics / Progress | ⚠️ thin | ✅ UI có | ✅ | **~40%** (thiếu service ghi) |
| Writing streak | ⚠️ field có, chưa update | ✅ hiển thị | ✅ | **~30%** |
| Rate limiting | ⚠️ config only | — | — | **~20%** |
| Recurring mistakes review | ❌ | ❌ | ✅ schema | **~10%** |
| Notifications | ❌ | ❌ | ✅ schema | **~10%** |
| Onboarding flow | ⚠️ field only | ✅ page | — | **~30%** |

---

## Chi tiết từng chức năng

---

### 1. Auth — Đăng ký / Đăng nhập (~90%)

**Biz & flow:**
- User đăng ký bằng email + password → JWT access token (15 phút) + refresh token (7 ngày, lưu Redis)
- Đăng nhập trả về cùng cặp token
- Refresh token rotation: mỗi lần dùng refresh token → token cũ bị xóa, cấp token mới
- Logout → xóa toàn bộ refresh token của user trong Redis

**Files:** `AuthController`, `AuthService`, `RefreshTokenService`, `JwtService`

**Còn thiếu:**
- `POST /api/v1/auth/register` đang bị lỗi khi chạy (server không start được — xem mục Bug bên dưới)
- Chưa có endpoint đổi mật khẩu
- Chưa có forgot password / email verification
- `tokenVersion` tăng khi đổi password chưa được implement ở service đổi password (vì chưa có endpoint)

---

### 2. Google OAuth2 (~70%)

**Biz & flow:**
- User click "Login with Google" → redirect sang Google → callback về `/oauth/callback` ở frontend
- Backend `OAuth2LoginSuccessHandler` nhận token Google → tạo/cập nhật User với `provider=GOOGLE` → trả JWT về redirect URI

**Còn thiếu:**
- Chưa test E2E thực tế với Google Cloud credentials
- Cần cấu hình Google OAuth2 client ID/secret trong `application.yaml`
- Frontend callback page xử lý token từ URL param nhưng chưa rõ error handling

---

### 3. Hồ sơ người dùng (~85%)

**Biz & flow:**
- `GET /api/v1/users/me` → thông tin profile
- `PATCH /api/v1/users/me` → cập nhật displayName, cefrLevel (A1–C2)
- `PATCH /api/v1/users/me/settings` → lưu API key riêng (OpenAI/Gemini BYOK, mã hóa AES-256)

**Còn thiếu:**
- Upload avatar (field `avatarUrl` có nhưng không có endpoint upload)
- Validate cefrLevel input

---

### 4. Writing — Viết bài (~85%)

**Biz & flow:**
- User viết bài → chọn **mode** (DAILY_ENGLISH / IELTS_TASK1 / IELTS_TASK2) + **style** sửa (GRAMMAR_CORRECTION / NATURAL_REWRITE / NATIVE_REWRITE / IELTS_BAND_6 / IELTS_BAND_7_8)
- `POST /api/v1/writing` tạo bài với status=DRAFT
- `POST /api/v1/writing/{id}/submit` → status=SUBMITTED → phát Spring ApplicationEvent
- `WritingEventListener` nhận event (sau khi transaction commit) → gọi `AiOrchestrationService.processWriting` qua `@Async`
- Frontend polling hoặc reload để lấy feedback

**Files:** `WritingController`, `WritingService`, `WritingEntry`, `WritingEventListener`

**Còn thiếu:**
- Frontend chưa có real-time cập nhật status (đang dùng polling hoặc manual refresh)
- Chưa có pagination đầy đủ cho danh sách bài viết
- `WritingRevision` domain có nhưng chưa có logic tạo revision khi bài được sửa

---

### 5. AI Feedback Pipeline (~80%) ⭐ Chức năng cốt lõi

**Biz & flow:**
```
Submit writing
  → WritingEventListener (@Async, sau commit)
    → AiOrchestrationService.processWriting()
      → Kiểm tra quota user (AiUsageTracker)
      → Chọn model: cheap (gpt-4o-mini) hoặc strong (gpt-4o) tùy mode/style
      → BYOK check: dùng Gemini key của user → OpenAI key của user → server key
      → Gọi AI provider → nhận JSON response
      → AiFeedbackSchemaValidator parse & validate JSON
      → Lưu AiRequestEntity + AiFeedbackEntity
      → Phát Kafka event ai.feedback.generated
        → AiFeedbackGeneratedConsumer → VocabularyExtractorService
```

**Response AI gồm:** correctedText, corrections[], vocabularySuggestions[], rewrittenSentences[], ieltsScore (nếu IELTS mode), analytics (accuracy, fluency, CEFR estimate)

**Files:** `AiOrchestrationService`, `AiProviderRouter`, `OpenAiProvider`, `ClaudeProvider`, `GeminiProvider`, `PromptBuilder`, `AiFeedbackSchemaValidator`

**Còn thiếu:**
- `PromptBuilder` cần có prompt template thực tế cho từng mode/style (check nội dung file)
- Retry logic dùng Resilience4j `@Retry(name = "aiOrchestration")` nhưng config `application-resilience.yaml` chưa rõ
- Analytics update sau AI processing chưa có (xem mục Analytics)
- Kafka consumers (`WritingSubmittedConsumer`, `AiFeedbackGeneratedConsumer`) ready nhưng cần Kafka server chạy

---

### 6. Vocabulary Extraction (~75%)

**Biz & flow:**
- Sau khi AI feedback được lưu → Kafka consumer `AiFeedbackGeneratedConsumer` gọi `VocabularyExtractorService`
- Parse `vocabularySuggestions` từ AI JSON → tạo `VocabularyItem` cho user
- Nếu word đã tồn tại → tăng `encounter_count` (tracking tần suất gặp)
- User có thể đánh dấu từ là `mastered`

**Còn thiếu:**
- `collocations` table có nhưng chưa có logic lưu collocations từ AI response
- Chưa có tính năng search/filter vocabulary
- Flashcard auto-generation từ vocabulary chưa có (tạo manual được)

---

### 7. Flashcard + Spaced Repetition (~80%)

**Biz & flow:**
- User tạo flashcard (manual hoặc từ vocabulary item)
- SM-2 algorithm: `applyReview(quality 0-5)` → tính `easeFactor`, `intervalDays`, `nextReviewAt`
- `GET /api/v1/flashcards/due` → danh sách card đến hạn ôn hôm nay
- Frontend hiển thị mặt trước → user lật → chấm điểm 0-5 → gửi review

**Files:** `FlashcardService`, `Flashcard.applyReview()`

**Còn thiếu:**
- Chưa auto-generate flashcard từ vocabulary (cần liên kết khi VocabularyExtractor chạy)
- Chưa có hint hiển thị trên frontend
- Chưa có statistics per flashcard (accuracy history)

---

### 8. Analytics / Progress (~40%) ⚠️ Thiếu nhiều

**Biz & flow (theo thiết kế):**
- Sau mỗi AI feedback → cập nhật `user_progress`: grammar accuracy, fluency score, IELTS band estimate, streaks
- Dashboard hiển thị radar chart skill, writing stats

**Vấn đề hiện tại:**
- `AnalyticsController` chỉ có `GET /api/v1/analytics/progress` → đọc từ DB
- **KHÔNG có service nào ghi vào `user_progress`** sau AI processing xong
- Table `user_progress` luôn rỗng → frontend hiển thị trống hoặc lỗi
- Table `writing_analytics` tồn tại nhưng không có code ghi

**Cần làm:**
- Tạo `AnalyticsService` với method `updateAfterFeedback(userId, feedbackId)` → đọc AI analytics JSON → ghi/cập nhật `user_progress`
- Gọi service này trong `VocabularyExtractorService` hoặc thêm Kafka consumer riêng
- Tính IELTS band estimate, streak increment

---

### 9. Writing Streak (~30%) ⚠️

**Biz:** User viết bài mỗi ngày → streak tăng, nghỉ 1 ngày → reset về 0. Dashboard show "x ngày liên tiếp".

**Vấn đề:** Field `writing_streak` và `last_active_date` có trong `User` nhưng **không có code nào cập nhật** khi submit writing thành công.

**Cần làm:** Thêm logic vào `WritingService.submit()` → so sánh `lastActiveDate` với hôm nay → tăng streak hoặc reset.

---

### 10. Rate Limiting (~20%)

Config có trong `application.yaml` (`30 req/min, burst 10`) nhưng **không có Filter/Interceptor nào implement** Redis sliding window. Hiện tại rate limit không hoạt động.

---

### 11. Recurring Mistakes Review (~10%)

DB có `recurring_mistakes` table. Không có service, controller, hay frontend page. Thiết kế: AI gom nhóm lỗi lặp lại → báo cáo tuần cho user. **Chưa làm gì.**

---

### 12. Notifications (~10%)

DB có `notifications` table. Không có service hay controller. **Chưa làm gì.**

---

### 13. Onboarding (~30%)

Frontend có `app/onboarding/page.tsx`. Backend có field `onboarded: boolean` trong `User`. Không có endpoint `/api/v1/users/me/onboarding` để complete onboarding. User bị redirect về onboarding mãi nếu logic FE check field này.

---

## API Keys cho AI — Cần gì? Free không?

### Tóm tắt

| Provider | Server key config | Có free tier? | Ghi chú |
|---|---|---|---|
| **OpenAI** | `OPENAI_API_KEY` | ❌ Không free | ~$0.15/1M tokens (gpt-4o-mini) |
| **Claude (Anthropic)** | `ANTHROPIC_API_KEY` | ❌ Không free | ~$0.25/1M tokens (Haiku) |
| **Gemini** | ⚠️ Chỉ qua BYOK hiện tại | ✅ **FREE tier** | 1M tokens/ngày free, 15 RPM |

### Dùng free ngay: Google Gemini Flash

**Gemini 1.5 Flash** (và **Gemini 2.0 Flash**) có **free tier rất rộng rãi**:
- **1,000,000 tokens/ngày** miễn phí
- **15 requests/phút** (RPM) miễn phí
- Không cần credit card để lấy key

#### Cách lấy Gemini API key (miễn phí):
1. Vào **https://aistudio.google.com/apikey**
2. Đăng nhập bằng Google account
3. Click "Create API key" → chọn project hoặc tạo mới
4. Copy API key

#### Cách dùng trong LexiFluent:

**Option A — BYOK (user tự nhập, không cần config server):**
1. Đăng nhập vào app
2. Vào Settings → nhập Gemini API key
3. App tự dùng key của bạn, ưu tiên hơn server key

**Option B — Server-level (cần thêm code):**
Hiện tại `GeminiProvider` chỉ được gọi qua BYOK. Để set Gemini làm default server provider, cần:
1. Thêm vào `application.yaml`:
```yaml
lexi:
  ai:
    gemini:
      api-key: ${GEMINI_API_KEY:}
    default-provider: GEMINI
    cheap-model: gemini-2.0-flash
    strong-model: gemini-1.5-pro
```
2. Cập nhật `GeminiProvider.isAvailable()` để check server-level key

**Khuyến nghị trước mắt:** Dùng Option A (BYOK). Chỉ cần lấy key từ AI Studio, nhập vào Settings. Không cần đụng code.

---

## Bugs cần fix ngay

### Bug: Server không start được (Register API 500/connection refused)

Khả năng nguyên nhân (theo thứ tự kiểm tra):
1. **MySQL chưa chạy** — check `mysql -u root -p`
2. **Redis chưa chạy** — check `redis-cli ping`
3. **Thiếu env vars** — `JWT_SECRET`, `DATABASE_URL`, etc. (đều có default nên ít khả năng)
4. **Spring AI dependency conflict** — OpenAI/Claude key rỗng có thể khiến Spring AI auto-config fail

Để debug: chạy `mvn spring-boot:run` và đọc stack trace đầu tiên.

---

## Ưu tiên làm tiếp

1. **Fix server startup** (bug hiện tại)
2. **Analytics service** — ghi `user_progress` sau AI feedback (phần quan trọng nhất còn thiếu)
3. **Writing streak** — thêm 5 dòng vào `WritingService.submit()`
4. **Gemini server-level key** — để chạy không cần BYOK
5. **Onboarding endpoint** — `PATCH /api/v1/users/me/onboarding`
6. **Rate limiting filter** — implement Redis sliding window
7. **Auto-generate flashcard từ vocabulary** — liên kết `VocabularyExtractorService` → `FlashcardService`
