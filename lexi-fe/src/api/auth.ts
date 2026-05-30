import { apiClient } from '@/lib/axios';
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '@/types/api';

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', data),

  refresh: (token: string) =>
    apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/refresh', null, {
      params: { token },
    }),

  exchangeOAuthCode: (code: string) =>
    apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/oauth2/exchange', null, {
      params: { code },
    }),

  logout: () =>
    apiClient.post<void>('/api/v1/auth/logout'),

  logoutAll: () =>
    apiClient.post<void>('/api/v1/auth/logout-all'),
};
