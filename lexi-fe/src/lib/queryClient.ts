import { QueryClient } from '@tanstack/react-query';
import { ERROR_MESSAGES } from '@/types/api';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';

function extractMessage(error: unknown): string {
  const axiosErr = error as AxiosError<ApiResponse<unknown>>;
  const code = axiosErr?.response?.data?.error?.code;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  const msg = axiosErr?.response?.data?.error?.message;
  return msg ?? 'Có lỗi xảy ra, vui lòng thử lại';
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          const axiosErr = error as AxiosError;
          if (axiosErr?.response?.status === 401) return false;
          if (axiosErr?.response?.status === 404) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        onError: (error) => {
          console.error('[mutation error]', extractMessage(error));
        },
      },
    },
  });
}
