import { apiClient } from '@/lib/axios';
import type {
  AnalyzeTranslationRequest,
  ApiResponse,
  CreateFlashcardRequest,
  Flashcard,
  FlashcardStats,
  ReviewFlashcardRequest,
  TranslationFeedbackSchema,
} from '@/types/api';

export const flashcardsApi = {
  list: (dueOnly = false) =>
    apiClient.get<ApiResponse<Flashcard[]>>('/api/v1/flashcards', { params: { dueOnly } }),

  create: (data: CreateFlashcardRequest) =>
    apiClient.post<ApiResponse<Flashcard>>('/api/v1/flashcards', data),

  review: (id: string, data: ReviewFlashcardRequest) =>
    apiClient.post<ApiResponse<Flashcard>>(`/api/v1/flashcards/${id}/review`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/api/v1/flashcards/${id}`),

  stats: () =>
    apiClient.get<ApiResponse<FlashcardStats>>('/api/v1/flashcards/stats'),

  analyzeTranslation: (id: string, data: AnalyzeTranslationRequest) =>
    apiClient.post<ApiResponse<TranslationFeedbackSchema>>(
      `/api/v1/flashcards/${id}/translate/analyze`,
      data,
    ),
};
