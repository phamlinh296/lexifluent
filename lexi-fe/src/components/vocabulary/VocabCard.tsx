'use client';

import { useEffect, useRef, useState } from 'react';
import { BookmarkPlus, Check, ChevronDown, Folder, Trophy } from 'lucide-react';
import { cefrColor, cn } from '@/lib/utils';
import type { FlashcardGroup, VocabularyItem } from '@/types/api';

const TOPIC_LABELS: Record<string, string> = {
  education: 'Giáo dục', technology: 'Công nghệ', business: 'Kinh doanh',
  health: 'Sức khỏe', environment: 'Môi trường', travel: 'Du lịch',
  linking_word: 'Liên từ', academic: 'Học thuật', daily_life: 'Hàng ngày',
  social: 'Xã hội', science: 'Khoa học', law: 'Pháp luật',
};

interface VocabCardProps {
  item: VocabularyItem;
  savedFlashcardId?: string;          // set = đã lưu; undefined = chưa lưu
  onSave?: (groupId?: string) => void; // undefined = lưu standalone, string = lưu vào nhóm
  onRemoveFlashcard?: () => void;      // bỏ lưu
  onToggleMastered?: () => void;
  groups?: FlashcardGroup[];
}

export function VocabCard({
  item, savedFlashcardId, onSave, onRemoveFlashcard, onToggleMastered, groups = [],
}: VocabCardProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="border rounded-xl p-4 bg-card space-y-2">
      <div className="flex items-start justify-between gap-2">
        {/* Word + badges */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-semibold">{item.word}</span>
          {item.cefrLevel && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cefrColor(item.cefrLevel)}`}>
              {item.cefrLevel}
            </span>
          )}
          {item.topicTag && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 shrink-0">
              {TOPIC_LABELS[item.topicTag] ?? item.topicTag}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mastered toggle */}
          {onToggleMastered ? (
            <button
              onClick={onToggleMastered}
              title={item.mastered ? 'Bỏ thành thạo' : 'Đánh dấu thành thạo'}
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                item.mastered
                  ? 'border-green-300 bg-green-50 text-green-600'
                  : 'border-border text-muted-foreground hover:border-green-300 hover:text-green-600'
              }`}
            >
              <Trophy className="h-3 w-3" />
              {item.mastered ? 'Thành thạo' : `${item.encounterCount} lần`}
            </button>
          ) : (
            <span className={`text-xs px-2 py-0.5 rounded-full ${item.mastered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {item.mastered ? 'Đã thành thạo' : `Gặp ${item.encounterCount} lần`}
            </span>
          )}

          {/* Save button */}
          {onSave && (
            savedFlashcardId ? (
              /* Đã lưu — click để bỏ lưu */
              <button
                onClick={onRemoveFlashcard}
                title="Click để bỏ lưu flashcard"
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-green-300 bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
              >
                <Check className="h-3 w-3" />
                Đã lưu
              </button>
            ) : (
              /* Chưa lưu — dropdown chọn nhóm hoặc standalone */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <BookmarkPlus className="h-3 w-3" />
                  Lưu
                  <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
                </button>

                {open && (
                  <div className="absolute right-0 top-7 z-20 w-52 bg-white dark:bg-zinc-900 border rounded-lg shadow-xl py-1">
                    {/* Lưu không có nhóm */}
                    <button
                      onClick={() => { onSave(undefined); setOpen(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 text-muted-foreground"
                    >
                      <BookmarkPlus className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs">Không có nhóm</span>
                    </button>

                    {/* Danh sách nhóm */}
                    {groups.length > 0 && (
                      <>
                        <div className="border-t my-1" />
                        <p className="text-[10px] text-muted-foreground px-3 pb-1">Lưu vào nhóm</p>
                        {groups.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => { onSave(g.id); setOpen(false); }}
                            className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                          >
                            <Folder className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                            <span className="truncate text-xs">{g.name}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {item.phonetic && <span className="text-sm font-mono text-muted-foreground">{item.phonetic}</span>}
        {item.vietnameseMeaning && <span className="text-sm text-blue-600 dark:text-blue-400">{item.vietnameseMeaning}</span>}
      </div>
      {item.definition && <p className="text-sm text-muted-foreground">{item.definition}</p>}
      {item.exampleSentence && (
        <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">
          {item.exampleSentence}
        </p>
      )}
    </div>
  );
}
