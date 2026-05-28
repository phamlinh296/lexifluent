'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest, RegisterRequest } from '@/types/api';

export function useLogin() {
  const { login } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      authApi.login(data).then((r) => r.data.data!),
    onSuccess: (auth) => {
      login(auth);
      router.push('/dashboard');
    },
  });
}

export function useRegister() {
  const { login } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      authApi.register(data).then((r) => r.data.data!),
    onSuccess: (auth) => {
      login(auth);
      router.push('/onboarding');
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      router.push('/login');
    },
  });
}
