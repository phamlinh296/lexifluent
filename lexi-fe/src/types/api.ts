// ─── Envelope ───────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  userId: string;
  email: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type UserRole = 'USER' | 'ADMIN';
export type AuthProvider = 'LOCAL' | 'GOOGLE';

export interface User {
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
  openaiKeyConfigured: boolean;
  geminiKeyConfigured: boolean;
}

export interface UserSettingsRequest {
  openaiApiKey?: string;  // undefined = no change, '' = clear
  geminiApiKey?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  cefrLevel?: CefrLevel;
}

// ─── Writing ─────────────────────────────────────────────────────────────────

export type WritingMode = 'DAILY_ENGLISH' | 'IELTS_TASK1' | 'IELTS_TASK2';
export type CorrectionStyle =
  | 'GRAMMAR_CORRECTION'
  | 'NATURAL_REWRITE'
  | 'NATIVE_REWRITE'
  | 'IELTS_BAND_6'
  | 'IELTS_BAND_7_8';
export type WritingStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'AI_PROCESSING'
  | 'PROCESSED'
  | 'FAILED';

export type EssayType =
  | 'OPINION'
  | 'DISCUSSION'
  | 'ADVANTAGES_DISADVANTAGES'
  | 'PROBLEM_SOLUTION'
  | 'DOUBLE_QUESTION'
  | 'DIRECT_QUESTION';

export type Task1Type =
  | 'LINE_GRAPH'
  | 'BAR_CHART'
  | 'PIE_CHART'
  | 'TABLE'
  | 'MIXED_CHART'
  | 'PROCESS'
  | 'MAP';

export type TargetBand =
  | 'BAND_6_0'
  | 'BAND_6_5'
  | 'BAND_7_0'
  | 'BAND_7_5'
  | 'BAND_8_0'
  | 'BAND_8_5';

export interface WritingEntry {
  id: string;
  mode: WritingMode;
  correctionStyle: CorrectionStyle;
  essayType: EssayType | null;
  task1Type: Task1Type | null;
  targetBand: TargetBand | null;
  title: string | null;
  originalText: string;
  wordCount: number;
  status: WritingStatus;
  topicPrompt: string | null;
  submittedAt: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface SubmitWritingRequest {
  mode: WritingMode;
  correctionStyle?: CorrectionStyle;  // nullable for IELTS — derived from targetBand
  text: string;
  title?: string;
  topicPrompt?: string;
  essayType?: EssayType;
  task1Type?: Task1Type;
  targetBand?: TargetBand;
}

// ─── AI Feedback ─────────────────────────────────────────────────────────────

export type CorrectionType =
  | 'GRAMMAR'
  | 'SPELLING'
  | 'PUNCTUATION'
  | 'WORD_CHOICE'
  | 'STRUCTURE';
export type CorrectionSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type RewriteStyle = 'NATURAL' | 'NATIVE' | 'FORMAL' | 'CONCISE';

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  type: CorrectionType;
  severity: CorrectionSeverity;
  startOffset: number;
  endOffset: number;
}

export interface VocabularySuggestion {
  word: string;
  alternatives: string[];
  collocations: string[];
  cefrLevel: CefrLevel | null;
  definition: string;
  exampleSentence: string;
}

export interface RewrittenSentence {
  original: string;
  rewritten: string;
  reason: string;
  style: RewriteStyle;
}

export interface IeltsScore {
  band: number;
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  feedback: string;
}

export interface AnalyticsMeta {
  grammarAccuracy: number;
  fluencyScore: number;
  lexicalDiversity: number;
  naturalnessScore: number;
  estimatedCefrLevel: CefrLevel;
  sentenceCount: number;
  avgSentenceLength: number;
}

export interface AiFeedback {
  version: string;
  correctedText: string;
  corrections: Correction[];
  vocabularySuggestions: VocabularySuggestion[];
  rewrittenSentences: RewrittenSentence[];
  ieltsScore: IeltsScore | null;
  analytics: AnalyticsMeta;
  confidence: number;
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

export interface VocabularyItem {
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

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface UserProgress {
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

// ─── Flashcard ────────────────────────────────────────────────────────────────

export type FlashcardType = 'BASIC' | 'CLOZE' | 'GRAMMAR_CORRECTION';

export interface Flashcard {
  id: string;
  type: FlashcardType;
  front: string;
  back: string;
  cefrLevel: CefrLevel | null;
  vocabularyItemId: string | null;
  easeFactor: number;
  intervalDays: number;
  reviewCount: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
  createdAt: string;
  isDue: boolean;
}

export interface CreateFlashcardRequest {
  front: string;
  back: string;
  cefrLevel?: string;
  vocabularyItemId?: string;
  type?: FlashcardType;
}

export interface ReviewFlashcardRequest {
  quality: number; // 0-5
}

// ─── Recurring Mistakes ───────────────────────────────────────────────────────

export interface RecurringMistake {
  mistakeType: string;
  description: string | null;
  example: string | null;
  occurrenceCount: number;
  lastSeenAt: string;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export interface CalendarDay {
  date: string;       // "YYYY-MM-DD"
  writingCount: number;
}

// ─── Error codes ─────────────────────────────────────────────────────────────

export const ERROR_MESSAGES: Record<string, string> = {
  AUTH_001: 'Email hoặc mật khẩu không đúng',
  AUTH_002: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  AUTH_003: 'Token không hợp lệ',
  AUTH_004: 'Phiên đăng nhập đã hết hạn',
  AUTH_005: 'Email này đã được đăng ký',
  AUTH_006: 'Tài khoản đã bị khóa, vui lòng liên hệ hỗ trợ',
  WRITING_002: 'Bài viết đang được AI xử lý, không thể xóa',
  WRITING_003: 'Bài viết quá ngắn (tối thiểu 20 từ)',
  AI_001: 'Dịch vụ AI tạm thời không khả dụng',
  AI_002: 'Bạn đã đạt giới hạn sử dụng AI hôm nay',
  GENERIC_004: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
};
