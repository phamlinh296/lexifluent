'use client';

import { useQuery } from '@tanstack/react-query';
import { vocabularyApi } from '@/api/vocabulary';

export function useVocabularyList(page = 0, size = 30) {
  return useQuery({
    queryKey: ['vocabulary', 'all', page],
    queryFn: () => vocabularyApi.list({ page, size }).then((r) => r.data.data!),
  });
}

export function useWeakVocabulary(page = 0, size = 20) {
  return useQuery({
    queryKey: ['vocabulary', 'weak', page],
    queryFn: () => vocabularyApi.listWeak({ page, size }).then((r) => r.data.data!),
  });
}
