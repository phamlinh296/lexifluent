# LexiFluent — Hướng dẫn vận hành

---

## 1. Chạy project từ đầu

### Yêu cầu hệ thống

| Thành phần | Version | Bắt buộc |
|---|---|---|
| Java | 21+ | Có |
| Maven | 3.9+ (hoặc dùng `mvnw` kèm sẵn) | Có |
| Node.js | 18+ | Có |
| MySQL | 8.0+ | Có |
| Redis | 7+ | Có |
| Docker | Bất kỳ | Khuyến nghị (chạy Redis + Kafka) |
| Kafka | 3+ | Không bắt buộc (MVP dùng async event, không cần Kafka) |

---

### Bước 1 — Khởi động infrastructure (Redis + Kafka)

```bash
# Từ thư mục lexi/ (có sẵn compose.yaml)
cd lexi
docker compose up -d redis

# Nếu cần Kafka (tính năng pipeline nâng cao, không cần cho MVP):
docker compose up -d zookeeper kafka
```

> Redis bắt buộc phải chạy — dùng cho refresh token và rate limiting.
> Kafka optional — nếu không có, backend vẫn chạy bình thường (pipeline AI dùng @Async thay thế).

---

### Bước 2 — Tạo database MySQL

```sql
CREATE DATABASE lexifluent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lexi'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON lexifluent.* TO 'lexi'@'localhost';
FLUSH PRIVILEGES;
```

---

### Bước 3 — Cấu hình backend env

Tạo file `lexi/src/main/resources/application-local.yaml` (hoặc set env vars):

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/lexifluent?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC&allowPublicKeyRetrieval=true&useSSL=false
    username: lexi
    password: your_password
  data:
    redis:
      password: redis_secret   # password từ compose.yaml

lexi:
  jwt:
    secret: your-secret-min-32-chars-change-in-production
  ai:
    openai:
      api-key: sk-...          # OpenAI API key (để dùng AI feedback)
    claude:
      api-key: sk-ant-...      # Anthropic API key (optional, dùng làm fallback)
    default-provider: OPENAI
    fallback-provider: CLAUDE
```

---

### Bước 4 — Chạy backend

```bash
cd lexi

# Cách 1 — dùng Maven wrapper (không cần cài Maven)
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# Cách 2 — nếu đã cài Maven
mvn spring-boot:run -Dspring-boot.run.profiles=local

# Cách 3 — build jar rồi chạy
./mvnw clean package -DskipTests
java -jar target/lexi-*.jar --spring.profiles.active=local
```

Backend khởi động tại: `http://localhost:8080`
Schema DB tự tạo qua `ddl-auto: update` khi backend start lần đầu.

---

### Bước 5 — Cấu hình frontend env

```bash
cd lexi-fe
cp .env.local.example .env.local
# .env.local đã có sẵn nội dung đúng, không cần sửa cho local dev
```

---

### Bước 6 — Chạy frontend

```bash
cd lexi-fe
npm install        # chỉ cần lần đầu
npm run dev
```

Frontend khởi động tại: `http://localhost:3000`

---

### Tóm tắt — thứ tự mỗi lần chạy

```bash
# Terminal 1 — infrastructure
cd lexi && docker compose up -d redis

# Terminal 2 — backend
cd lexi && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# Terminal 3 — frontend
cd lexi-fe && npm run dev

# Mở trình duyệt
open http://localhost:3000
```

---

## 2. Tính năng hiện tại

### Trạng thái từng tính năng

| Tính năng | Trạng thái | Cần gì để dùng |
|---|---|---|
| Đăng ký / Đăng nhập email | ✅ Hoạt động | Backend chạy |
| Đăng nhập Google OAuth2 | ✅ Có code | Cần cấu hình Google OAuth credentials |
| JWT + Refresh token rotation | ✅ Hoạt động | Backend chạy |
| Nộp bài viết | ✅ Hoạt động | Backend chạy |
| AI feedback (ngữ pháp, từ vựng, rewrite) | ✅ Hoạt động | Cần AI API key (OpenAI hoặc Claude) |
| IELTS scoring (band, 4 criteria) | ✅ Hoạt động | Cần AI API key + mode = IELTS |
| Auto-extract vocabulary từ feedback | ✅ Hoạt động | Cần AI API key |
| Danh sách từ vựng + weak vocabulary | ✅ Hoạt động | Cần có dữ liệu từ AI feedback |
| Analytics / Progress tổng hợp | ✅ Có API | Cần BE cập nhật `user_progress` (chưa auto-update, cần implement) |
| Onboarding chọn CEFR level | ✅ Hoạt động | Backend chạy |
| Hồ sơ người dùng | ✅ Hoạt động | Backend chạy |
| Soft delete bài viết | ✅ Hoạt động | Backend chạy |
| Flashcard | ⚠️ DB có, API chưa có | Cần implement controller + service |
| Spaced Repetition (SRS) | ⚠️ DB có schema | Cần implement review logic + scheduler |
| Recurring mistakes | ⚠️ DB có, chưa implement | Cần implement aggregation từ corrections |
| Notifications | ⚠️ DB có, chưa implement | Cần implement event triggers + API |
| Streak calendar (per-day activity) | ⚠️ Chưa có API | Cần endpoint `/analytics/activity-heatmap` |
| Rate limiting | ✅ Config có | Cần Redis chạy |
| Kafka async pipeline | ⚠️ Code có, chưa dùng | Cần Kafka chạy + uncomment consumers |

---

### Google OAuth2 — cần làm gì

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → Credentials → Create OAuth 2.0 Client
2. Authorized redirect URIs: `http://localhost:8080/login/oauth2/code/google`
3. Thêm vào `application-local.yaml`:
   ```yaml
   spring:
     security:
       oauth2:
         client:
           registration:
             google:
               client-id: your-client-id
               client-secret: your-client-secret
               scope: email, profile
   ```
4. **Miễn phí** — Google OAuth không tính phí cho đến 100K users/tháng.

---

### Flashcard / SRS — cần làm gì

Backend cần implement:
- `GET /api/v1/flashcards` — list flashcard của user (filter: due today)
- `POST /api/v1/flashcards/{id}/review` — ghi nhận kết quả review (quality 0–5)
- SRS algorithm: SM-2 (ease factor, interval, next_review_at)
- Auto-gen flashcard từ `vocabulary_items` sau khi AI feedback xong

Frontend cần thêm màn hình `/flashcards`.

**Không tốn phí** — logic thuần Java, không cần service bên ngoài.

---

### Analytics auto-update — cần làm gì

Hiện tại bảng `user_progress` tồn tại nhưng không tự cập nhật sau mỗi lần AI xử lý xong.
Cần implement `UserProgressUpdater` — lắng nghe event `ai.feedback.generated` → tính toán và cập nhật `user_progress`.

**Không tốn phí.**

---

## 3. Luồng AI hiện tại

### Kiến trúc tổng quan

```
User viết bài → POST /api/v1/writing
                       │
                       ▼
              WritingService.submit()
              - Lưu WritingEntry (status=SUBMITTED)
              - Publish Spring ApplicationEvent
                       │
                       ▼ (@Async, thread pool aiTaskExecutor)
              AiOrchestrationService.processWriting()
                       │
              ┌────────┴──────────┐
              │  Chọn model       │
              │  IELTS+BAND_7_8  → GPT-4o (strong)
              │  Còn lại         → GPT-4o-mini (cheap)
              └────────┬──────────┘
                       │
              ┌────────▼──────────┐
              │  AiProviderRouter  │
              │  Primary: OpenAI  │
              │  Fallback: Claude │
              └────────┬──────────┘
                       │
              PromptBuilder.buildSystemPrompt()
              PromptBuilder.buildUserPrompt()
                       │
              AI Provider gọi API → nhận JSON
                       │
              AiFeedbackSchemaValidator.parseAndValidate()
                       │
              Lưu AiFeedbackEntity + AiRequestEntity
                       │
              Spring Event → VocabularyExtractorService
              Extract vocab → lưu VocabularyItem
```

---

### AI Providers đang tích hợp

| Provider | API | Model cheap | Model strong | Trạng thái |
|---|---|---|---|---|
| **OpenAI** | `api.openai.com/v1` | `gpt-4o-mini` | `gpt-4o` | ✅ Có code, cần API key |
| **Anthropic (Claude)** | `api.anthropic.com/v1` | `claude-haiku-*` | `claude-sonnet-*` | ✅ Có code, cần API key |
| **Google Gemini** | — | `gemini-flash` | `gemini-pro` | ⚠️ Có trong enum, chưa implement |

### Prompt Structure (gửi lên AI)

**System prompt** (tự động build theo mode + correctionStyle):
```
You are an expert English writing coach specializing in [IELTS Task 2 / Daily English...].
[Focus on grammar correction / Rewrite as native speaker / Target Band 7-8...]

Respond ONLY with valid JSON matching this schema exactly:
{
  "version": "1.0",
  "correctedText": "...",
  "corrections": [{"original","corrected","explanation","type","severity","position"}],
  "vocabularySuggestions": [{"word","alternatives","collocations","cefrLevel","definition","exampleSentence"}],
  "rewrittenSentences": [{"original","rewritten","reason","style"}],
  "ieltsScore": {"band","taskAchievement","coherenceCohesion","lexicalResource","grammaticalRange","feedback"},
  "analytics": {"grammarAccuracy","fluencyScore","lexicalDiversity","naturalnessScore","estimatedCefrLevel","sentenceCount","avgSentenceLength"},
  "confidence": 0.0
}
```

**User prompt** (gửi cùng bài viết của user):
```
Task prompt: [đề bài nếu có]
User CEFR level: B2
User's writing:
[toàn bộ nội dung bài viết]
```

### Chi phí API AI (ước tính)

| Model | Input | Output | 1 bài ~500 từ ≈ |
|---|---|---|---|
| GPT-4o-mini | $0.15/1M tokens | $0.60/1M tokens | ~$0.001 |
| GPT-4o | $2.50/1M tokens | $10/1M tokens | ~$0.02 |
| Claude Haiku 3.5 | $0.80/1M tokens | $4.00/1M tokens | ~$0.003 |
| Claude Sonnet 3.7 | $3.00/1M tokens | $15.00/1M tokens | ~$0.025 |

> Quota hiện tại: 50,000 tokens/user/ngày ≈ ~50 bài/ngày với GPT-4o-mini.

---

## 4. Ý tưởng: Tích hợp ChatGPT "Bring Your Own Key"

### Bạn muốn gì

Đăng nhập tài khoản ChatGPT của mình → viết bài trên app → app tự gửi prompt theo cấu trúc cố định vào ChatGPT → nhận về danh sách lỗi, vocab, collocation → có tùy chọn lưu vào flashcard.

---

### Phân tích các cách làm

#### Cách 1 — Dùng OpenAI API với key của chính bạn ⭐ Khuyến nghị

**Cách hoạt động:**
- User vào Settings → nhập OpenAI API key của họ (`sk-...`)
- App lưu key (encrypt trong DB), dùng key đó cho request của user đó
- Hoàn toàn độc lập — user chịu chi phí API của chính họ
- Cùng model với ChatGPT (GPT-4o), nhưng qua API không phải web

**Làm gì để implement:**
```
Backend:
- Thêm cột user_settings (JSON) trong bảng users
- Endpoint PATCH /api/v1/users/me/settings { "openaiApiKey": "sk-..." }
- AiProviderRouter: nếu user có key riêng → dùng key đó, không dùng key server

Frontend:
- Màn hình Settings → input "OpenAI API Key" (masked)
- Warning: "Key được lưu encrypted, chỉ dùng để gọi AI cho bạn"
```

**Chi phí:** Miễn phí cho server (user tự trả API fee). Không cần OpenAI subscription riêng.

**OpenAI API key lấy ở đâu:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys) — tạo free, trả tiền theo usage.

---

#### Cách 2 — ChatGPT web interface (dùng subscription $20/tháng, không phải API)

**Cách hoạt động:**
- Browser extension (Chrome/Firefox) inject vào trang chat.openai.com
- Khi user submit bài trên LexiFluent → extension tự mở ChatGPT tab, paste prompt, submit
- Extension đọc response → gửi về app qua `window.postMessage` hoặc local WebSocket
- App parse response → hiển thị feedback

**Ưu điểm:** Dùng ChatGPT Plus subscription ($20/tháng), không tốn thêm tiền API.

**Nhược điểm:**
- Phải build browser extension riêng (phức tạp)
- ChatGPT web có thể thay đổi DOM → extension hay bị hỏng
- Response format không guaranteed (ChatGPT web không có JSON mode ổn định)
- Chống lại ToS của OpenAI (automation)
- Chậm (phải chờ web render)

**Kết luận:** Không khuyến nghị cho production. Có thể làm proof of concept.

---

#### Cách 3 — Custom GPT + GPT Actions (ChatGPT Plus)

**Cách hoạt động:**
- Tạo một Custom GPT với system prompt của LexiFluent
- Cấu hình GPT Actions để gọi về `POST https://your-api.com/api/v1/...`
- User mở Custom GPT, paste bài viết → GPT tự gọi API → app nhận và lưu

**Ưu điểm:** Chuẩn, không vi phạm ToS.

**Nhược điểm:** UX không liền mạch (phải mở ChatGPT riêng), chỉ cho ChatGPT Plus users.

---

### Recommended plan — implement "Bring Your Own Key"

Đây là cách thực tế nhất, implement được trong 1-2 ngày:

**Backend — thêm 3 thứ:**

```java
// 1. Thêm vào User entity
@Column(name = "openai_api_key_encrypted")
private String openaiApiKeyEncrypted;

// 2. Endpoint mới
PATCH /api/v1/users/me/settings
Body: { "openaiApiKey": "sk-..." }

// 3. AiProviderRouter — ưu tiên user key
public AiCompletion routeForUser(UUID userId, AiRequest request) {
    String userKey = userService.getDecryptedApiKey(userId);
    if (userKey != null) {
        return routeWithKey(userKey, request); // dùng key của user
    }
    return route(request); // fallback về key server
}
```

**Frontend — thêm màn hình Settings:**

```
/settings
├── AI Provider
│   ├── "Dùng AI của LexiFluent" (mặc định, tính vào quota)
│   └── "Dùng OpenAI API key của tôi" → input sk-...
├── Save to Flashcard
│   └── Toggle: "Tự động lưu từ vựng mới vào flashcard"
```

**Flashcard integration (sau khi có AI feedback):**

```
Writing Detail page → Tab Từ vựng
→ Mỗi VocabularySuggestion có nút "💾 Lưu flashcard"
→ POST /api/v1/flashcards { front: word, back: definition + example }
→ Toast: "Đã lưu 'crucial' vào flashcard"
```

---

## 5. Tóm tắt nhanh

```
Dùng được ngay (cần API key):     AI feedback, IELTS scoring, vocab extract
Dùng được không cần AI key:       Auth, writing submit/list, profile, onboarding
Cần implement thêm (không tốn phí): Flashcard, SRS, analytics auto-update, streak calendar
Cần implement thêm (có thể tốn phí): Notifications (email = SendGrid ~$15/tháng)
Ý tưởng "dùng ChatGPT của mình":  Implement "Bring Your Own API Key" — 1-2 ngày, free cho server
```
