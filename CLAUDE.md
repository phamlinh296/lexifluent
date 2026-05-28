# LexiFluent — AI Writing Coach Platform

## Stack
- **Backend**: Java 21, Spring Boot 3.4.1, Spring AI 1.0.0
- **DB**: MySQL 8.0+ + Flyway migrations (switched from PostgreSQL)
- **Cache**: Redis 7 (refresh tokens, AI response cache, rate limiting)
- **Messaging**: Kafka (async AI pipeline only)
- **Base package**: `org.linh.lexi`

## Module Structure
```
org.linh.lexi
├── common/          # BaseEntity, ApiResponse, exceptions, security config
├── auth/            # JWT login/register, refresh token rotation
├── user/            # User profile
├── writing/         # Writing entries, revisions, modes
├── ai/              # Provider abstraction, orchestration, prompt templates, usage tracking
│   ├── provider/    # OpenAI, Claude, Gemini implementations (strategy pattern)
│   ├── orchestration/
│   ├── prompt/
│   └── usage/
├── vocabulary/      # Auto-extracted vocab, collocations, grammar patterns
├── flashcard/       # Flashcards + spaced repetition
├── review/          # Recurring mistake review
├── analytics/       # UserProgress, writing stats, IELTS band estimate
└── notification/
```

## Database Key Tables
- `users` — profile, CEFR level, writing streak, onboarding status
- `refresh_tokens` — stored in Redis (not DB); table is audit-only
- `writing_entries` — mode (DAILY_ENGLISH/IELTS_TASK1/IELTS_TASK2), status (DRAFT/SUBMITTED/PROCESSED)
- `writing_revisions` — snapshot per AI feedback cycle
- `ai_feedbacks` — links writing_entry + ai_request, stores structured JSON output
- `ai_requests` — tracks every AI call: provider, model, tokens, latency, status
- `ai_usage_logs` — per-user daily token quota tracking
- `prompt_templates` — versioned prompts per mode+correction_style
- `vocabulary_items` — extracted per writing_entry, CEFR level tagged
- `collocations` — extracted collocations linked to vocabulary
- `flashcards` — auto-generated from vocab, SRS (spaced repetition) scheduling
- `review_histories` — flashcard review log (ease factor, interval, next_review_at)
- `recurring_mistakes` — aggregated mistake patterns per user
- `user_progress` — denormalized analytics: accuracy, fluency, ielts_band, streaks
- `audit_logs` — immutable append-only for security events

## BaseEntity
```java
// UUID pk, createdAt, updatedAt, createdBy, updatedBy, deletedAt (soft delete)
// Auditing via Spring Data @CreatedDate, @LastModifiedDate, @CreatedBy
```

## Enum Strategy
- Stored as `VARCHAR` (not ordinal) in DB
- `WritingMode`: DAILY_ENGLISH, IELTS_TASK1, IELTS_TASK2
- `CorrectionStyle`: GRAMMAR_CORRECTION, NATURAL_REWRITE, NATIVE_REWRITE, IELTS_BAND_6, IELTS_BAND_7_8
- `WritingStatus`: DRAFT, SUBMITTED, AI_PROCESSING, PROCESSED, FAILED
- `AiProvider`: OPENAI, CLAUDE, GEMINI
- `AiModel`: GPT4O_MINI (cheap), GPT4O (strong), CLAUDE_HAIKU, CLAUDE_SONNET, GEMINI_FLASH, GEMINI_PRO

## AI Provider Routing
- Cheap model (GPT-4o-mini / Claude Haiku) → grammar correction, vocabulary extraction
- Strong model (GPT-4o / Claude Sonnet) → IELTS evaluation, native rewrite
- Fallback chain: primary provider → fallback provider (configured per environment)
- All responses are structured JSON, schema-validated before saving

## AI Response Schema (core fields)
```json
{
  "version": "1.0",
  "correctedText": "...",
  "corrections": [{ "original", "corrected", "explanation", "type", "severity" }],
  "vocabularySuggestions": [{ "word", "suggestions", "collocations", "cefrLevel" }],
  "rewrittenSentences": [{ "original", "rewritten", "reason" }],
  "ieltsScore": { "band", "taskAchievement", "coherence", "lexicalResource", "grammaticalRange" },
  "analytics": { "grammarAccuracy", "lexicalDiversity", "fluencyScore", "estimatedCefrLevel" },
  "confidence": 0.0–1.0
}
```

## Kafka Pipeline (event-driven, durable)
```
POST /api/v1/writing
  → WritingService.submit()
  → publish writing.submitted (key = writingEntryId)
    → WritingSubmittedConsumer
      → AiOrchestrationService.processWriting()
      → publish ai.feedback.generated
        → AiFeedbackGeneratedConsumer
          → VocabularyExtractorService.extractFromFeedback()
```
- Kafka `ack-mode: manual` — consumer tự ack sau khi xử lý xong, không ack nếu lỗi → Kafka redeliver
- Consumer groups: `ai-feedback-group`, `vocabulary-group` (tách nhau để scale độc lập)
- Producer: `acks=all`, `enable.idempotence=true` — không mất message

## Security
- JWT access token: 15 min, signed HS256
- Refresh token: 7 days, stored in Redis with key `rt:{userId}:{tokenId}`
- Refresh token rotation on every use (old token invalidated)
- Rate limiting via Redis sliding window

## API Versioning
- Prefix: `/api/v1/`
- Response envelope: `{ "success": bool, "data": T, "error": { "code", "message" }, "timestamp" }`

## Important Notes
- DB: MySQL 8.0+, `CHAR(36)` cho UUID, `DATETIME(6)` cho timestamp, `JSON` cho JSONB, `MEDIUMTEXT` cho nội dung dài, `TINYINT(1)` cho boolean
- DB migrations dùng `VARCHAR` + CHECK constraint thay vì DB enum type
- `BaseEntity` có `created_by`/`updated_by` — cần có cột đó trong bảng (đã có trong V1, V2)
- `AiOrchestrationService.processWritingAsync` chạy async qua Spring `@EventListener` + `@Async("aiTaskExecutor")`, không dùng Kafka cho flow MVP
- Kafka topics được định nghĩa trong `KafkaTopics.java` nhưng chưa có consumer — ready cho future scale
- Test profile dùng H2 in-memory, Flyway disabled

## Key Config Properties
- `lexi.jwt.secret`, `lexi.jwt.access-expiry`, `lexi.jwt.refresh-expiry`
- `lexi.ai.default-provider`, `lexi.ai.fallback-provider`
- `lexi.ai.quota.daily-tokens-per-user`
- `lexi.rate-limit.requests-per-minute`

## Feature Status (as of 2026-05-28)

### Backend — Implemented & Working
| Feature | Key Files |
|---------|-----------|
| Auth (JWT + refresh rotation) | `auth/` |
| Writing submit → AI pipeline (async via @EventListener + @Async) | `writing/`, `ai/orchestration/` |
| AI provider strategy (OpenAI/Claude/Gemini + BYOK) | `ai/provider/` |
| 2-call IELTS pipeline (scoring call + transformation call) | `AiOrchestrationService` |
| Vocabulary extraction from AI feedback | `vocabulary/VocabularyExtractorService` |
| Flashcard CRUD + SM-2 SRS (`applyReview`) | `flashcard/` |
| FlashcardType enum: BASIC / CLOZE / GRAMMAR_CORRECTION | `flashcard/domain/FlashcardType` |
| Auto-generate CLOZE cards from vocab exampleSentence | `VocabularyExtractorService.autoCreateClozeCard()` |
| Analytics auto-update after AI feedback (running avg + streak) | `analytics/service/AnalyticsService` |
| Per-entry writing analytics row | `analytics/domain/WritingAnalytics` |
| Recurring mistake tracking by type | `review/service/MistakeTrackerService` |
| Calendar API (writing activity heatmap) | `GET /api/v1/analytics/calendar?days=90` |
| User profile + BYOK (OpenAI/Gemini encrypted keys) | `user/` |

### Backend — Not yet implemented
- `notification/` module (table exists, no logic)
- `writing_revisions` table (defined in schema, no entity)
- `review_histories` table unused — SRS stored directly on `flashcards`
- Kafka consumers not active for MVP (using @Async instead)

### Frontend Pages — Implemented
| Page | Status |
|------|--------|
| `/dashboard` | Stats + recent writing + weak vocab |
| `/writing` | Writing list with pagination |
| `/writing/new` | Essay editor + submit |
| `/writing/[id]` | Full AI feedback (tabs: overview, IELTS, corrections, corrected, rewrite, vocab) |
| `/flashcards` | Study mode (snapshot deck, key-remount per card) + list mode |
| `/vocabulary` | All vocab / weak vocab, CEFR filter |
| `/progress` | Skill radar + activity calendar + recurring mistakes + IELTS/CEFR |
| `/settings` | BYOK API key setup |
| `/profile` | CEFR level update |
| `/(auth)` | Login / register / onboarding |

### Key Implementation Patterns
- **Flashcard study session**: deck is snapshotted on `startStudy()` — NOT reactive to query updates mid-session
- **VocabSuggestions saved state**: tracks `savedThisSession` set + checks existing flashcards by `front.toLowerCase()`
- **Analytics pipeline hook**: `AiOrchestrationService.triggerPostProcessing()` called after `saveFeedback()` — non-blocking (exceptions are caught + warned)
- **Mistake tracking**: groups AI corrections by `type` field, upserts `recurring_mistakes` (UNIQUE on user_id + mistake_type)
- **Streak logic**: yesterday → +1, today → no change, gap >1 day → reset to 1 (UTC date comparison)
