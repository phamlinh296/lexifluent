import { Progress } from '@/components/ui/progress';
import { cefrColor, formatPercent } from '@/lib/utils';
import type { AnalyticsMeta } from '@/types/api';

const METRICS: { key: keyof AnalyticsMeta; label: string }[] = [
  { key: 'grammarAccuracy', label: 'Độ chính xác ngữ pháp' },
  { key: 'fluencyScore', label: 'Độ trôi chảy' },
  { key: 'lexicalDiversity', label: 'Đa dạng từ vựng' },
  { key: 'naturalnessScore', label: 'Tính tự nhiên' },
];

export function AnalyticsScores({ analytics }: { analytics: AnalyticsMeta }) {
  return (
    <div className="space-y-5">
      {METRICS.map(({ key, label }) => {
        const value = analytics[key] as number;
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{formatPercent(value)}</span>
            </div>
            <Progress value={value * 100} />
          </div>
        );
      })}

      <div className="pt-2 flex items-center justify-between border-t">
        <div className="text-sm text-muted-foreground">
          <span className="mr-4">{analytics.sentenceCount} câu</span>
          <span>Trung bình {analytics.avgSentenceLength.toFixed(1)} từ/câu</span>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cefrColor(analytics.estimatedCefrLevel)}`}>
          {analytics.estimatedCefrLevel}
        </span>
      </div>
    </div>
  );
}
