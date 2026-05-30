'use client';

import { useMemo } from 'react';
import { cefrColor } from '@/lib/utils';
import type { VocabularySuggestion } from '@/types/api';
import { useCreateFlashcard, useDeleteFlashcard, useFlashcards } from '@/hooks/useFlashcards';
import { Button } from '@/components/ui/button';
import { BookmarkCheck, BookmarkPlus, Loader2 } from 'lucide-react';

export function VocabSuggestions({ suggestions }: { suggestions: VocabularySuggestion[] | null | undefined }) {
  const { data: existingCards = [] } = useFlashcards(false);
  const createFlashcard = useCreateFlashcard();
  const deleteFlashcard = useDeleteFlashcard();

  // word (lowercase) → flashcard — dùng để lấy ID khi bỏ lưu
  const wordToFlashcard = useMemo(
    () => new Map(existingCards.map((f) => [f.front.toLowerCase(), f])),
    [existingCards],
  );

  const list = suggestions ?? [];
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Không có gợi ý từ vựng</p>;
  }

  function saveFlashcard(s: VocabularySuggestion) {
    const back = [
      s.definition,
      s.exampleSentence ? `Ví dụ: ${s.exampleSentence}` : '',
      s.collocations?.length > 0 ? `Collocations: ${s.collocations.join(', ')}` : '',
    ].filter(Boolean).join('\n');
    createFlashcard.mutate({ front: s.word, back, cefrLevel: s.cefrLevel ?? undefined });
  }

  return (
    <div className="space-y-4">
      {list.map((s, i) => {
        const key = s.word.toLowerCase();
        const savedCard = wordToFlashcard.get(key);
        const isSaved = !!savedCard;
        const isSaving = createFlashcard.isPending;
        const isDeleting = deleteFlashcard.isPending;
        const busy = isSaving || isDeleting;

        return (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{s.word}</span>
                {s.cefrLevel && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cefrColor(s.cefrLevel)}`}>
                    {s.cefrLevel}
                  </span>
                )}
              </div>

              {isSaved ? (
                /* Đã lưu — click để bỏ lưu */
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => deleteFlashcard.mutate(savedCard.id)}
                  title="Click để bỏ lưu"
                  className="h-7 px-2 text-xs gap-1 text-green-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <BookmarkCheck className="h-3.5 w-3.5" />
                  )}
                  Đã lưu
                </Button>
              ) : (
                /* Chưa lưu */
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => saveFlashcard(s)}
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <BookmarkPlus className="h-3.5 w-3.5" />
                  )}
                  Lưu flashcard
                </Button>
              )}
            </div>

            {s.definition && (
              <p className="text-sm text-muted-foreground">{s.definition}</p>
            )}

            {(s.alternatives?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Từ đồng nghĩa</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.alternatives.map((a) => (
                    <span key={a} className="text-xs bg-secondary px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {(s.collocations?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Collocations</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.collocations.map((c) => (
                    <span key={c} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {s.exampleSentence && (
              <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-3">
                {s.exampleSentence}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
