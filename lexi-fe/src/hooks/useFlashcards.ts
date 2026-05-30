'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flashcardsApi } from '@/api/flashcards';
import { usersApi } from '@/api/users';
import type { AnalyzeTranslationRequest, CreateFlashcardRequest, ImportResult, ReviewFlashcardRequest, UserSettingsRequest } from '@/types/api';
import { toast } from '@/hooks/useToast';

export function useFlashcards(dueOnly = false) {
  return useQuery({
    queryKey: ['flashcards', { dueOnly }],
    queryFn: () => flashcardsApi.list({ dueOnly }).then((r) => r.data.data ?? []),
  });
}

export function useFavoriteFlashcards() {
  return useQuery({
    queryKey: ['flashcards', { favoritesOnly: true }],
    queryFn: () => flashcardsApi.list({ favoritesOnly: true }).then((r) => r.data.data ?? []),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flashcardsApi.toggleFavorite(id).then((r) => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards'] });
    },
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

export function useAnalyzeTranslation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AnalyzeTranslationRequest }) =>
      flashcardsApi.analyzeTranslation(id, data).then((r) => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards'] });
      qc.invalidateQueries({ queryKey: ['flashcard-stats'] });
    },
    onError: () => toast({ title: 'Phân tích thất bại, thử lại', variant: 'destructive' }),
  });
}

export function useAnalyzeTranslationStandalone() {
  return useMutation({
    mutationFn: (data: AnalyzeTranslationRequest) =>
      flashcardsApi.analyzeTranslationStandalone(data).then((r) => r.data.data!),
    onError: () => toast({ title: 'Phân tích thất bại, thử lại', variant: 'destructive' }),
  });
}

export function useImportFlashcards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) =>
      flashcardsApi.import(file).then((r) => r.data.data as ImportResult),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards'] });
    },
    onError: () => toast({ title: 'Import thất bại', variant: 'destructive' }),
  });
}

export function useExportFlashcards() {
  const EXT: Record<string, string> = { CSV: 'csv', XLSX: 'xlsx', PDF: 'pdf' };
  return useMutation({
    mutationFn: async ({ format, groupId }: { format: 'CSV' | 'XLSX' | 'PDF'; groupId?: string }) => {
      const res = await flashcardsApi.export(format, groupId);
      const blob = res.data as unknown as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flashcards.${EXT[format]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: () => toast({ title: 'Export thất bại', variant: 'destructive' }),
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
