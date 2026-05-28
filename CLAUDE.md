# LexiFluent — AI Writing Coach Platform

## Stack
- **Backend**: Java 21, Spring Boot 3.4.1, Spring AI 1.0.0
- **DB**: MySQL 8.0+ + Flyway migrations
- **Cache**: Redis 7 (refresh tokens, rate limiting)
- **Messaging**: Kafka (defined, not active for MVP — using @Async instead)
- **Base package**: `org.linh.lexi`

## Module Structure
```
org.linh.lexi
├── common/          # BaseEntity, ApiResponse, exceptions, security config
├── auth/            # JWT login/register, refresh token rotation
├── user/            # User profile, BYOK API key storage (encrypted)
├── writing/         # WritingEntry, WritingMode, CorrectionStyle, WritingStatus
├── ai/
│   ├── classification/  # WritingClassification, ClassificationEngine, 4 enums
│   ├── provider/        # AiProvider interface + OpenAI/Claude/Gemini impls (Strategy)
│   ├── orchestration/   # AiOrchestrationService (2-call IELTS + 1-call Daily)
│   ├── prompt/          # PromptLoader (file-based + cache), PromptComposer (block assembly)
│   ├── schema/          # AnalysisSchema, TransformationSchema, AiFeedbackSchemaValidator
│   └── usage/           # AiUsageTracker (daily quota via Redis)
├── vocabulary/      # VocabularyExtractorService, auto-CLOZE card generation
├── flashcard/       # Flashcard CRUD + SM-2 SRS (applyReview)
├── review/          # RecurringMistake tracking, MistakeTrackerService
├── analytics/       # UserProgress, WritingAnalytics, AnalyticsService
└── notification/    # Table exists, no logic yet
```

## Database Key Tables
- `users` — profile, CEFR level, writing streak, onboarding, BYOK keys (encrypted)
- `writing_entries` — mode, correction_style, status, topic_prompt, original_text
- `ai_feedbacks` — corrected_text, corrections (JSON), ielts_score (JSON), analytics (JSON)
- `ai_requests` — provider, model, tokens, latency, call_number (1=scoring, 2=transform, null=daily)
- `ai_usage_logs` — per-user daily token tracking
- `prompt_templates` — table exists in schema, not used in code (file-based prompts instead)
- `vocabulary_items` — extracted per writing_entry, CEFR tagged
- `flashcards` — SRS fields: ease_factor, interval, next_review_at, FlashcardType (BASIC/CLOZE/GRAMMAR_CORRECTION)
- `recurring_mistakes` — UNIQUE(user_id, mistake_type), occurrence_count — feeds ClassificationEngine
- `user_progress` — denormalized analytics, running avg, streak
- `audit_logs` — immutable append-only

## Enums
```
WritingMode:        DAILY_ENGLISH | IELTS_TASK1 | IELTS_TASK2
CorrectionStyle:    GRAMMAR_CORRECTION | NATURAL_REWRITE | NATIVE_REWRITE | IELTS_BAND_6 | IELTS_BAND_7_8
WritingStatus:      DRAFT | SUBMITTED | AI_PROCESSING | PROCESSED | FAILED
AiProvider:         OPENAI | CLAUDE | GEMINI

# Classification enums (ai/classification/) — used by prompt engine only, not stored in DB
EssayType:    OPINION | DISCUSSION | ADVANTAGES_DISADVANTAGES | PROBLEM_SOLUTION | DOUBLE_QUESTION | DIRECT_QUESTION | NOT_APPLICABLE
Task1Type:    LINE_GRAPH | BAR_CHART | PIE_CHART | TABLE | MIXED_CHART | PROCESS | MAP | NOT_APPLICABLE
TargetBand:   BAND_6_0 | BAND_6_5 | BAND_7_0 | BAND_7_5 | BAND_8_0 | BAND_8_5 | NOT_APPLICABLE
ScoringFocus: BALANCED | TASK_RESPONSE | COHERENCE_COHESION | LEXICAL_RESOURCE | GRAMMATICAL_RANGE
```

## AI Prompt Engine — 3-Tier Architecture
See `docs/be-flow.md` for full design rationale.

### Tier 1 — Classification (`ai/classification/`)
```
WritingClassification = ClassificationEngine.classify(entry, style, userId)
  ↳ detectEssayType(topicPrompt)     → keyword matching → EssayType
  ↳ detectTask1Type(topicPrompt)     → keyword matching → Task1Type
  ↳ resolveTargetBand(style)         → enum mapping    → TargetBand
  ↳ mistakeRepo.findTop2(userId)     → DB query        → List<String> weaknesses
```

### Tier 2 — Prompt Engine (`ai/prompt/PromptComposer`)
```
buildScoringSystemPrompt(classification)
  = modes/{mode}.txt
  + essay_type/{essayType}.txt   (optional — loadOptional)
  + task1_type/{task1Type}.txt   (optional — loadOptional)
  + band/{targetBand}.txt        (optional — loadOptional)
  + weakness/{type}.txt × 2     (optional — loadOptional)
  + pipeline/call1-scoring.txt
  + core/anti-hallucination.txt
  + core/json-schema-call1.txt
```

### Tier 3 — Prompt Block Files (`resources/prompts/`)
```
prompts/
  modes/          ielts-task1, ielts-task2, daily-english
  styles/         grammar, natural, native, ielts6, ielts78
  essay_type/     opinion, discussion, advantages_disadvantages, problem_solution
  task1_type/     bar_chart, line_graph, pie_chart, table, process, map, mixed_chart
  band/           band_6_5, band_7_0, band_7_5, band_8_0
  weakness/       GRAMMAR, WORD_CHOICE, STRUCTURE, SPELLING, PUNCTUATION
  pipeline/       call1-scoring, call2-transformation
  core/           anti-hallucination, json-schema-call1, json-schema-call2, json-schema-daily
```
- `PromptLoader.load()` throws if file missing (required blocks)
- `PromptLoader.loadOptional()` returns `""` if file missing (optional blocks) — safe to add new blocks without breaking existing combos

## AI Pipeline Flow
```
POST /api/v1/writing/submit
  → WritingEventListener (Spring @EventListener + @Async)
    → AiOrchestrationService.processWriting()
      → ClassificationEngine.classify()           ← NEW
      → usageTracker.checkQuota()
      → [IELTS] executeIeltsPipeline()
          → PromptComposer.buildScoringSystemPrompt(classification)   ← enriched
          → LLM Call 1 → AnalysisSchema (IELTS scores + analytics)
          → PromptComposer.buildTransformationSystemPrompt(classification) ← enriched
          → LLM Call 2 → TransformationSchema (corrections + vocab + rewrite)
      → [Daily] executeDailyPipeline()
          → PromptComposer.buildDailySystemPrompt(classification)     ← enriched
          → LLM Call  → TransformationSchema (corrections + analytics)
      → saveFeedback()
      → triggerPostProcessing()
          → AnalyticsService.updateAfterFeedback()
          → MistakeTrackerService.trackFromFeedback()
      → publishVocabularyEvent() → Kafka (vocab extraction)
```

## IELTS 2-Call Design
- **Call 1 (Scoring)**: examiner evaluates raw text only — no rewrite context → prevents score inflation
- **Call 2 (Transformation)**: corrections + rewrites + vocabulary extraction
- Schema validation on each call; auto-retry with error context on `AI_RESPONSE_INVALID`
- `ai_requests.call_number`: 1 = scoring, 2 = transform, null = daily (single call)

## BYOK (Bring Your Own Key)
- User can store Gemini/OpenAI API keys (AES-encrypted in DB)
- `routeWithByok()`: tries Gemini BYOK → OpenAI BYOK → server provider (fallback chain)
- Benefit: bypasses server quota; user pays their own LLM costs

## Security
- JWT access: 15 min, HS256; refresh: 7 days → Redis key `rt:{userId}:{tokenId}`
- Refresh token rotation on every use (old invalidated immediately)
- Rate limiting: Redis sliding window
- Enum stored as VARCHAR (not ordinal) — safe to reorder without migration

## API
- Prefix: `/api/v1/`
- Envelope: `{ "success": bool, "data": T, "error": { "code", "message" }, "timestamp" }`

## Key Config
```yaml
lexi.jwt.secret / access-expiry / refresh-expiry
lexi.ai.default-provider / fallback-provider
lexi.ai.cheap-model / strong-model
lexi.ai.quota.daily-tokens-per-user
lexi.rate-limit.requests-per-minute
```

## Important Notes
- DB: `CHAR(36)` UUID, `DATETIME(6)` timestamp, `JSON` for JSONB, `MEDIUMTEXT` for long text, `TINYINT(1)` bool
- Migrations use `VARCHAR` + CHECK constraint (not DB ENUM type) → easier to add values
- Test profile: H2 in-memory, Flyway disabled
- Kafka topics defined in `KafkaTopics.java` but consumers inactive — `@Async` used for MVP
- `writing_revisions` table exists in schema but no entity/logic yet
- `review_histories` table unused — SRS stored directly on `flashcards.ease_factor/interval`

## Feature Status (2026-05-28)

### Backend — Implemented
| Feature | Key Files |
|---------|-----------|
| Auth (JWT + refresh rotation) | `auth/` |
| Writing submit → AI pipeline (@EventListener + @Async) | `writing/`, `ai/orchestration/` |
| AI provider strategy (OpenAI/Claude/Gemini + BYOK) | `ai/provider/` |
| 3-tier prompt engine (Classification → Composer → Block files) | `ai/classification/`, `ai/prompt/` |
| 2-call IELTS pipeline (scoring + transformation) | `AiOrchestrationService` |
| Vocabulary extraction from AI feedback | `vocabulary/VocabularyExtractorService` |
| Flashcard CRUD + SM-2 SRS | `flashcard/` |
| Auto-generate CLOZE cards from vocab | `VocabularyExtractorService.autoCreateClozeCard()` |
| Analytics update after feedback (running avg + streak) | `analytics/AnalyticsService` |
| Recurring mistake tracking | `review/MistakeTrackerService` |
| Calendar API (heatmap) | `GET /api/v1/analytics/calendar?days=90` |
| User profile + BYOK | `user/` |

### Backend — Not Yet Implemented
- `notification/` module
- `writing_revisions` entity
- Kafka consumers (using @Async instead)

### Key Implementation Patterns
- **Prompt composition**: `WritingClassification` record bundles all context → `PromptComposer` assembles blocks → optional blocks gracefully skipped via `loadOptional()`
- **ClassificationEngine**: pure service, no AI call — keyword detection on `topicPrompt`, user weakness from `recurring_mistakes` table (top 2 by occurrence_count)
- **Flashcard session**: deck snapshotted at `startStudy()` — not reactive to mid-session DB changes
- **Analytics hook**: `triggerPostProcessing()` is fire-and-forget — exceptions caught + warned, never fail the main pipeline
- **Mistake tracking**: upserts on UNIQUE(user_id, mistake_type); `increment()` updates count + example
- **Streak logic**: yesterday → +1, today already counted → no change, gap > 1 day → reset to 1 (UTC)
- **Schema retry**: on `AI_RESPONSE_INVALID`, rebuild user prompt with error details → single retry (no loop)
