'use client';

import { useState } from 'react';
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
  onAddFlashcard?: () => void;
  isSaved?: boolean;
  onToggleMastered?: () => void;
  groups?: FlashcardGroup[];
  onAddToGroup?: (groupId: string) => void;
}

export function VocabCard({
  item, onAddFlashcard, isSaved, onToggleMastered, groups = [], onAddToGroup,
}: VocabCardProps) {
  const [showGroupPicker, setShowGroupPicker] = useState(false);

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

          {/* Add to group dropdown */}
          {groups.length > 0 && onAddToGroup && (
            <div className="relative">
              <button
                onClick={() => setShowGroupPicker((v) => !v)}
                title="Thêm vào nhóm"
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Folder className="h-3 w-3" />
                Nhóm
                <ChevronDown className={cn('h-3 w-3 transition-transform', showGroupPicker && 'rotate-180')} />
              </button>
              {showGroupPicker && (
                <div className="absolute right-0 top-7 z-20 w-44 bg-popover border rounded-lg shadow-lg py-1">
                  <p className="text-xs text-muted-foreground px-3 py-1 border-b">Chọn nhóm</p>
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => { onAddToGroup(g.id); setShowGroupPicker(false); }}
                      className="w-full text-left text-sm px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                    >
                      <Folder className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                      <span className="truncate">{g.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Save as flashcard */}
          {onAddFlashcard && (
            <button
              onClick={onAddFlashcard}
              disabled={isSaved}
              title={isSaved ? 'Đã lưu flashcard' : 'Lưu làm flashcard'}
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                isSaved
                  ? 'border-green-300 bg-green-50 text-green-600 cursor-default'
                  : 'border-border hover:border-primary/50 hover:text-primary text-muted-foreground'
              }`}
            >
              {isSaved ? <Check className="h-3 w-3" /> : <BookmarkPlus className="h-3 w-3" />}
              {isSaved ? 'Đã lưu' : 'Flashcard'}
            </button>
          )}
        </div>
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
