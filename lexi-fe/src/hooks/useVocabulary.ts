'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vocabularyApi } from '@/api/vocabulary';
import { toast } from '@/hooks/useToast';

export function useVocabularyList(page = 0, size = 30, topic?: string) {
  return useQuery({
    queryKey: ['vocabulary', 'all', page, topic ?? null],
    queryFn: () => vocabularyApi.list({ page, size, topic }).then((r) => r.data.data!),
  });
}

export function useWeakVocabulary(page = 0, size = 20) {
  return useQuery({
    queryKey: ['vocabulary', 'weak', page],
    queryFn: () => vocabularyApi.listWeak({ page, size }).then((r) => r.data.data!),
  });
}

export function useVocabTopics() {
  return useQuery({
    queryKey: ['vocabulary', 'topics'],
    queryFn: () => vocabularyApi.listTopics().then((r) => r.data.data ?? []),
  });
}

export function useAddVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (word: string) => vocabularyApi.add(word).then((r) => r.data.data!),
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ['vocabulary'] });
      toast({ title: `Đã thêm "${item.word}"` });
    },
    onError: () => toast({ title: 'Thêm từ thất bại', variant: 'destructive' }),
  });
}

export function useAddVocabToGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vocabId, groupId }: { vocabId: string; groupId: string }) =>
      vocabularyApi.addToGroup(vocabId, groupId).then((r) => r.data.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards'] });
      qc.invalidateQueries({ queryKey: ['flashcard-groups'] });
      toast({ title: 'Đã thêm vào nhóm' });
    },
    onError: () => toast({ title: 'Thêm vào nhóm thất bại', variant: 'destructive' }),
  });
}

export function useMarkMastered() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mastered }: { id: string; mastered: boolean }) =>
      vocabularyApi.markMastered(id, mastered).then((r) => r.data.data!),
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ['vocabulary'] });
      toast({ title: item.mastered ? 'Đã đánh dấu thành thạo' : 'Đã bỏ đánh dấu' });
    },
  });
}
