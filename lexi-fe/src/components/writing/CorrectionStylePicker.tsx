import { cn } from '@/lib/utils';
import type { CorrectionStyle, WritingMode } from '@/types/api';

const STYLES_BY_MODE: Record<WritingMode, { style: CorrectionStyle; label: string; desc: string }[]> = {
  DAILY_ENGLISH: [
    { style: 'GRAMMAR_CORRECTION', label: 'Sửa ngữ pháp', desc: 'Chỉ sửa lỗi ngữ pháp, chính tả' },
    { style: 'NATURAL_REWRITE', label: 'Viết tự nhiên hơn', desc: 'Gợi ý cách viết tự nhiên hơn' },
    { style: 'NATIVE_REWRITE', label: 'Phong cách Native', desc: 'Viết lại theo phong cách người bản ngữ' },
  ],
  IELTS_TASK1: [
    { style: 'IELTS_BAND_6', label: 'Target Band 6', desc: 'Feedback theo tiêu chí IELTS Band 6' },
    { style: 'IELTS_BAND_7_8', label: 'Target Band 7-8', desc: 'Feedback nâng cao, phân tích chi tiết hơn' },
  ],
  IELTS_TASK2: [
    { style: 'IELTS_BAND_6', label: 'Target Band 6', desc: 'Feedback theo tiêu chí IELTS Band 6' },
    { style: 'IELTS_BAND_7_8', label: 'Target Band 7-8', desc: 'Feedback nâng cao, phân tích chi tiết hơn' },
  ],
};

interface CorrectionStylePickerProps {
  mode: WritingMode;
  value: CorrectionStyle | null;
  onChange: (style: CorrectionStyle) => void;
}

export function CorrectionStylePicker({ mode, value, onChange }: CorrectionStylePickerProps) {
  const options = STYLES_BY_MODE[mode];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map(({ style, label, desc }) => (
        <button
          key={style}
          type="button"
          onClick={() => onChange(style)}
          className={cn(
            'text-left p-4 rounded-xl border-2 transition-all bg-card',
            value === style ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
          )}
        >
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
        </button>
      ))}
    </div>
  );
}
