'use client';

import { useMemo, useState } from 'react';
import { useVocabularyList, useWeakVocabulary } from '@/hooks/useVocabulary';
import { useFlashcards, useCreateFlashcard } from '@/hooks/useFlashcards';
import { VocabCard } from '@/components/vocabulary/VocabCard';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CefrLevel, VocabularyItem } from '@/types/api';

const CEFR_OPTIONS: (CefrLevel | 'ALL')[] = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function VocabularyPage() {
  const [tab, setTab] = useState<'all' | 'weak'>('all');
  const [search, setSearch] = useState('');
  const [cefrFilter, setCefrFilter] = useState<CefrLevel | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  // Track vocab items saved as flashcard in this session
  const [sessionSaved, setSessionSaved] = useState<Set<string>>(new Set());

  const allQuery = useVocabularyList(page, 30);
  const weakQuery = useWeakVocabulary(page, 20);
  const activeQuery = tab === 'all' ? allQuery : weakQuery;
  const { data, isLoading } = activeQuery;

  const { data: allFlashcards = [] } = useFlashcards(false);
  const createFlashcard = useCreateFlashcard();

  // Build set of vocabulary item IDs that already have a flashcard
  const savedVocabIds = useMemo(
    () => new Set(allFlashcards.map((f) => f.vocabularyItemId).filter(Boolean) as string[]),
    [allFlashcards],
  );

  const filtered = (data?.content ?? []).filter((v) => {
    const matchSearch = !search || v.word.toLowerCase().includes(search.toLowerCase());
    const matchCefr = cefrFilter === 'ALL' || v.cefrLevel === cefrFilter;
    return matchSearch && matchCefr;
  });

  function handleAddFlashcard(item: VocabularyItem) {
    createFlashcard.mutate(
      {
        front: item.word,
        back: [item.definition, item.exampleSentence ? `Ví dụ: ${item.exampleSentence}` : '']
          .filter(Boolean)
          .join('\n'),
        cefrLevel: item.cefrLevel ?? undefined,
        vocabularyItemId: item.id,
      },
      { onSuccess: () => setSessionSaved((prev) => new Set(prev).add(item.id)) },
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Từ vựng của tôi</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg w-fit">
        {([['all', 'Tất cả'], ['weak', 'Cần ôn']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setPage(0); }}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder="Tìm từ..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
        <div className="flex gap-1.5 flex-wrap">
          {CEFR_OPTIONS.map((level) => (
            <button
              key={level}
              onClick={() => setCefrFilter(level)}
              className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
                cefrFilter === level ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50')}
            >
              {level === 'ALL' ? 'Tất cả' : level}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="border rounded-xl p-4 bg-card animate-pulse h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">{search ? 'Không tìm thấy từ phù hợp' : 'Chưa có từ vựng nào'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((v) => (
            <VocabCard
              key={v.id}
              item={v}
              onAddFlashcard={() => handleAddFlashcard(v)}
              isSaved={savedVocabIds.has(v.id) || sessionSaved.has(v.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && !search && (
        <div className="flex justify-center gap-2 mt-6">
          <button className="text-sm text-muted-foreground disabled:opacity-40" disabled={page === 0} onClick={() => setPage(page - 1)}>← Trước</button>
          <span className="text-sm text-muted-foreground">{page + 1} / {data.totalPages}</span>
          <button className="text-sm text-muted-foreground disabled:opacity-40" disabled={page >= data.totalPages - 1} onClick={() => setPage(page + 1)}>Sau →</button>
        </div>
      )}
    </div>
  );
}
