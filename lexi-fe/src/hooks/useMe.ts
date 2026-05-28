'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import type { UpdateProfileRequest } from '@/types/api';

export function useMe() {
  const { setUser } = useAuthStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await usersApi.getMe();
      const user = res.data.data!;
      setUser(user);
      return user;
    },
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      usersApi.updateProfile(data).then((r) => r.data.data!),
    onSuccess: (user) => {
      updateUser(user);
      queryClient.setQueryData(['me'], user);
    },
  });
}
