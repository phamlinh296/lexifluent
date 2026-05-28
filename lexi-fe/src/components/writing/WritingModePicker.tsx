import { BarChart3, FileText, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WritingMode } from '@/types/api';

const MODES: { mode: WritingMode; icon: React.ElementType; label: string; desc: string }[] = [
  { mode: 'DAILY_ENGLISH', icon: PenLine, label: 'Daily English', desc: 'Viết tự do về bất kỳ chủ đề nào' },
  { mode: 'IELTS_TASK1', icon: BarChart3, label: 'IELTS Task 1', desc: 'Mô tả biểu đồ, bảng số liệu' },
  { mode: 'IELTS_TASK2', icon: FileText, label: 'IELTS Task 2', desc: 'Nghị luận, lập luận' },
];

interface WritingModePickerProps {
  value: WritingMode | null;
  onChange: (mode: WritingMode) => void;
}

export function WritingModePicker({ value, onChange }: WritingModePickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {MODES.map(({ mode, icon: Icon, label, desc }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            'flex flex-col items-center gap-3 p-6 rounded-xl border-2 text-center transition-all bg-card hover:border-primary/50',
            value === mode ? 'border-primary bg-primary/5' : 'border-border',
          )}
        >
          <div className={cn('p-3 rounded-full', value === mode ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
