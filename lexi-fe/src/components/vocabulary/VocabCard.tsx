import { cefrColor } from '@/lib/utils';
import type { VocabularyItem } from '@/types/api';

export function VocabCard({ item }: { item: VocabularyItem }) {
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
