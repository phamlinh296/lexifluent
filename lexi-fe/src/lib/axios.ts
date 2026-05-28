import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthResponse } from '@/types/api';

const REFRESH_TOKEN_KEY = 'lexi_refresh_token';
const COOKIE_REFRESH_KEY = 'lexi_rt';

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // Also set cookie for middleware to read
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  document.cookie = `${COOKIE_REFRESH_KEY}=1; max-age=${maxAge}; path=/; SameSite=Lax`;
  // Notify auth store
  window.dispatchEvent(new CustomEvent('lexi:token-set', { detail: accessToken }));
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = `${COOKIE_REFRESH_KEY}=; max-age=0; path=/`;
  window.dispatchEvent(new CustomEvent('lexi:logout'));
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Intercept: attach access token from Zustand store snapshot
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Access token is stored in a module-level ref updated by the store
  const token = accessTokenRef.current;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Module-level ref so interceptors don't need React context
export const accessTokenRef = { current: null as string | null };

// ─── Refresh token logic ──────────────────────────────────────────────────────

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processPendingQueue(token: string | null, err: unknown = null): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(err);
  });
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers['Authorization'] = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      clearTokens();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post<ApiResponse<AuthResponse>>(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/v1/auth/refresh`,
        null,
        { params: { token: refreshToken } },
      );

      const newAccessToken = data.data!.accessToken;
      const newRefreshToken = data.data!.refreshToken;

      accessTokenRef.current = newAccessToken;
      setTokens(newAccessToken, newRefreshToken);
      processPendingQueue(newAccessToken);

      original.headers['Authorization'] = `Bearer ${newAccessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      processPendingQueue(null, refreshError);
      clearTokens();
      accessTokenRef.current = null;
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
