# LexiFluent — Backend Flow & Business Logic

## Tổng quan hệ thống

LexiFluent là nền tảng AI Writing Coach giúp người dùng luyện viết tiếng Anh. Backend xử lý:
- Xác thực người dùng (email/password + Google OAuth2)
- Nhận bài viết, kích hoạt AI pipeline async
- Trả về feedback chi tiết từ AI (lỗi ngữ pháp, vocabulary, IELTS score...)
- Tự động extract và lưu từ vựng mới
- Theo dõi progress và writing streak của người dùng

---

## Response Envelope (tất cả API)

```json
// Thành công
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2025-05-27T10:00:00Z"
}

// Thất bại
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid email or password"
  },
  "timestamp": "2025-05-27T10:00:00Z"
}
```

## Pagination Response (các API có list)

```json
{
  "success": true,
  "data": {
    "content": [ ... ],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}
```

---

## Module 1 — Auth

### Đăng ký tài khoản

**POST** `/api/v1/auth/register`

Request:
```json
{
  "email": "user@example.com",
  "password": "min8chars",
  "displayName": "Nguyen Van A"
}
```

Response: `AuthResponse` (xem bên dưới)

Business rules:
- Email phải unique, nếu đã tồn tại → `AUTH_005`
- Password hash bằng BCrypt trước khi lưu
- Provider = `LOCAL`, role = `USER`
- Trả về access token + refresh token ngay sau khi đăng ký

---

### Đăng nhập

**POST** `/api/v1/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response: `AuthResponse`

Business rules:
- Nếu email không tồn tại hoặc password sai → `AUTH_001` (cùng lỗi, không leak info)
- Nếu tài khoản bị disable → `AUTH_006`

---

### AuthResponse (trả về khi register/login/refresh)

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "displayName": "Nguyen Van A",
  "accessToken": "eyJhbGci...",
  "refreshToken": "raw-uuid-string",
  "expiresIn": 900
}
```

---

### Refresh Access Token

**POST** `/api/v1/auth/refresh?token={refreshToken}`

Response: `AuthResponse` mới (access token + refresh token mới)

Business rules:
- **Refresh token rotation**: mỗi lần refresh, token cũ bị revoke, client nhận token mới
- Nếu dùng lại token đã revoke → phát hiện theft → revoke ALL token của user → `AUTH_004`
- Token hết hạn (7 ngày) → `AUTH_004`

---

### Logout

**POST** `/api/v1/auth/logout`  
Headers: `Authorization: Bearer {accessToken}`

Response: `204 No Content`

Business rules:
- Revoke tất cả refresh token của user đó
- Access token vẫn valid cho đến khi hết 15 phút (stateless JWT) — frontend phải xóa local

---

### Google OAuth2

**Flow:**
1. FE redirect user đến: `GET /oauth2/authorization/google`
2. Google xác thực, callback về backend
3. Backend find-or-create user:
   - Nếu email chưa có → tạo user mới với provider=GOOGLE, onboarded=false
   - Nếu email đã có (đăng ký local trước) → gắn googleId vào
4. Backend redirect về FE với tokens trong query string:

```
http://localhost:3000/oauth/callback
  ?access_token=eyJhbGci...
  &refresh_token=rawToken
  &expires_in=900
```

5. FE đọc tokens từ URL, lưu vào storage, redirect về app

---

### JWT Access Token

- Algorithm: HS256
- Expiry: 15 phút (900 giây)
- Claims: `userId`, `email`, `role`, `provider`, `tokenVersion`
- Gửi trong header: `Authorization: Bearer {token}`

**tokenVersion**: khi user đổi password hoặc logout-all, tokenVersion tăng → tất cả JWT cũ bị reject dù chưa hết hạn

---

## Module 2 — User

### Lấy thông tin bản thân

**GET** `/api/v1/users/me`  
Headers: `Authorization: Bearer {token}`

Response: `User` object
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "Nguyen Van A",
  "avatarUrl": "https://...",
  "role": "USER",
  "provider": "LOCAL",
  "cefrLevel": "B2",
  "writingStreak": 5,
  "lastActiveDate": "2025-05-27",
  "onboarded": true,
  "active": true
}
```

---

### Cập nhật profile

**PATCH** `/api/v1/users/me`  
Headers: `Authorization: Bearer {token}`

Request (các field đều optional):
```json
{
  "displayName": "New Name",
  "cefrLevel": "C1"
}
```

Business rules:
- `cefrLevel` enum: `A1`, `A2`, `B1`, `B2`, `C1`, `C2`
- `cefrLevel` quan trọng — AI dùng để tùy chỉnh độ khó feedback
- `onboarded` field: frontend dùng để biết cần show màn hình onboarding không

---

## Module 3 — Writing

### Submit bài viết

**POST** `/api/v1/writing`  
Headers: `Authorization: Bearer {token}`

Request:
```json
{
  "mode": "IELTS_TASK2",
  "correctionStyle": "IELTS_BAND_7_8",
  "text": "In today's society, technology plays...",
  "title": "Technology and Education",
  "topicPrompt": "Some people believe technology has made life easier..."
}
```

**WritingMode:**
- `DAILY_ENGLISH` — luyện viết tiếng Anh hàng ngày, không có đề
- `IELTS_TASK1` — mô tả biểu đồ/bảng số liệu
- `IELTS_TASK2` — nghị luận IELTS

**CorrectionStyle:**
- `GRAMMAR_CORRECTION` — chỉ sửa lỗi ngữ pháp
- `NATURAL_REWRITE` — viết lại tự nhiên hơn
- `NATIVE_REWRITE` — viết lại theo phong cách native speaker
- `IELTS_BAND_6` — feedback theo tiêu chí IELTS band 6
- `IELTS_BAND_7_8` — feedback nâng cao, dùng strong AI model

Validation:
- `text`: 20–5000 ký tự
- `mode` và `correctionStyle` không được null

Response: `WritingEntryDto` với status = `SUBMITTED`

```json
{
  "id": "uuid",
  "mode": "IELTS_TASK2",
  "correctionStyle": "IELTS_BAND_7_8",
  "title": "Technology and Education",
  "originalText": "In today's society...",
  "wordCount": 250,
  "status": "SUBMITTED",
  "topicPrompt": "Some people believe...",
  "submittedAt": "2025-05-27T10:00:00Z",
  "processedAt": null,
  "createdAt": "2025-05-27T10:00:00Z"
}
```

**Writing Status Flow:**
```
DRAFT → SUBMITTED → AI_PROCESSING → PROCESSED
                                  → FAILED
```

---

### Danh sách bài viết

**GET** `/api/v1/writing?mode=IELTS_TASK2&page=0&size=20`

- `mode` optional — nếu không có thì lấy tất cả mode
- Sắp xếp: mới nhất trước (`createdAt DESC`)
- Soft-deleted entries không hiển thị

---

### Lấy chi tiết bài viết

**GET** `/api/v1/writing/{id}`

Response: `WritingEntryDto`

---

### Xóa bài viết

**DELETE** `/api/v1/writing/{id}`

Response: `204 No Content`

Business rules:
- Soft delete (không xóa DB)
- Không thể xóa nếu status = `AI_PROCESSING` → `WRITING_002`

---

## Module 4 — AI Pipeline (Async)

Đây là core feature của LexiFluent. Pipeline chạy **async** sau khi user submit bài viết.

### Flow chi tiết

```
POST /api/v1/writing
       │
       ▼
WritingService.submit()
  - Tạo WritingEntry (status=SUBMITTED)
  - Publish Kafka: writing.submitted
       │
       ▼ (async, Kafka consumer)
WritingSubmittedConsumer → AiOrchestrationService.processWriting()
  1. Đánh dấu status = AI_PROCESSING
  2. Tạo AiRequest record (provider, model, status=PENDING)
  3. Kiểm tra daily quota (lexi.ai.quota.daily-tokens-per-user)
  4. Build system prompt theo (mode + correctionStyle)
  5. Build user prompt theo (text + topicPrompt + cefrLevel)
  6. Chọn model:
     - IELTS + BAND_7_8 → strong model (GPT-4o)
     - Các trường hợp khác → cheap model (GPT-4o-mini)
  7. Gọi AI provider (primary: OpenAI, fallback: Claude)
  8. Validate JSON schema response
  9. Lưu AiFeedbackEntity
  10. Cập nhật AiRequest (tokens, latency, status=SUCCESS)
  11. Đánh dấu WritingEntry status = PROCESSED
  12. Publish Kafka: ai.feedback.generated
       │
       ▼ (async, Kafka consumer)
AiFeedbackGeneratedConsumer → VocabularyExtractorService.extractFromFeedback()
  - Parse vocabularySuggestions từ AI feedback
  - Nếu từ chưa có → tạo VocabularyItem mới
  - Nếu từ đã có → incrementEncounterCount
```

**Error handling:**
- Nếu AI gọi thất bại → retry (Resilience4j `@Retry`)
- Sau khi retry hết → WritingEntry status = FAILED, AiRequest status = FAILED
- Kafka consumer không ack → Kafka redeliver

---

### AI Provider Routing

- Default provider: `OPENAI`
- Fallback provider: `CLAUDE`
- Nếu primary lỗi → tự động chuyển sang fallback
- Nếu cả 2 đều lỗi → `AI_001`

---

## Module 5 — AI Feedback

### Lấy feedback của bài viết

**GET** `/api/v1/writing/{entryId}/feedback`  
Headers: `Authorization: Bearer {token}`

Response: `AiFeedbackSchema`

```json
{
  "version": "1.0",
  "correctedText": "In today's society, technology plays a crucial role...",
  "corrections": [
    {
      "original": "play",
      "corrected": "plays",
      "explanation": "Subject-verb agreement: 'technology' is singular",
      "type": "GRAMMAR",
      "severity": "HIGH",
      "position": 35
    }
  ],
  "vocabularySuggestions": [
    {
      "word": "crucial",
      "alternatives": ["vital", "essential", "pivotal"],
      "collocations": ["play a crucial role", "crucial factor"],
      "cefrLevel": "C1",
      "definition": "Extremely important",
      "exampleSentence": "Technology plays a crucial role in modern education."
    }
  ],
  "rewrittenSentences": [
    {
      "original": "Technology is very important for people.",
      "rewritten": "Technology has become indispensable in contemporary life.",
      "reason": "More sophisticated vocabulary and structure",
      "style": "NATIVE"
    }
  ],
  "ieltsScore": {
    "band": 6.5,
    "taskAchievement": 7.0,
    "coherenceCohesion": 6.5,
    "lexicalResource": 6.0,
    "grammaticalRange": 6.5,
    "feedback": "Good argument structure but needs more varied vocabulary..."
  },
  "analytics": {
    "grammarAccuracy": 0.85,
    "fluencyScore": 0.72,
    "lexicalDiversity": 0.68,
    "naturalnessScore": 0.75,
    "estimatedCefrLevel": "B2",
    "sentenceCount": 12,
    "avgSentenceLength": 18.5
  },
  "confidence": 0.92
}
```

**Correction types:** `GRAMMAR`, `SPELLING`, `PUNCTUATION`, `WORD_CHOICE`, `STRUCTURE`  
**Correction severity:** `LOW`, `MEDIUM`, `HIGH`  
**Rewritten style:** `NATURAL`, `NATIVE`, `FORMAL`, `CONCISE`

Note:
- `ieltsScore` chỉ có giá trị khi mode = `IELTS_TASK1` hoặc `IELTS_TASK2`
- Feedback được lấy mới nhất (latest) cho mỗi entry

---

## Module 6 — Vocabulary

### Danh sách từ vựng

**GET** `/api/v1/vocabulary?page=0&size=30`

Response: Paginated `VocabularyItem`

```json
{
  "id": "uuid",
  "userId": "uuid",
  "writingEntryId": "uuid",
  "word": "crucial",
  "definition": "Extremely important",
  "exampleSentence": "Technology plays a crucial role...",
  "cefrLevel": "C1",
  "mastered": false,
  "encounterCount": 3,
  "createdAt": "2025-05-27T10:00:00Z"
}
```

- `encounterCount`: số lần từ này xuất hiện trong feedback AI (tăng mỗi lần gặp lại)
- `mastered`: chưa có API update, dùng cho flashcard SRS (planned)

---

### Từ vựng chưa thành thạo (weak vocabulary)

**GET** `/api/v1/vocabulary/weak?page=0&size=20`

- Filter: `mastered = false`
- Sắp xếp: từ gặp nhiều nhất trước (`encounterCount DESC`)
- Dùng cho màn hình ôn tập / flashcard

---

## Module 7 — Analytics

### Tiến độ học tập

**GET** `/api/v1/analytics/progress`  
Headers: `Authorization: Bearer {token}`

Response: `UserProgress`

```json
{
  "id": "uuid",
  "userId": "uuid",
  "totalEntries": 42,
  "totalWordsWritten": 18500,
  "avgGrammarAccuracy": 0.83,
  "avgFluencyScore": 0.75,
  "avgLexicalDiversity": 0.71,
  "estimatedIeltsBand": 6.5,
  "estimatedCefr": "B2",
  "vocabularyMastered": 120,
  "currentStreak": 7,
  "longestStreak": 21,
  "lastUpdatedAt": "2025-05-27T10:00:00Z"
}
```

---

## Error Codes

| Code | HTTP | Ý nghĩa |
|---|---|---|
| `AUTH_001` | 401 | Email/password sai |
| `AUTH_002` | 401 | Access token hết hạn |
| `AUTH_003` | 401 | Token không hợp lệ |
| `AUTH_004` | 401 | Refresh token hết hạn hoặc đã dùng |
| `AUTH_005` | 409 | Email đã tồn tại |
| `AUTH_006` | 403 | Tài khoản bị khóa |
| `USER_001` | 404 | User không tìm thấy |
| `WRITING_001` | 404 | Bài viết không tìm thấy |
| `WRITING_002` | 409 | Bài viết đang được AI xử lý |
| `WRITING_003` | 400 | Bài viết quá ngắn (< 20 chữ) |
| `AI_001` | 503 | AI provider không khả dụng |
| `AI_002` | 429 | Hết quota AI hàng ngày |
| `AI_003` | 500 | AI trả về response không hợp lệ |
| `AI_004` | 404 | Không tìm thấy AI feedback |
| `VALIDATION_001` | 400 | Request validation thất bại |
| `GENERIC_001` | 404 | Resource không tìm thấy |
| `GENERIC_002` | 403 | Không có quyền truy cập |
| `GENERIC_004` | 429 | Rate limit exceeded |

---

## Database Tables — Tổng quan

| Table | Mô tả | Có API |
|---|---|---|
| `users` | Tài khoản + profile | Có |
| `refresh_tokens` | Refresh token (hashed, có rotation) | Qua auth flow |
| `writing_entries` | Bài viết của user | Có |
| `ai_requests` | Log mỗi lần gọi AI | Chưa (internal) |
| `ai_feedbacks` | Feedback từ AI | Có (read-only) |
| `ai_usage_logs` | Quota tracking theo ngày/user | Chưa |
| `prompt_templates` | Prompt versioning theo mode | Chưa |
| `vocabulary_items` | Từ vựng auto-extract từ feedback | Có |
| `collocations` | Collocation của từ vựng | Planned |
| `flashcards` | Flashcard auto-gen từ vocab | Planned |
| `review_histories` | Lịch sử review SRS | Planned |
| `recurring_mistakes` | Lỗi hay mắc của user | Planned |
| `user_progress` | Analytics tổng hợp | Có |
| `writing_analytics` | Analytics per-entry | Planned |
| `notifications` | Thông báo | Planned |
| `audit_logs` | Security audit | Internal |

---

## Toàn bộ API Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh?token={token}
POST   /api/v1/auth/logout
GET    /oauth2/authorization/google
GET    /oauth/callback (Google redirect — handled by backend)

GET    /api/v1/users/me
PATCH  /api/v1/users/me

POST   /api/v1/writing
GET    /api/v1/writing?mode={mode}&page={p}&size={s}
GET    /api/v1/writing/{id}
DELETE /api/v1/writing/{id}

GET    /api/v1/writing/{entryId}/feedback

GET    /api/v1/vocabulary?page={p}&size={s}
GET    /api/v1/vocabulary/weak?page={p}&size={s}

GET    /api/v1/analytics/progress

PATCH  /api/v1/users/me/settings
POST   /api/v1/flashcards
GET    /api/v1/flashcards?dueOnly={bool}
POST   /api/v1/flashcards/{id}/review
DELETE /api/v1/flashcards/{id}
```

---

## Base URL

- Development: `http://localhost:8080`
- OAuth2 redirect (FE): `http://localhost:3000/oauth/callback`

---

## BYOK (Bring Your Own Key) — AI Provider Routing

### Mục đích
Cho phép user dùng AI key của chính họ thay vì tiêu quota server. Ưu tiên: Gemini BYOK (free) → OpenAI BYOK → server key.

### API

```
PATCH /api/v1/users/me/settings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "openaiApiKey": "sk-...",    // null = không thay đổi, "" = xóa key
  "geminiApiKey": "AIzaSy..."  // null = không thay đổi, "" = xóa key
}
```

Response: trả về User object với `openaiKeyConfigured: true/false`, `geminiKeyConfigured: true/false`. Raw key **không bao giờ** được trả về.

### Storage & Security
- Key được encrypt bằng AES-256-GCM trước khi lưu vào `users.openai_api_key_encrypted` / `users.gemini_api_key_encrypted`
- Encryption key derive từ `lexi.jwt.secret` qua SHA-256 (hoặc cấu hình `lexi.encryption.key` riêng)
- Response JSON dùng `@JsonIgnore` trên encrypted fields + `@JsonProperty` boolean computed getters

### AI Routing Flow (khi user submit bài viết)

```
AiOrchestrationService.processWriting()
  └─ routeWithByok(entry, aiRequest)
       ├─ user.geminiApiKeyEncrypted != null?
       │    YES → decrypt → GeminiProvider.completeWithKey(request, geminiKey)
       │          └─ Gemini 1.5 Flash (free 1M tokens/ngày, user's key)
       │          └─ fallback nếu fail: thử OpenAI BYOK
       ├─ user.openaiApiKeyEncrypted != null?
       │    YES → decrypt → OpenAiProvider.completeWithKey(request, openaiKey)
       │          └─ GPT-4o-mini/4o với key của user (user tự chịu phí)
       └─ NO KEY → providerRouter.route(request)
                    └─ dùng server key, trừ vào quota chung
```

### Gemini API (free tier)
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}`
- Model cố định: `gemini-1.5-flash` (free tier — không dùng model strong vì BYOK là free)
- Request format khác OpenAI: dùng `systemInstruction` + `contents` + `generationConfig.responseMimeType=application/json`
- Lấy key miễn phí: `ai.google.dev` → "Get API key" (không cần credit card)

---

## Flashcard & SRS (Spaced Repetition)

### Entities
- `flashcards` table: `user_id`, `vocabulary_item_id` (optional link to AI vocab), `front`, `back`, `cefr_level`, SM-2 fields (`ease_factor`, `interval_days`, `review_count`, `next_review_at`, `last_reviewed_at`)

### API

```
POST /api/v1/flashcards
Body: { "front": "crucial", "back": "definition\nVí dụ: ...\nCollocations: ...", "cefrLevel": "B2", "vocabularyItemId": "uuid-optional" }
→ Tạo flashcard. Nếu vocabularyItemId đã tồn tại → trả về existing, không tạo duplicate.

GET /api/v1/flashcards?dueOnly=false
→ Trả list tất cả flashcard. dueOnly=true → chỉ thẻ đến hạn ôn (nextReviewAt <= now).

POST /api/v1/flashcards/{id}/review
Body: { "quality": 3 }   // 0-5: 0=không nhớ, 3=nhớ được, 5=dễ
→ Áp dụng SM-2 algorithm, cập nhật nextReviewAt.

DELETE /api/v1/flashcards/{id}
→ Xóa vĩnh viễn (không soft delete).
```

### SM-2 Algorithm (applyReview)

```
quality < 3 (fail):
  intervalDays = 1               ← reset về ngày mai
quality >= 3 (pass):
  if intervalDays == 0: interval = 1
  elif intervalDays == 1: interval = 6
  else: interval = round(intervalDays * easeFactor)

easeFactor = max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
nextReviewAt = now + intervalDays * 86400s
```

Ví dụ progression: 1 ngày → 6 ngày → 15 ngày → 38 ngày → ... (với quality=4, easeFactor=2.5)

### Flow: Lưu từ vựng từ AI feedback thành Flashcard

```
User mở /writing/{id} → Tab "Từ vựng"
  → Hiện VocabularySuggestion từ AiFeedbackEntity.vocabularySuggestions (JSON)
  → Bấm "Lưu flashcard" trên 1 từ
      → POST /api/v1/flashcards {
            front: "crucial",
            back: "important / ví dụ / collocations",
            cefrLevel: "B2"
        }
      → FlashcardService.create() → kiểm tra duplicate → lưu
      → Toast "Đã lưu flashcard"
User vào /flashcards → study mode → ôn theo SM-2
```

---

## AI Pipeline — Async Flow (MVP)

### Luồng thực tế (không cần Kafka chạy)

```
POST /api/v1/writing
  → WritingService.submit()
      1. Tạo WritingEntry (status=SUBMITTED), save vào DB
      2. applicationEventPublisher.publishEvent(WritingSubmittedApplicationEvent)
      → Transaction COMMIT (entry đã trong DB)
      3. Response trả về ngay: { status: "SUBMITTED", id: "..." }

  WritingEventListener.onWritingSubmitted()  ← chạy AFTER_COMMIT, thread pool "aiTaskExecutor"
      → AiOrchestrationService.processWriting()
          → entry.markProcessing() → status=AI_PROCESSING
          → routeWithByok() → gọi AI API
          → parse + validate JSON response
          → lưu AiFeedbackEntity + AiRequestEntity
          → entry.markProcessed() → status=PROCESSED
          → publishEvent(AiFeedbackGeneratedMessage)
              → VocabularyExtractorService → lưu VocabularyItem

FE polling: GET /api/v1/writing/{id} mỗi 3s cho đến status=PROCESSED|FAILED
```

### Tại sao AFTER_COMMIT quan trọng
Nếu dùng `@EventListener` thường, listener chạy trong cùng thread + transaction. Khi listener async chạy trên thread khác và đọc DB, entry có thể chưa được commit → `WritingEntry not found`. `@TransactionalEventListener(AFTER_COMMIT)` đảm bảo chỉ chạy sau khi transaction của `WritingService.submit()` commit thành công.

### Scale lên Kafka (future)
Khi cần scale, thêm lại `kafkaTemplate.send()` trong `WritingService` song song với Spring event. `WritingSubmittedConsumer` (Kafka `@KafkaListener`) đã sẵn sàng tiếp nhận.

---

## Lỗi 403 khi gọi API không có token

Spring Security 6 trả **403** (không phải 401) cho unauthenticated requests khi không có form login configured — đây là default của `Http403ForbiddenEntryPoint`.

**Nguyên nhân thường gặp:** thiếu `Authorization: Bearer <token>` header.

**Cách gọi đúng:**

```bash
# Bước 1: Đăng ký (nếu chưa có account)
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Password123!","displayName":"Test User"}'

# Bước 2: Đăng nhập → lấy accessToken
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Password123!"}'
# Response: { "data": { "accessToken": "eyJ...", "refreshToken": "..." } }

# Bước 3: Gọi API với token
curl -X POST http://localhost:8080/api/v1/writing \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJ...' \
  -d '{"mode":"IELTS_TASK1","correctionStyle":"IELTS_BAND_7_8","text":"..."}'
```

**Nếu muốn đổi thành 401:** thêm `AuthenticationEntryPoint` vào `SecurityConfig`:
```java
.exceptionHandling(ex -> ex
    .authenticationEntryPoint((req, res, e) -> res.sendError(401, "Unauthorized"))
)
```
