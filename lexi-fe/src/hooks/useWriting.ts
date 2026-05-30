'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { writingApi } from '@/api/writing';
import type { SaveDraftRequest, SubmitWritingRequest, WritingMode, WritingStatus } from '@/types/api';

const PENDING_STATUSES = new Set<WritingStatus>(['SUBMITTED', 'AI_PROCESSING']);

export function useWritingList(mode?: WritingMode, page = 0, size = 20) {
  return useQuery({
    queryKey: ['writing', 'list', mode, page],
    queryFn: () =>
      writingApi.list({ mode, page, size }).then((r) => r.data.data!),
  });
}

export function useWritingDetail(id: string) {
  return useQuery({
    queryKey: ['writing', id],
    queryFn: () => writingApi.getById(id).then((r) => r.data.data!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && PENDING_STATUSES.has(status) ? 3000 : false;
    },
  });
}

export function useSubmitWriting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitWritingRequest) =>
      writingApi.submit(data).then((r) => r.data.data!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['writing', 'list'] });
    },
  });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveDraftRequest) =>
      writingApi.saveDraft(data).then((r) => r.data.data!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['writing', 'list'] });
    },
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaveDraftRequest }) =>
      writingApi.updateDraft(id, data).then((r) => r.data.data!),
    onSuccess: (entry) => {
      void queryClient.invalidateQueries({ queryKey: ['writing', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['writing', entry.id] });
    },
  });
}

export function useSubmitDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      writingApi.submitDraft(id).then((r) => r.data.data!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['writing', 'list'] });
    },
  });
}

export function useDeleteWriting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => writingApi.softDelete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['writing', 'list'] });
    },
  });
}
