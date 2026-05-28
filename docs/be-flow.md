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
  - applicationEventPublisher.publishEvent(WritingSubmittedEvent)
       │
       ▼ (@EventListener + @Async("aiTaskExecutor") — chạy AFTER_COMMIT)
AiOrchestrationService.processWriting()
  1. entry.markProcessing() → status = AI_PROCESSING
  2. Tạo AiRequest record (provider, model, call_number=1)
  3. usageTracker.checkQuota(userId)
  4. ClassificationEngine.classify(entry, style, userId)   ← NEW: 3-tier
  5. promptComposer.buildScoringSystemPrompt(classification)
  6. promptComposer.buildUserPrompt(text, topicPrompt, cefrLevel)
  7. LLM Call 1 (IELTS) → AnalysisSchema (scores + analytics)
  8. promptComposer.buildTransformationSystemPrompt(classification)
  9. LLM Call 2 (IELTS) → TransformationSchema (corrections + vocab + rewrite)
     OR: LLM single call (Daily) → TransformationSchema
  10. Validate JSON schema; auto-retry nếu invalid
  11. saveFeedback() → AiFeedbackEntity
  12. entry.markProcessed()
  13. triggerPostProcessing():
       → AnalyticsService.updateAfterFeedback()
       → MistakeTrackerService.trackFromFeedback()
  14. publishVocabularyEvent() → Kafka (AiFeedbackGeneratedMessage)
       │
       ▼ (Kafka / future — hiện tại cũng dùng @EventListener)
VocabularyExtractorService.extractFromFeedback()
  - Parse vocabularySuggestions từ AI feedback
  - Upsert VocabularyItem
  - autoCreateClozeCard() → Flashcard(type=CLOZE)
```

**Error handling:**
- `AI_RESPONSE_INVALID` → auto-retry 1 lần với error context trong prompt
- Infra failure → Resilience4j `@Retry(name="aiOrchestration")` — transient errors
- Sau khi retry hết → `AiFailureMarkingService.markFailed()` → entry=FAILED, request=FAILED
- Post-processing failure → log.warn, không fail pipeline chính (fire-and-forget)

---

### AI Provider Routing

- Default provider: `GEMINI` (hiện tại), cấu hình qua `lexi.ai.default-provider`
- Fallback provider: `OPENAI` hoặc `CLAUDE`
- BYOK ưu tiên trước: Gemini key → OpenAI key → server key
- Nếu tất cả fail → `AI_PROVIDER_UNAVAILABLE`

---

## Module 4B — AI Prompt Engine (3-Tier Architecture)

Đây là phần quan trọng nhất về system design. Hiểu rõ cái này → hiểu cách build AI app enterprise-grade.

### Vấn đề với naive approach

```
❌ Sai: 1 giant prompt hardcode mọi thứ
   → Không personalize được
   → Không A/B test được
   → Token waste (luôn gửi mọi thứ dù không cần)

❌ Sai: 100 prompt files hardcode mọi combination
   → 3 modes × 5 styles × 6 essay_types × 7 bands = 630+ files
   → Nightmare để maintain
```

### Kiến trúc đúng: Prompt Composition

```
Final Prompt = [mode block] + [essay_type block?] + [band block?] + [weakness blocks?] + [pipeline block] + [schema block]

Key insight: optional blocks gracefully skipped nếu file không tồn tại
→ 10-20 reusable blocks → hàng ngàn valid combinations
```

### Tier 1 — ClassificationEngine (Zero cost, zero latency)

```java
WritingClassification classify(entry, style, userId)
```

| Input | Detection | Output |
|-------|-----------|--------|
| `topicPrompt` | Keyword matching | `EssayType` |
| `topicPrompt` | Keyword matching | `Task1Type` |
| `CorrectionStyle` | Enum mapping | `TargetBand` |
| `userId` | DB query (top 2) | `List<String> userWeaknesses` |

**Tại sao không dùng AI để classify?**
→ Keyword detection: 0ms, 0 tokens, deterministic. AI classify: ~500 tokens trước khi vào pipeline → không đáng.

**EssayType detection rules:**
```
"to what extent" / "do you agree" / "give your opinion" → OPINION
"discuss both" / "some people...others" → DISCUSSION
"advantages and disadvantages" / "outweigh" → ADVANTAGES_DISADVANTAGES
"problem"/"cause" + "solution" → PROBLEM_SOLUTION
2+ question marks → DOUBLE_QUESTION
fallback → DIRECT_QUESTION
```

**userWeaknesses từ đâu?**
→ `recurring_mistakes` table: mỗi khi AI trả correction, `MistakeTrackerService` upsert mistake_type (GRAMMAR, WORD_CHOICE, STRUCTURE...). Top 2 by occurrence_count được inject vào prompt.

### Tier 2 — PromptComposer (Dynamic assembly)

```java
// buildScoringSystemPrompt(WritingClassification ctx)
List<String> blocks = []
blocks += load("modes/ielts-task2.txt")           // required — throws nếu thiếu
blocks += loadOptional("essay_type/opinion.txt")  // optional — "" nếu thiếu
blocks += loadOptional("band/band_7_5.txt")       // optional
blocks += loadOptional("weakness/GRAMMAR.txt")    // optional (max 2)
blocks += load("pipeline/call1-scoring.txt")      // required
blocks += load("core/anti-hallucination.txt")     // required
blocks += load("core/json-schema-call1.txt")      // required
return joinNonBlank(blocks)
```

**`loadOptional()` vs `load()`:**
- `load()`: required block → throw `IllegalStateException` nếu file thiếu (fast-fail at startup)
- `loadOptional()`: optional block → return `""` nếu thiếu → safe to add new block types without migration

### Tier 3 — Prompt Block Files

```
resources/prompts/
  modes/       → define context: "You are evaluating an IELTS Task 2 essay"
  essay_type/  → define task-specific rules: opinion vs discussion vs problem-solution
  task1_type/  → define chart-specific guidance: bar chart vs process vs map
  band/        → define scoring calibration: Band 6.5 vs 7.0 vs 7.5 vs 8.0
  weakness/    → define user-specific focus: "This user has GRAMMAR errors, pay extra attention to..."
  styles/      → define transformation style: grammar-only vs natural vs native
  pipeline/    → define call objective: Call 1 = score only (no rewrite context)
  core/        → define output format + hallucination rules (always included)
```

**Tại sao file-based thay vì DB `prompt_templates`?**
- Git version control: `git diff` thấy ngay thay đổi prompt
- No migration needed khi sửa content
- `prompt_templates` table vẫn giữ trong DB → future: admin UI + A/B testing

### Tại sao Call 1 không có style block?

```
Call 1 (Scoring):
  modes/ + essay_type/ + band/ + weakness/ + call1-scoring.txt

Call 2 (Transformation):
  modes/ + styles/ + essay_type/ + weakness/ + call2-transformation.txt
```

`call1-scoring.txt` explicit: "Evaluate the ORIGINAL text. Do NOT produce rewrites."  
Nếu để style block (native rewrite) vào Call 1 → LLM biết nó sẽ rewrite → tends to inflate score.  
**Tách riêng → score phản ánh bài gốc, không bị bias bởi transformation context.**

### A/B Testing prompt blocks (future)

```
Muốn test: band_7_5.txt v1 vs v2
→ Tạo: band_7_5_v2.txt
→ Config flag: "ab.test.band-prompt=v2"
→ PromptComposer đọc flag → chọn file đúng
→ So sánh feedback quality + user satisfaction sau N submissions
```

Đây là lý do file-based + composition mạnh hơn hardcoded prompt.

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

## System Design Decisions — WHY

Phần này quan trọng cho system design thinking. Mỗi quyết định đều có trade-off.

### 1. Tại sao 2-call IELTS pipeline thay vì 1-call?

```
❌ 1-call: "Score the essay AND provide corrections and rewrites"
   → LLM biết nó sẽ rewrite → tends to score higher (bias)
   → Thực nghiệm: 1-call scoring sau khi thấy rewrite context → +0.3~0.5 band inflate

✅ 2-call:
   Call 1: "Evaluate the ORIGINAL text only. Return ONLY scores."
   Call 2: "Now provide corrections and rewrites." (không có score context)
   → Score của Call 1 = unbiased evaluation of original text
```

**Trade-off**: 2× token cost, 2× latency. Nhưng accuracy cao hơn → acceptable cho IELTS app.

### 2. Tại sao @Async + @EventListener thay vì Kafka (hiện tại)?

```
Kafka cần: broker running, topic config, consumer group, offset management
@Async cần: thread pool config (1 line)

MVP: @Async đủ — 1 user, 1 entry, 1 AI call
Scale: Kafka — N consumers competing, horizontal scale, replay on failure
```

**Key design choice**: Kafka topics và message schema đã được define (`KafkaTopics.java`, `WritingSubmittedMessage`). Khi cần scale → chỉ swap publisher + listener, **zero change to business logic**.

### 3. Tại sao refresh token lưu Redis thay vì DB?

| | Redis | DB |
|--|--|--|
| Invalidation | O(1) DEL → immediate | UPDATE + index lookup |
| Auto-expire | TTL built-in | Cần cleanup job |
| Read per request | Cache hit ~1ms | DB query ~10ms |
| Persistence | Optional (if needed) | Always |

**Rotation security**: mỗi refresh → token cũ DEL ngay → nếu attacker dùng old token → miss → 401 → detect theft. DB approach phải mark `is_revoked=true` → slower + không atomic.

### 4. Tại sao keyword classification thay vì AI-based?

```
AI classify: gọi thêm 1 LLM call → ~500 tokens → ~$0.0001 per request
             + latency ~500ms
             + non-deterministic (same input → different output sometimes)

Keyword match: 0ms, 0 cost, deterministic, testable với unit test
               Accuracy ~90% cho IELTS task types phổ biến (đủ tốt)
```

**Khi nào dùng AI để classify**: input quá phức tạp, nhiều ambiguity, hoặc classification ảnh hưởng trực tiếp đến business outcome quan trọng (ví dụ: content moderation). IELTS task type detection không cần AI-level accuracy.

### 5. Tại sao running average thay vì raw aggregation?

```sql
-- ❌ Raw approach: O(n) mỗi lần cần metric
SELECT AVG(grammar_accuracy) FROM writing_analytics WHERE user_id = ?

-- ✅ Running average: O(1) update
new_avg = (old_avg * count + new_value) / (count + 1)
UPDATE user_progress SET avg_grammar_accuracy = new_avg, entry_count = count + 1
```

**Trade-off**: running avg không chính xác 100% (floating point drift sau nhiều updates), nhưng với N < 10,000 entries per user → acceptable. Benefit: `/api/v1/analytics/progress` trả về O(1) thay vì O(n) query.

### 6. Tại sao fire-and-forget cho post-processing?

```java
try { analyticsService.update(snapshot); } catch { log.warn; }
try { mistakeTrackerService.track(...); } catch { log.warn; }
// Không throw → không fail main pipeline
```

**SLA thinking**: User expects AI feedback trong 30s. Analytics update failure → không ảnh hưởng user experience ngay lập tức. Tradeoff: analytics có thể miss 1 entry nếu DB lỗi thoáng qua. Acceptable for MVP; production → queue-based post-processing với retry.

### 7. Tại sao CLOZE flashcard thay vì BASIC?

```
BASIC: Q="What does 'proliferate' mean?" A="To increase rapidly"
  → Passive recall — nhớ definition nhưng không dùng được trong bài viết

CLOZE: "The use of smartphones has ___ in recent years." A="proliferated"
  → Active production — biết dùng trong context
  → IELTS graders score on USAGE, not just MEANING
```

**Auto-generate**: `VocabularyExtractorService.autoCreateClozeCard()` dùng `exampleSentence` từ AI feedback → replace target word bằng `___` → instant CLOZE card. Không cần user manually tạo.

### 8. Tại sao top 2 weakness trong prompt, không nhiều hơn?

```
0 weakness → generic feedback, no personalization
1 weakness → okay, có personalization
2 weakness → sweet spot: focused coaching, không overwhelm
3+ weakness → prompt bloat → LLM bị distracted → quality giảm
             → token cost tăng không đáng
```

Threshold được chọn empirically. Có thể config thành `lexi.ai.max-weakness-injection` sau nếu cần A/B test.

---

## Module Dependency Map

```
┌──────────┐   ┌──────────┐   ┌──────────────┐
│  auth/   │   │  user/   │   │  writing/    │
└──────────┘   └──────────┘   └──────────────┘
                                      │
                                      ↓ WritingSubmittedEvent
                         ┌────────────────────────┐
                         │   ai/orchestration/    │
                         │  AiOrchestrationService│
                         └────────────────────────┘
                           │           │         │
              ┌────────────┘    ┌──────┘    ┌────┘
              ↓                 ↓           ↓
      ai/classification/   ai/prompt/   ai/provider/
      ClassificationEngine PromptComposer OpenAI/Claude/Gemini
              │
              ↓ (query top weaknesses)
          review/RecurringMistakeRepository
              │
              ↓ (after saveFeedback)
    ┌─────────────────────────────┐
    │    triggerPostProcessing    │
    └─────────────────────────────┘
           │                │
           ↓                ↓
    analytics/         review/
    AnalyticsService   MistakeTrackerService
           │
           ↓ publishVocabularyEvent (Kafka)
    vocabulary/
    VocabularyExtractorService
           │
           ↓ autoCreateClozeCard
    flashcard/
    FlashcardService
```

**Dependency rule**: lower modules không import higher modules.
- `ai/` không biết `flashcard/` — chỉ publish event
- `vocabulary/` không import `ai/` — consume event
- `analytics/` + `review/` chỉ được gọi từ `ai/orchestration/` (1 direction)

---

## Scalability Path

```
MVP (hiện tại):
  HTTP → @EventListener → @Async(aiTaskExecutor) → LLM API

Scale Step 1: Kafka active
  HTTP → Kafka(writing.submitted) → WritingSubmittedConsumer → LLM API
  Benefit: multiple consumers competing → parallel AI processing

Scale Step 2: Service separation
  WritingService (write API only)
  AiProcessorService (Kafka consumer + LLM)
  VocabularyService (Kafka consumer + extraction)

Scale Step 3: Response caching
  hash(originalText + mode + style) → Redis cache
  Cache hit → return saved feedback instantly, 0 LLM cost
  Benefit: same essay submitted by 2 users → 2nd is free

Scale Step 4: Prompt versioning via DB
  prompt_templates table (already defined)
  Admin UI: edit prompt → version++, is_active=true
  PromptLoader: load from DB instead of classpath
  → Prompt changes without deploy, A/B test per user segment
```

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
