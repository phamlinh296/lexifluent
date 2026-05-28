import { apiClient } from '@/lib/axios';
import type { ApiResponse, PageResponse, VocabularyItem } from '@/types/api';

export const vocabularyApi = {
  list: (params: { page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<VocabularyItem>>>('/api/v1/vocabulary', { params }),

  listWeak: (params: { page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<VocabularyItem>>>('/api/v1/vocabulary/weak', { params }),
};
