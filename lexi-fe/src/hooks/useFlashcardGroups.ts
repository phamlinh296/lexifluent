'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flashcardGroupsApi } from '@/api/flashcardGroups';
import { toast } from '@/hooks/useToast';

export function useFlashcardGroups() {
  return useQuery({
    queryKey: ['flashcard-groups'],
    queryFn: () => flashcardGroupsApi.list().then((r) => r.data.data ?? []),
  });
}

export function useGroupCards(groupId: string | null) {
  return useQuery({
    queryKey: ['flashcard-groups', groupId, 'cards'],
    queryFn: () => flashcardGroupsApi.listCards(groupId!).then((r) => r.data.data ?? []),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => flashcardGroupsApi.create(name).then((r) => r.data.data!),
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: ['flashcard-groups'] });
      toast({ title: `Đã tạo nhóm "${g.name}"` });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.code === 'FLASHCARD_003'
        ? 'Tên nhóm đã tồn tại'
        : 'Tạo nhóm thất bại';
      toast({ title: msg, variant: 'destructive' });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => flashcardGroupsApi.delete(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcard-groups'] });
      qc.invalidateQueries({ queryKey: ['flashcards'] });
      toast({ title: 'Đã xóa nhóm' });
    },
  });
}

export function useAddCardToGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, cardId }: { groupId: string; cardId: string }) =>
      flashcardGroupsApi.addCard(groupId, cardId),
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: ['flashcard-groups', groupId, 'cards'] });
      qc.invalidateQueries({ queryKey: ['flashcards'] });
    },
  });
}

export function useRemoveCardFromGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, cardId }: { groupId: string; cardId: string }) =>
      flashcardGroupsApi.removeCard(groupId, cardId),
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: ['flashcard-groups', groupId, 'cards'] });
      qc.invalidateQueries({ queryKey: ['flashcards'] });
    },
  });
}
