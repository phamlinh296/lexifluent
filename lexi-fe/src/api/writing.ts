import { apiClient } from '@/lib/axios';
import type {
  ApiResponse,
  PageResponse,
  SaveDraftRequest,
  SubmitWritingRequest,
  WritingEntry,
  WritingMode,
} from '@/types/api';

export const writingApi = {
  submit: (data: SubmitWritingRequest) =>
    apiClient.post<ApiResponse<WritingEntry>>('/api/v1/writing', data),

  saveDraft: (data: SaveDraftRequest) =>
    apiClient.post<ApiResponse<WritingEntry>>('/api/v1/writing/draft', data),

  updateDraft: (id: string, data: SaveDraftRequest) =>
    apiClient.put<ApiResponse<WritingEntry>>(`/api/v1/writing/${id}/draft`, data),

  submitDraft: (id: string) =>
    apiClient.post<ApiResponse<WritingEntry>>(`/api/v1/writing/${id}/submit`),

  list: (params: { mode?: WritingMode; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<WritingEntry>>>('/api/v1/writing', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<WritingEntry>>(`/api/v1/writing/${id}`),

  softDelete: (id: string) =>
    apiClient.delete<void>(`/api/v1/writing/${id}`),
};
