import { apiClient } from '@/lib/axios';
import type { ApiResponse, CreateFlashcardRequest, Flashcard, ReviewFlashcardRequest } from '@/types/api';

export const flashcardsApi = {
  list: (dueOnly = false) =>
    apiClient.get<ApiResponse<Flashcard[]>>('/api/v1/flashcards', { params: { dueOnly } }),

  create: (data: CreateFlashcardRequest) =>
    apiClient.post<ApiResponse<Flashcard>>('/api/v1/flashcards', data),

  review: (id: string, data: ReviewFlashcardRequest) =>
    apiClient.post<ApiResponse<Flashcard>>(`/api/v1/flashcards/${id}/review`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/api/v1/flashcards/${id}`),
};
