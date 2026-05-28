import { apiClient } from '@/lib/axios';
import type { ApiResponse, UpdateProfileRequest, User, UserSettingsRequest } from '@/types/api';

export const usersApi = {
  getMe: () =>
    apiClient.get<ApiResponse<User>>('/api/v1/users/me'),

  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.patch<ApiResponse<User>>('/api/v1/users/me', data),

  updateSettings: (data: UserSettingsRequest) =>
    apiClient.patch<ApiResponse<User>>('/api/v1/users/me/settings', data),
};
