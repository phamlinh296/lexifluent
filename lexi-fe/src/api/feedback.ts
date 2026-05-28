import { apiClient } from '@/lib/axios';
import type { AiFeedback, ApiResponse } from '@/types/api';

export const feedbackApi = {
  getLatest: (entryId: string) =>
    apiClient.get<ApiResponse<AiFeedback>>(`/api/v1/writing/${entryId}/feedback`),
};
