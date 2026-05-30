import { apiClient } from '@/lib/axios';
import type { ApiResponse, Flashcard, FlashcardGroup } from '@/types/api';

export const flashcardGroupsApi = {
  list: () =>
    apiClient.get<ApiResponse<FlashcardGroup[]>>('/api/v1/flashcard-groups'),

  create: (name: string) =>
    apiClient.post<ApiResponse<FlashcardGroup>>('/api/v1/flashcard-groups', { name }),

  delete: (groupId: string) =>
    apiClient.delete<ApiResponse<void>>(`/api/v1/flashcard-groups/${groupId}`),

  listCards: (groupId: string) =>
    apiClient.get<ApiResponse<Flashcard[]>>(`/api/v1/flashcard-groups/${groupId}/cards`),

  addCard: (groupId: string, cardId: string) =>
    apiClient.post<ApiResponse<Flashcard>>(`/api/v1/flashcard-groups/${groupId}/cards/${cardId}`),

  removeCard: (groupId: string, cardId: string) =>
    apiClient.delete<ApiResponse<Flashcard>>(`/api/v1/flashcard-groups/${groupId}/cards/${cardId}`),
};
