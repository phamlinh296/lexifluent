'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flashcardsApi } from '@/api/flashcards';
import { usersApi } from '@/api/users';
import type { CreateFlashcardRequest, ReviewFlashcardRequest, UserSettingsRequest } from '@/types/api';
import { toast } from '@/hooks/useToast';

export function useFlashcards(dueOnly = false) {
  return useQuery({
    queryKey: ['flashcards', { dueOnly }],
    queryFn: () => flashcardsApi.list(dueOnly).then((r) => r.data.data ?? []),
  });
}

export function useFlashcardStats() {
  return useQuery({
    queryKey: ['flashcard-stats'],
    queryFn: () => flashcardsApi.stats().then((r) => r.data.data ?? { flashcardStreak: 0 }),
  });
}

export function useCreateFlashcard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFlashcardRequest) => flashcardsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards'] });
      toast({ title: 'Đã lưu flashcard', variant: 'default' });
    },
    onError: () => toast({ title: 'Lưu thất bại', variant: 'destructive' }),
  });
}

export function useReviewFlashcard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewFlashcardRequest }) =>
      flashcardsApi.review(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards'] });
      qc.invalidateQueries({ queryKey: ['flashcard-stats'] });
    },
  });
}

export function useDeleteFlashcard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flashcardsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards'] });
      toast({ title: 'Đã xóa flashcard' });
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserSettingsRequest) => usersApi.updateSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      toast({ title: 'Đã lưu cài đặt' });
    },
    onError: () => toast({ title: 'Lưu thất bại', variant: 'destructive' }),
  });
}
