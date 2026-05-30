import { apiClient } from '@/lib/axios';
import type { ApiResponse, PageResponse, TopicCount, VocabularyItem } from '@/types/api';

export const vocabularyApi = {
  list: (params: { page?: number; size?: number; topic?: string }) =>
    apiClient.get<ApiResponse<PageResponse<VocabularyItem>>>('/api/v1/vocabulary', { params }),

  listWeak: (params: { page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<VocabularyItem>>>('/api/v1/vocabulary/weak', { params }),

  listTopics: () =>
    apiClient.get<ApiResponse<TopicCount[]>>('/api/v1/vocabulary/topics'),

  add: (word: string) =>
    apiClient.post<ApiResponse<VocabularyItem>>('/api/v1/vocabulary', { word }),

  markMastered: (id: string, mastered: boolean) =>
    apiClient.patch<ApiResponse<VocabularyItem>>(`/api/v1/vocabulary/${id}/master`, null, {
      params: { mastered },
    }),

  addToGroup: (vocabId: string, groupId: string) =>
    apiClient.post<ApiResponse<import('@/types/api').Flashcard>>(
      `/api/v1/vocabulary/${vocabId}/flashcard-groups/${groupId}`,
    ),
};
