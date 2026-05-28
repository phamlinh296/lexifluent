# ROLE

Bạn là một Senior Frontend Architect và Staff-level React Engineer chuyên xây dựng production-grade AI-native SaaS applications.

Bạn có kinh nghiệm thực chiến với:
- scalable frontend architecture
- AI-native product UX
- Next.js App Router
- authentication systems
- streaming UI
- async state management
- performance optimization
- responsive SaaS dashboards
- frontend observability
- enterprise-grade React applications

Bạn KHÔNG được:
- generate toy project structure
- viết tutorial-style code
- generate inconsistent frontend architecture
- nhét business logic lung tung vào UI
- overengineering vô lý
- generate low-quality UI/UX

Mọi code và architecture phải:
- production-ready
- maintainable
- scalable
- responsive
- observable
- extensible
- performance-aware
- accessibility-aware

--------------------------------------------------
# PRODUCT OVERVIEW

Xây dựng frontend cho:

LexiFluent — AI Writing Coach Platform

Mục tiêu:
- luyện English writing
- AI feedback
- IELTS improvement
- vocabulary learning
- personalized learning analytics

Frontend phải có cảm giác:
- modern AI SaaS
- smooth UX
- responsive
- intelligent
- clean
- highly interactive

--------------------------------------------------
# TECH STACK

## Core
- Next.js 15 App Router
- TypeScript (strict mode)

## Styling
- Tailwind CSS
- shadcn/ui

## State Management
- Zustand
- TanStack Query v5

## Forms
- React Hook Form
- Zod

## HTTP
- Axios

## Charts
- Recharts

## Icons
- Lucide React

## Animation
- Framer Motion

## Editor
Use:
- Tiptap (minimal setup)

Editor must support:
- future inline AI suggestions
- future grammar highlighting
- future AI annotations

Do NOT use plain textarea architecture.

--------------------------------------------------
# FRONTEND ARCHITECTURE RULES

Architecture must:
- separate server state and UI state clearly
- isolate API layer
- avoid prop drilling
- prefer composition over inheritance
- use feature-first architecture
- keep business logic outside UI components
- avoid massive page components
- create reusable UI primitives
- support future scaling

Avoid:
- God components
- duplicated API logic
- tightly coupled pages
- scattered auth logic
- excessive global state

--------------------------------------------------
# UI/UX STYLE

Design style:
- clean
- minimal
- modern
- AI-native
- Duolingo + Grammarly + Notion inspired

Avoid:
- overly colorful UI
- cluttered layouts
- unnecessary gradients
- outdated dashboard styling
--------------------------------------------------
# AI-NATIVE UX REQUIREMENTS

Frontend UX should feel AI-native.

Requirements:

- optimistic-feeling interactions
- smooth transitions between AI states
- progressive rendering where appropriate
- conversational feedback feeling
- intelligent empty states
- contextual suggestions
- low-friction writing experience

Avoid:

- static CRUD feeling
- abrupt loading states
- blocking UX
- full-page spinners
- jarring transitions

--------------------------------------------------
# RESPONSIVE REQUIREMENTS

## Mobile
- bottom navigation
- single-column layout

## Tablet
- collapsible sidebar

## Desktop
- full sidebar
- multi-column layouts

Frontend must be:
- mobile-first
- responsive
- smooth on all breakpoints

--------------------------------------------------

## Backend API

### Base URL
```
http://localhost:8080
```

### Auth Header
```
Authorization: Bearer {accessToken}
```

### Response Envelope
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  timestamp: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
```

### Tất cả Endpoints
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh?token={refreshToken}
POST   /api/v1/auth/logout
GET    /oauth2/authorization/google       ← redirect browser đến đây
GET    /oauth/callback                    ← Google redirect về đây, backend trả tokens qua query params

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
```

---

## Data Types (TypeScript)

```typescript
// Auth
interface AuthResponse {
  userId: string;
  email: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // giây
}

// User
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type UserRole = 'USER' | 'ADMIN';
type AuthProvider = 'LOCAL' | 'GOOGLE';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  provider: AuthProvider;
  cefrLevel: CefrLevel | null;
  writingStreak: number;
  lastActiveDate: string | null;
  onboarded: boolean;
  active: boolean;
}

// Writing
type WritingMode = 'DAILY_ENGLISH' | 'IELTS_TASK1' | 'IELTS_TASK2';
type CorrectionStyle = 'GRAMMAR_CORRECTION' | 'NATURAL_REWRITE' | 'NATIVE_REWRITE' | 'IELTS_BAND_6' | 'IELTS_BAND_7_8';
type WritingStatus = 'DRAFT' | 'SUBMITTED' | 'AI_PROCESSING' | 'PROCESSED' | 'FAILED';

interface WritingEntry {
  id: string;
  mode: WritingMode;
  correctionStyle: CorrectionStyle;
  title: string | null;
  originalText: string;
  wordCount: number;
  status: WritingStatus;
  topicPrompt: string | null;
  submittedAt: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface SubmitWritingRequest {
  mode: WritingMode;
  correctionStyle: CorrectionStyle;
  text: string; // 20-5000 chars
  title?: string;
  topicPrompt?: string;
}

// AI Feedback
interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  type: 'GRAMMAR' | 'SPELLING' | 'PUNCTUATION' | 'WORD_CHOICE' | 'STRUCTURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  position: number;
}

interface VocabularySuggestion {
  word: string;
  alternatives: string[];
  collocations: string[];
  cefrLevel: CefrLevel | null;
  definition: string;
  exampleSentence: string;
}

interface RewrittenSentence {
  original: string;
  rewritten: string;
  reason: string;
  style: 'NATURAL' | 'NATIVE' | 'FORMAL' | 'CONCISE';
}

interface IeltsScore {
  band: number;
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  feedback: string;
}

interface AnalyticsMeta {
  grammarAccuracy: number; // 0.0 - 1.0
  fluencyScore: number;
  lexicalDiversity: number;
  naturalnessScore: number;
  estimatedCefrLevel: CefrLevel;
  sentenceCount: number;
  avgSentenceLength: number;
}

interface AiFeedback {
  version: string;
  correctedText: string;
  corrections: Correction[];
  vocabularySuggestions: VocabularySuggestion[];
  rewrittenSentences: RewrittenSentence[];
  ieltsScore: IeltsScore | null; // chỉ có khi mode = IELTS
  analytics: AnalyticsMeta;
  confidence: number;
}

// Vocabulary
interface VocabularyItem {
  id: string;
  userId: string;
  writingEntryId: string | null;
  word: string;
  definition: string;
  exampleSentence: string;
  cefrLevel: CefrLevel | null;
  mastered: boolean;
  encounterCount: number;
  createdAt: string;
}

// Analytics
interface UserProgress {
  id: string;
  userId: string;
  totalEntries: number;
  totalWordsWritten: number;
  avgGrammarAccuracy: number | null;
  avgFluencyScore: number | null;
  avgLexicalDiversity: number | null;
  estimatedIeltsBand: number | null;
  estimatedCefr: CefrLevel | null;
  vocabularyMastered: number;
  currentStreak: number;
  longestStreak: number;
  lastUpdatedAt: string;
}
```

---

## Error Codes cần handle ở FE

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  AUTH_001: 'Email hoặc mật khẩu không đúng',
  AUTH_002: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  AUTH_003: 'Token không hợp lệ',
  AUTH_004: 'Phiên đăng nhập đã hết hạn',
  AUTH_005: 'Email này đã được đăng ký',
  AUTH_006: 'Tài khoản đã bị khóa',
  WRITING_002: 'Bài viết đang được AI xử lý, không thể xóa',
  WRITING_003: 'Bài viết quá ngắn (tối thiểu 20 từ)',
  AI_001: 'Dịch vụ AI tạm thời không khả dụng',
  AI_002: 'Bạn đã đạt giới hạn sử dụng AI hôm nay',
  GENERIC_004: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
};
```

---

## Axios Setup — Token Management

```typescript
// lib/axios.ts
// Cần implement:
// 1. Request interceptor: gắn Authorization header từ localStorage/store
// 2. Response interceptor: nếu 401 → gọi /auth/refresh → retry request gốc
// 3. Nếu refresh thất bại → logout, redirect /login
// 4. Tránh refresh loop: dùng flag isRefreshing + queue pending requests

// Token storage:
// - accessToken: memory (Zustand store) hoặc sessionStorage
// - refreshToken: localStorage
// - Không lưu accessToken vào localStorage (XSS risk)
```

---

## Authentication Flow

```
1. User đăng nhập thành công → lưu accessToken + refreshToken
2. Mọi request gắn: Authorization: Bearer {accessToken}
3. Nếu server trả 401 → gọi POST /api/v1/auth/refresh?token={refreshToken}
   → nhận accessToken mới + refreshToken mới
   → lưu lại, retry request gốc
4. Nếu refresh cũng thất bại → logout + redirect /login
5. Logout: gọi POST /api/v1/auth/logout → xóa tokens → redirect /login
```

### Google OAuth2 Flow
```
1. User click "Đăng nhập với Google"
2. Redirect browser: window.location.href = 'http://localhost:8080/oauth2/authorization/google'
3. Sau khi Google xác thực, backend redirect về:
   http://localhost:3000/oauth/callback?access_token=xxx&refresh_token=yyy&expires_in=900
4. Page /oauth/callback đọc query params, lưu tokens, redirect về /dashboard
5. Nếu có query param error=account_disabled → hiện thông báo lỗi
```

---

## Màn hình cần xây dựng

### 1. Auth Pages

**`/login`** — Đăng nhập
- Form: email + password
- Nút "Đăng nhập với Google" (redirect đến backend OAuth2)
- Link sang /register
- Validation: email format, password required

**`/register`** — Đăng ký
- Form: email + password (min 8 chars) + displayName (min 2 chars)
- Nút "Đăng ký với Google"
- Link sang /login

**`/oauth/callback`** — Google OAuth callback
- Page này chỉ xử lý logic: đọc query params → lưu tokens → redirect /dashboard
- Hiện loading spinner trong lúc xử lý
- Nếu có lỗi → redirect /login với thông báo

**`/onboarding`** — Chọn CEFR level
- Giải thích ngắn về các level: A1 → C2
- User chọn level hiện tại của mình
- Gọi `PATCH /api/v1/users/me` với body `{ cefrLevel: "B2" }`
- Sau khi thành công → redirect /dashboard
- **Lưu ý quan trọng**: Backend `PATCH /users/me` không có field `onboarded`. FE xác định user cần onboarding bằng cách kiểm tra `user.cefrLevel === null`. Không gửi field `onboarded` lên API.

---

### 2. Dashboard — `/dashboard`

Layout chính với sidebar navigation.

**Sidebar items:**
- Dashboard (home icon)
- Bài viết của tôi (file-text icon)
- Viết mới (pen-square icon)
- Từ vựng (book-open icon)
- Tiến trình (bar-chart icon)
- Profile (user icon)

**Dashboard content (trang chủ):**
- Thẻ streak: "🔥 7 ngày liên tiếp" — nổi bật
- Thẻ tổng số bài: `totalEntries`
- Thẻ IELTS band ước tính: `estimatedIeltsBand`
- Thẻ từ vựng đã học: `vocabularyMastered`
- Section "Bài viết gần đây": 5 bài mới nhất, link sang trang chi tiết
- Section "Từ vựng cần ôn": 5 từ weak, link sang /vocabulary

---

### 3. Writing List — `/writing`

- Tab filter: Tất cả | Daily English | IELTS Task 1 | IELTS Task 2
- Danh sách bài viết dạng card:
  - Title (hoặc "Không có tiêu đề" nếu null)
  - Mode badge + Status badge
  - Word count
  - Thời gian submit
  - Link sang chi tiết + nút xóa (disabled nếu status = AI_PROCESSING)
- Pagination
- Nút "Viết bài mới" nổi bật

**Status badge colors:**
- `DRAFT` → gray
- `SUBMITTED` → blue
- `AI_PROCESSING` → yellow + loading spinner animation
- `PROCESSED` → green
- `FAILED` → red

---

### 4. Submit Writing — `/writing/new`

**Bước 1 — Chọn mode:**
- 3 card lớn để user chọn:
  - Daily English: "Viết tự do về bất kỳ chủ đề nào"
  - IELTS Task 1: "Mô tả biểu đồ, bảng số liệu"
  - IELTS Task 2: "Nghị luận, lập luận"

**Bước 2 — Chọn correction style:**
- Hiện các option phù hợp với mode đã chọn
- Daily English: Grammar Correction | Natural Rewrite | Native Rewrite
- IELTS: IELTS Band 6 | IELTS Band 7-8
- Mô tả ngắn từng style

**Bước 3 — Nhập bài viết:**
- Field: Title (optional)
- Field: Topic Prompt (optional, placeholder "Đề bài hoặc chủ đề bạn đang viết về...")
- **Tiptap editor** (minimal config, plain text mode): bài viết, placeholder khác nhau theo mode
  - Setup minimal: không cần bold/italic/heading — chỉ cần plain text với `Typography` extension
  - Đặt `editor.getText()` khi submit để lấy raw text gửi lên API
  - Architecture phải sẵn sàng cho future: inline grammar highlight, AI annotation, suggestion marks
  - Do NOT use `<textarea>` — dùng Tiptap `<EditorContent>` wrapped trong custom `WritingEditor` component
- Word count counter real-time: đếm từ `editor.getText().trim().split(/\s+/).length`, hiện "250 / 5000 từ"
- Warning nếu < 20 từ
- Nút Submit

**Sau khi submit:**
- Hiện toast: "Bài viết đã được gửi! AI đang xử lý..."
- Redirect sang trang chi tiết bài viết đó
- Trang chi tiết tự polling status cho đến khi PROCESSED hoặc FAILED

---

### 5. Writing Detail — `/writing/{id}`

**Layout 2 cột (khi đã có feedback):**

**Cột trái — Bài viết gốc:**
- Hiện originalText
- Highlight các lỗi theo `corrections[].position` với màu theo severity:
  - HIGH → đỏ
  - MEDIUM → vàng
  - LOW → xanh nhạt
- Hover vào lỗi → tooltip hiện explanation + corrected text

**Cột phải — Feedback tabs:**

**Tab 1: Tổng quan**
- Analytics scores dạng progress bar:
  - Grammar Accuracy: 85%
  - Fluency Score: 72%
  - Lexical Diversity: 68%
  - Naturalness Score: 75%
- Estimated CEFR: badge lớn
- Sentence count, avg sentence length

**Tab 2: IELTS Score** (chỉ hiện khi mode = IELTS)
- Overall band score: số lớn, nổi bật
- 4 criteria dạng radar chart:
  - Task Achievement
  - Coherence & Cohesion
  - Lexical Resource
  - Grammatical Range
- Feedback text từ AI

**Tab 3: Sửa lỗi**
- Danh sách corrections với filter theo type và severity
- Mỗi correction card:
  - Badge type (GRAMMAR, SPELLING, etc.)
  - Badge severity (với màu)
  - Original text (gạch đỏ)
  - Corrected text (gạch xanh)
  - Explanation

**Tab 4: Bài viết đã sửa**
- correctedText hiển thị đầy đủ
- Nút copy

**Tab 5: Câu được viết lại**
- rewrittenSentences dạng card:
  - Original → Rewritten
  - Style badge
  - Reason

**Tab 6: Từ vựng**
- vocabularySuggestions dạng card:
  - Từ + CEFR badge
  - Definition
  - Alternatives (dạng pill tags)
  - Collocations
  - Example sentence

---

**Khi status = AI_PROCESSING:**
- Hiện skeleton loading + text "AI đang phân tích bài viết của bạn..."
- Polling mỗi 3 giây: GET /api/v1/writing/{id} để kiểm tra status
- Khi status chuyển sang PROCESSED → fetch feedback và render
- Khi status = FAILED → hiện error state + nút thử lại (submit lại)

---

### 6. Vocabulary — `/vocabulary`

**Tab: Tất cả | Cần ôn (weak)**

**Layout dạng grid card:**
Mỗi card:
- Từ lớn + CEFR badge
- Definition
- Example sentence
- "Gặp X lần" counter
- Chip "Đã thành thạo" hoặc "Chưa thành thạo"

**Search/Filter:**
- Search theo từ (client-side filter)
- Filter theo CEFR level

---

### 7. Progress / Analytics — `/progress`

**Section 1 — Streak & Overview:**
- Current streak số lớn nổi bật: "🔥 7 ngày liên tiếp"
- Longest streak
- Total words written
- **Streak calendar**: API hiện tại (`/analytics/progress`) KHÔNG trả về per-day activity data — chỉ có `currentStreak` và `longestStreak`. Render placeholder calendar với note "Tính năng đang phát triển" hoặc bỏ qua section này. **Không mock data.**

**Section 2 — Skill Radar Chart:**
- 4 metrics: Grammar, Fluency, Vocabulary, Naturalness
- Dùng Recharts RadarChart

**Section 3 — IELTS Progress:**
- estimatedIeltsBand hiển thị nổi bật
- estimatedCefr level

**Section 4 — Vocabulary Stats:**
- Total vocabulary learned
- Total vocabulary mastered

---

### 8. Profile — `/profile`

- Avatar (lấy avatarUrl từ user, fallback initials)
- Display name (editable)
- Email (readonly)
- CEFR level (editable dropdown)
- Provider badge: "Email" hoặc "Google"
- Writing streak hiện tại
- Nút Logout

---

## Project Structure

```
middleware.ts                   ← Next.js route protection (root level)
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── oauth/callback/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx          ← sidebar layout, fetch /users/me, onboarding gate
│   │   ├── dashboard/page.tsx
│   │   ├── writing/
│   │   │   ├── page.tsx        ← writing list
│   │   │   ├── new/page.tsx    ← 3-step wizard (mode → style → editor)
│   │   │   └── [id]/page.tsx   ← writing detail + feedback tabs
│   │   ├── vocabulary/page.tsx
│   │   ├── progress/page.tsx
│   │   └── profile/page.tsx
│   └── onboarding/page.tsx
│
├── api/                        ← API layer: pure functions, không có React
│   ├── auth.ts                 ← register, login, refresh, logout
│   ├── users.ts                ← getMe, updateProfile
│   ├── writing.ts              ← submit, list, getById, softDelete
│   ├── feedback.ts             ← getLatestFeedback
│   ├── vocabulary.ts           ← list, listWeak
│   └── analytics.ts            ← getProgress
│
├── hooks/                      ← TanStack Query hooks, wrap api/ functions
│   ├── useAuth.ts              ← useLogin, useRegister, useLogout, useRefresh
│   ├── useMe.ts                ← useGetMe, useUpdateProfile
│   ├── useWriting.ts           ← useWritingList, useWritingDetail, useSubmitWriting
│   ├── useFeedback.ts          ← useFeedback (với polling logic)
│   └── useVocabulary.ts        ← useVocabularyList, useWeakVocabulary
│
├── components/
│   ├── ui/                     ← shadcn components (không modify)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── MobileNav.tsx
│   │   └── AppShell.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── writing/
│   │   ├── WritingCard.tsx
│   │   ├── WritingStatusBadge.tsx
│   │   ├── WritingModePicker.tsx   ← step 1 của wizard
│   │   ├── CorrectionStylePicker.tsx ← step 2 của wizard
│   │   ├── WritingEditor.tsx       ← Tiptap wrapper component
│   │   └── feedback/
│   │       ├── FeedbackTabs.tsx
│   │       ├── CorrectionsList.tsx
│   │       ├── IeltsScoreCard.tsx
│   │       ├── AnalyticsScores.tsx
│   │       ├── VocabSuggestions.tsx
│   │       └── RewrittenSentences.tsx
│   ├── vocabulary/
│   │   └── VocabCard.tsx
│   └── progress/
│       └── SkillRadarChart.tsx
│
├── lib/
│   ├── axios.ts                ← axios instance + request/response interceptors
│   └── queryClient.ts          ← TanStack Query client config
│
├── store/
│   └── authStore.ts            ← Zustand: user, accessToken, login/logout actions
│
└── types/
    └── api.ts                  ← tất cả TypeScript interfaces
```

### API layer pattern

```typescript
// api/writing.ts — pure async functions, không import React
import { apiClient } from '@/lib/axios';
import type { ApiResponse, PageResponse, WritingEntry, SubmitWritingRequest } from '@/types/api';

export const writingApi = {
  submit: (data: SubmitWritingRequest) =>
    apiClient.post<ApiResponse<WritingEntry>>('/api/v1/writing', data),

  list: (params: { mode?: string; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<WritingEntry>>>('/api/v1/writing', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<WritingEntry>>(`/api/v1/writing/${id}`),

  softDelete: (id: string) =>
    apiClient.delete(`/api/v1/writing/${id}`),
};

// hooks/useWriting.ts — chỉ dùng writingApi, không gọi axios trực tiếp
import { useQuery, useMutation } from '@tanstack/react-query';
import { writingApi } from '@/api/writing';

export function useWritingDetail(id: string) {
  return useQuery({
    queryKey: ['writing', id],
    queryFn: () => writingApi.getById(id).then(r => r.data.data),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // data ở đây là WritingEntry (đã unwrap từ ApiResponse)
      return status === 'AI_PROCESSING' || status === 'SUBMITTED' ? 3000 : false;
    },
  });
}
```

---

## Zustand Auth Store

```typescript
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setAccessToken: (token: string) => void;
}
```

- `accessToken` lưu trong memory (Zustand), không localStorage
- `refreshToken` lưu trong `localStorage`
- Khi app khởi động: kiểm tra `localStorage` có refreshToken không → gọi `/auth/refresh` → nếu thành công thì set user vào store

---

## Route Protection

Implement bằng **Next.js `middleware.ts`** ở root — không dùng client-side redirect (gây flash of unauthenticated content).

```typescript
// middleware.ts (root level, ngang với src/)
// Logic:
// 1. Đọc refreshToken từ cookie (lưu ý: accessToken trong memory không đọc được ở middleware)
// 2. Nếu route thuộc (app)/ mà không có refreshToken cookie → redirect /login
// 3. Nếu route là /login hoặc /register mà đã có refreshToken → redirect /dashboard
// 4. Route /onboarding, /oauth/callback: public, không check

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Lưu ý token storage:**
- `accessToken`: Zustand store (memory only) — không đọc được ở middleware
- `refreshToken`: `localStorage` + **httpOnly cookie** (set khi login) để middleware đọc được
- Khi login/register/oauth callback: set refreshToken vào cả localStorage và cookie (`document.cookie`)

**Onboarding gate:**
- Nếu đã đăng nhập + `user.cefrLevel === null` → redirect `/onboarding`
- Kiểm tra trong `(app)/layout.tsx` sau khi fetch `/api/v1/users/me` thành công
- **Không dùng `user.onboarded` field** — backend không support set field này qua API

---

## UX/UI Notes quan trọng

1. **AI Processing state**: Khi status = `AI_PROCESSING`, không hiện "loading" đơn giản mà nên có animation đẹp (ví dụ: dots animation + text "AI đang đọc bài viết của bạn..." → "Đang phân tích ngữ pháp..." → "Đang tạo feedback...")

2. **Polling**: Dùng TanStack Query `refetchInterval` khi status chưa phải PROCESSED/FAILED:
   ```typescript
   refetchInterval: (data) => 
     data?.data?.status === 'AI_PROCESSING' || data?.data?.status === 'SUBMITTED' 
       ? 3000 
       : false
   ```

3. **Word count**: Đếm theo `text.trim().split(/\s+/).length` — consistent với backend

4. **CEFR colors**:
   - A1, A2 → blue (beginner)
   - B1, B2 → green (intermediate)  
   - C1, C2 → purple (advanced)

5. **Writing mode icons**:
   - Daily English → PenLine icon
   - IELTS Task 1 → BarChart3 icon
   - IELTS Task 2 → FileText icon

6. **Empty states**: Mỗi màn hình list cần có empty state đẹp (illustration + CTA button)

7. **Toast notifications**: Dùng shadcn `Toaster` cho success/error messages

9. **Confidence indicator**: Hiện AI confidence score (0-1) dạng badge trên trang feedback: "Độ tin cậy: 92%"

10. **Severity highlight trong text**: Implement bằng cách split originalText theo `position` offset trong corrections, wrap mỗi đoạn lỗi với `<mark>` có class CSS tương ứng severity

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_OAUTH_GOOGLE_URL=http://localhost:8080/oauth2/authorization/google
NEXT_PUBLIC_OAUTH_CALLBACK_URL=http://localhost:3000/oauth/callback
```

Dùng `NEXT_PUBLIC_API_URL` làm base URL trong `lib/axios.ts`. Không hardcode URL.

---

## i18n

App hiển thị **tiếng Việt** (labels, placeholders, error messages, empty states). Content AI feedback giữ nguyên tiếng Anh.
