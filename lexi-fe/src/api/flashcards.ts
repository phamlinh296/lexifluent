import { apiClient } from '@/lib/axios';
import type {
  AnalyzeTranslationRequest,
  ApiResponse,
  CreateFlashcardRequest,
  Flashcard,
  FlashcardStats,
  ImportResult,
  ReviewFlashcardRequest,
  TranslationFeedbackSchema,
} from '@/types/api';

export const flashcardsApi = {
  list: (params: { dueOnly?: boolean; favoritesOnly?: boolean } = {}) =>
    apiClient.get<ApiResponse<Flashcard[]>>('/api/v1/flashcards', { params }),

  toggleFavorite: (id: string) =>
    apiClient.patch<ApiResponse<Flashcard>>(`/api/v1/flashcards/${id}/favorite`),

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

  analyzeTranslationStandalone: (data: AnalyzeTranslationRequest) =>
    apiClient.post<ApiResponse<TranslationFeedbackSchema>>('/api/v1/translate/analyze', data),

  import: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    // override instance-default 'application/json' so browser sets multipart boundary
    return apiClient.post<ApiResponse<ImportResult>>('/api/v1/flashcards/import', form, {
      headers: { 'Content-Type': undefined },
    });
  },

  export: (format: 'CSV' | 'XLSX' | 'PDF', groupId?: string) =>
    apiClient.get<Blob>('/api/v1/flashcards/export', {
      params: groupId ? { format, groupId } : { format },
      responseType: 'blob',
    }),

  downloadTemplate: () =>
    apiClient.get<Blob>('/api/v1/flashcards/import/template', { responseType: 'blob' }),
};
