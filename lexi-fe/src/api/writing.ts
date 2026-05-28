import { apiClient } from '@/lib/axios';
import type {
  ApiResponse,
  PageResponse,
  SubmitWritingRequest,
  WritingEntry,
  WritingMode,
} from '@/types/api';

export const writingApi = {
  submit: (data: SubmitWritingRequest) =>
    apiClient.post<ApiResponse<WritingEntry>>('/api/v1/writing', data),

  list: (params: { mode?: WritingMode; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<WritingEntry>>>('/api/v1/writing', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<WritingEntry>>(`/api/v1/writing/${id}`),

  softDelete: (id: string) =>
    apiClient.delete<void>(`/api/v1/writing/${id}`),
};
