import { BookmarkPlus, Check } from 'lucide-react';
import { cefrColor } from '@/lib/utils';
import type { VocabularyItem } from '@/types/api';

interface VocabCardProps {
  item: VocabularyItem;
  onAddFlashcard?: () => void;
  isSaved?: boolean;
}

export function VocabCard({ item, onAddFlashcard, isSaved }: VocabCardProps) {
  return (
    <div className="border rounded-xl p-4 bg-card space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{item.word}</span>
        <div className="flex items-center gap-2">
          {item.cefrLevel && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cefrColor(item.cefrLevel)}`}>
              {item.cefrLevel}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${item.mastered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {item.mastered ? 'Đã thành thạo' : `Gặp ${item.encounterCount} lần`}
          </span>
          {onAddFlashcard && (
            <button
              onClick={onAddFlashcard}
              disabled={isSaved}
              title={isSaved ? 'Đã lưu flashcard' : 'Thêm vào flashcard'}
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
