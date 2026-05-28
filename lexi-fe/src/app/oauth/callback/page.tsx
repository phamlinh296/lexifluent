'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { setTokens, accessTokenRef } from '@/lib/axios';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const error = params.get('error');

    if (error === 'account_disabled') {
      router.replace('/login?error=account_disabled');
      return;
    }

    if (!accessToken || !refreshToken) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    accessTokenRef.current = accessToken;
    setTokens(accessToken, refreshToken);
    router.replace('/dashboard');
  }, [params, router, setUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Đang hoàn tất đăng nhập...</p>
    </div>
  );
}
