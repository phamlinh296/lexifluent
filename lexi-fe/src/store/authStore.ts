'use client';

import { create } from 'zustand';
import { accessTokenRef, clearTokens, setTokens } from '@/lib/axios';
import type { AuthResponse, User } from '@/types/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrating: boolean;

  login: (auth: AuthResponse) => void;
  logout: () => void;
  setUser: (user: User) => void;
  updateUser: (patch: Partial<User>) => void;
  setHydrating: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrating: true,

  login: (auth) => {
    accessTokenRef.current = auth.accessToken;
    setTokens(auth.accessToken, auth.refreshToken);
    set({ isAuthenticated: true });
  },

  logout: () => {
    accessTokenRef.current = null;
    clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  updateUser: (patch) =>
    set((s) => ({
      user: s.user ? { ...s.user, ...patch } : s.user,
    })),

  setHydrating: (v) => set({ isHydrating: v }),
}));
