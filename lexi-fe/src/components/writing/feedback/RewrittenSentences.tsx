import { ArrowRight } from 'lucide-react';
import type { RewrittenSentence, RewriteStyle } from '@/types/api';

const STYLE_LABELS: Record<RewriteStyle, string> = {
  NATURAL: 'Tự nhiên',
  NATIVE: 'Native',
  FORMAL: 'Trang trọng',
  CONCISE: 'Súc tích',
};

export function RewrittenSentences({ sentences }: { sentences: RewrittenSentence[] }) {
  if (sentences.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Không có câu được viết lại</p>;
  }

  return (
    <div className="space-y-4">
      {sentences.map((s, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-secondary px-2 py-0.5 rounded font-medium">{STYLE_LABELS[s.style]}</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{s.original}</p>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{s.rewritten}</p>
            </div>
          </div>
          {s.reason && (
            <p className="text-xs text-muted-foreground border-t pt-2">{s.reason}</p>
          )}
        </div>
      ))}
    </div>
  );
}
