'use client';

import { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { getRefreshToken, clearTokens } from '@/lib/axios';
import { Toaster } from '@/components/ui/toaster';

function AuthHydrator() {
  const { login, logout, setHydrating } = useAuthStore();
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      setHydrating(false);
      return;
    }

    authApi
      .refresh(refreshToken)
      .then((res) => {
        const auth = res.data.data!;
        login(auth);
      })
      .catch(() => {
        clearTokens();
        logout();
      })
      .finally(() => setHydrating(false));
  }, [login, logout, setHydrating]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClientRef = useRef(createQueryClient());

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <AuthHydrator />
      {children}
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
