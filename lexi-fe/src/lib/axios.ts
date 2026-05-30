import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthResponse } from '@/types/api';

const REFRESH_TOKEN_KEY = 'lexi_refresh_token';
const COOKIE_REFRESH_KEY = 'lexi_rt';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `${COOKIE_REFRESH_KEY}=1; max-age=${maxAge}; path=/; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent('lexi:token-set', { detail: accessToken }));
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = `${COOKIE_REFRESH_KEY}=; max-age=0; path=/`;
  window.dispatchEvent(new CustomEvent('lexi:logout'));
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

export const accessTokenRef = { current: null as string | null };

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = accessTokenRef.current;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ─── Shared refresh promise ───────────────────────────────────────────────────
// All callers in the same tab (AuthHydrator + 401 interceptor) share one promise,
// so only one actual refresh request is ever in-flight at a time.

let activeRefreshPromise: Promise<AuthResponse> | null = null;

// BroadcastChannel: when one tab refreshes, push new tokens to all other tabs
// so they don't also call the refresh endpoint with the already-rotated token.
const tokenChannel: BroadcastChannel | null =
  typeof window !== 'undefined'
    ? (() => {
        try {
          return new BroadcastChannel('lexi_auth_sync');
        } catch {
          return null;
        }
      })()
    : null;

if (tokenChannel) {
  tokenChannel.onmessage = ({ data }) => {
    if (data.type === 'TOKENS_REFRESHED') {
      accessTokenRef.current = data.accessToken;
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      document.cookie = `${COOKIE_REFRESH_KEY}=1; max-age=${7 * 24 * 60 * 60}; path=/; SameSite=Lax`;
    }
  };
}

export function getOrStartRefresh(): Promise<AuthResponse> {
  if (activeRefreshPromise) return activeRefreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return Promise.reject(new Error('No refresh token'));
  }

  activeRefreshPromise = axios
    .post<ApiResponse<AuthResponse>>(
      `${API_BASE}/api/v1/auth/refresh`,
      null,
      { params: { token: refreshToken } },
    )
    .then(({ data }) => {
      const auth = data.data!;
      accessTokenRef.current = auth.accessToken;
      setTokens(auth.accessToken, auth.refreshToken);
      tokenChannel?.postMessage({
        type: 'TOKENS_REFRESHED',
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
      });
      return auth;
    })
    .catch((err) => {
      // Don't wipe tokens if another tab already refreshed and stored a new token
      const currentToken = getRefreshToken();
      if (!currentToken || currentToken === refreshToken) {
        clearTokens();
        accessTokenRef.current = null;
      }
      throw err;
    })
    .finally(() => {
      activeRefreshPromise = null;
    });

  return activeRefreshPromise;
}

// ─── 401 auto-refresh interceptor ─────────────────────────────────────────────

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const auth = await getOrStartRefresh();
      original.headers['Authorization'] = `Bearer ${auth.accessToken}`;
      return apiClient(original);
    } catch {
      return Promise.reject(error);
    }
  },
);
