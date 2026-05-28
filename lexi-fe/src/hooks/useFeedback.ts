'use client';

import { useQuery } from '@tanstack/react-query';
import { feedbackApi } from '@/api/feedback';
import type { WritingStatus } from '@/types/api';

export function useFeedback(entryId: string, status: WritingStatus | undefined) {
  return useQuery({
    queryKey: ['feedback', entryId],
    queryFn: () => feedbackApi.getLatest(entryId).then((r) => r.data.data!),
    enabled: status === 'PROCESSED',
    staleTime: Infinity,
  });
}
