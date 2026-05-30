'use client';

import { useMemo, useState } from 'react';
import { useVocabularyList, useWeakVocabulary, useVocabTopics, useAddVocabulary, useMarkMastered, useAddVocabToGroup } from '@/hooks/useVocabulary';
import { useFlashcards, useCreateFlashcard, useDeleteFlashcard } from '@/hooks/useFlashcards';
import { useFlashcardGroups } from '@/hooks/useFlashcardGroups';
import { VocabCard } from '@/components/vocabulary/VocabCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X, Search } from 'lucide-react';
import type { CefrLevel, VocabularyItem } from '@/types/api';

type Tab = 'all' | 'topics' | 'weak';

const CEFR_OPTIONS: (CefrLevel | 'ALL')[] = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const TOPIC_LABELS: Record<string, string> = {
  education: 'Giáo dục', technology: 'Công nghệ', business: 'Kinh doanh',
  health: 'Sức khỏe', environment: 'Môi trường', travel: 'Du lịch',
  linking_word: 'Liên từ', academic: 'Học thuật', daily_life: 'Hàng ngày',
  social: 'Xã hội', science: 'Khoa học', law: 'Pháp luật',
};

const TOPIC_ICONS: Record<string, string> = {
  education: '📚', technology: '💻', business: '💼', health: '🏥',
  environment: '🌿', travel: '✈️', linking_word: '🔗', academic: '🎓',
  daily_life: '🏠', social: '👥', science: '🔬', law: '⚖️',
};

export default function VocabularyPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [cefrFilter, setCefrFilter] = useState<CefrLevel | 'ALL'>('ALL');
  const [topicFilter, setTopicFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [showAddWord, setShowAddWord] = useState(false);
  const [newWord, setNewWord] = useState('');

  const allQuery = useVocabularyList(page, 30, topicFilter);
  const weakQuery = useWeakVocabulary(page, 20);
  const { data: topics = [] } = useVocabTopics();
  const { data: allFlashcards = [] } = useFlashcards(false);
  const { data: groups = [] } = useFlashcardGroups();
  const createFlashcard = useCreateFlashcard();
  const deleteFlashcard = useDeleteFlashcard();
  const addVocab = useAddVocabulary();
  const markMastered = useMarkMastered();
  const addToGroup = useAddVocabToGroup();

  const activeQuery = tab === 'weak' ? weakQuery : allQuery;
  const { data, isLoading } = activeQuery;

  // vocabId → flashcard (chỉ lấy BASIC card liên kết vocab)
  const vocabToFlashcard = useMemo(
    () => new Map(
      allFlashcards
        .filter((f) => f.vocabularyItemId !== null)
        .map((f) => [f.vocabularyItemId!, f]),
    ),
    [allFlashcards],
  );

  const filtered = (data?.content ?? []).filter((v) => {
    const matchSearch = !search || v.word.toLowerCase().includes(search.toLowerCase());
    const matchCefr = cefrFilter === 'ALL' || v.cefrLevel === cefrFilter;
    return matchSearch && matchCefr;
  });

  function handleTabChange(t: Tab) {
    setTab(t);
    setPage(0);
    setSearch('');
    if (t !== 'all') setTopicFilter(undefined);
  }

  function handleTopicClick(topic: string) {
    setTopicFilter(topic);
    setTab('all');
    setPage(0);
  }

  // groupId undefined = lưu standalone, string = lưu vào nhóm (tạo card nếu chưa có)
  function handleSave(item: VocabularyItem, groupId?: string) {
    if (groupId) {
      addToGroup.mutate({ vocabId: item.id, groupId });
    } else {
      createFlashcard.mutate({
        front: item.word,
        back: [item.definition, item.exampleSentence ? `Ví dụ: ${item.exampleSentence}` : '']
          .filter(Boolean).join('\n'),
        phonetic: item.phonetic ?? undefined,
        vietnameseMeaning: item.vietnameseMeaning ?? undefined,
        cefrLevel: item.cefrLevel ?? undefined,
        vocabularyItemId: item.id,
      });
    }
  }

  function handleAddWord() {
    if (!newWord.trim()) return;
    addVocab.mutate(newWord.trim(), {
      onSuccess: () => { setNewWord(''); setShowAddWord(false); },
    });
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Từ vựng của tôi</h1>
        <Button
          size="sm"
          variant={showAddWord ? 'outline' : 'default'}
          className="gap-1.5"
          onClick={() => { setShowAddWord((v) => !v); setNewWord(''); }}
        >
          {showAddWord ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          Thêm từ
        </Button>
      </div>

      {/* Manual add word form */}
      {showAddWord && (
        <div className="mb-5 p-4 border rounded-xl bg-card space-y-3">
          <p className="text-sm font-medium">Thêm từ mới <span className="text-destructive ml-0.5">*</span> — AI sẽ tự phân tích chủ đề, định nghĩa, ví dụ</p>
          <div className="flex gap-2">
            <Input
              placeholder="VD: curriculum, nevertheless, invoice..."
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddWord(); }}
              disabled={addVocab.isPending}
              className="flex-1"
              autoFocus
            />
            <Button onClick={handleAddWord} disabled={!newWord.trim() || addVocab.isPending} size="sm">
              {addVocab.isPending ? 'Đang xử lý...' : 'Thêm'}
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted p-1 rounded-lg w-fit">
        {([['all', 'Tất cả'], ['topics', 'Chủ đề'], ['weak', 'Cần ôn']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Topics tab ── */}
      {tab === 'topics' && (
        <div>
          {topics.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Chưa có dữ liệu chủ đề. Hãy nộp bài viết để AI phân tích từ vựng.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {topics.map(({ topic, count }) => (
                <button
                  key={topic}
                  onClick={() => handleTopicClick(topic)}
                  className="flex flex-col items-start p-4 border rounded-xl bg-card hover:border-primary/50 hover:bg-accent/40 transition-colors text-left"
                >
                  <span className="text-2xl mb-2">{TOPIC_ICONS[topic] ?? '📖'}</span>
                  <span className="font-medium text-sm">{TOPIC_LABELS[topic] ?? topic}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{count} từ</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── All / Weak tab ── */}
      {tab !== 'topics' && (
        <>
          {/* Active topic filter pill */}
          {topicFilter && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Chủ đề:</span>
              <button
                onClick={() => setTopicFilter(undefined)}
                className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
              >
                {TOPIC_ICONS[topicFilter]} {TOPIC_LABELS[topicFilter] ?? topicFilter}
                <X className="h-3 w-3 ml-1" />
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm từ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 pl-8 h-8 text-sm"
              />
            </div>
            {tab === 'all' && (
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
            )}
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
              {filtered.map((v) => {
                const saved = vocabToFlashcard.get(v.id);
                return (
                  <VocabCard
                    key={v.id}
                    item={v}
                    savedFlashcardId={saved?.id}
                    onSave={(groupId) => handleSave(v, groupId)}
                    onRemoveFlashcard={saved ? () => deleteFlashcard.mutate(saved.id) : undefined}
                    onToggleMastered={() => markMastered.mutate({ id: v.id, mastered: !v.mastered })}
                    groups={groups}
                  />
                );
              })}
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
        </>
      )}
    </div>
  );
}
