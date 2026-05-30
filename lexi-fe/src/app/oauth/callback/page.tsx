'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const code = params.get('code');
    const error = params.get('error');

    if (error === 'account_disabled') {
      router.replace('/login?error=account_disabled');
      return;
    }

    if (!code) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    // Exchange one-time code (30s TTL) for real tokens — never stored in URL/history
    authApi
      .exchangeOAuthCode(code)
      .then((res) => {
        login(res.data.data!);
        router.replace('/dashboard');
      })
      .catch(() => router.replace('/login?error=oauth_failed'));
  }, [params, router, login]);

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
