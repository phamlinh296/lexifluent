import { cn } from '@/lib/utils';
import type { TargetBand } from '@/types/api';

const BANDS: { band: TargetBand; label: string; desc: string; strong: boolean }[] = [
  { band: 'BAND_6_0', label: 'Band 6.0', desc: 'Competent user', strong: false },
  { band: 'BAND_6_5', label: 'Band 6.5', desc: 'Upper competent', strong: false },
  { band: 'BAND_7_0', label: 'Band 7.0', desc: 'Good user', strong: false },
  { band: 'BAND_7_5', label: 'Band 7.5', desc: 'Upper good', strong: true },
  { band: 'BAND_8_0', label: 'Band 8.0', desc: 'Very good user', strong: true },
  { band: 'BAND_8_5', label: 'Band 8.5', desc: 'Expert user', strong: true },
];

interface TargetBandPickerProps {
  value: TargetBand | null;
  onChange: (band: TargetBand) => void;
}

export function TargetBandPicker({ value, onChange }: TargetBandPickerProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {BANDS.map(({ band, label, desc }) => (
          <button
            key={band}
            type="button"
            onClick={() => onChange(band)}
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all bg-card',
              value === band
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40',
            )}
          >
            <span className={cn('text-lg font-bold', value === band ? 'text-primary' : '')}>
              {label.replace('Band ', '')}
            </span>
            <span className="text-xs text-muted-foreground leading-tight">{desc}</span>
          </button>
        ))}
      </div>
      {value && (
        <p className="text-xs text-muted-foreground">
          {BANDS.find(b => b.band === value)?.strong
            ? '⚡ Dùng AI model mạnh hơn để đánh giá chuyên sâu hơn.'
            : '✓ Feedback tập trung vào các lỗi có tác động lớn nhất.'}
        </p>
      )}
    </div>
  );
}
