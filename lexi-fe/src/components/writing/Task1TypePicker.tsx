import { BarChart2, LineChart, PieChart, Table2, GitMerge, Workflow, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task1Type } from '@/types/api';

const TASK1_TYPES: { type: Task1Type; icon: React.ElementType; label: string; desc: string }[] = [
  { type: 'BAR_CHART',   icon: BarChart2,  label: 'Bar Chart',    desc: 'Biểu đồ cột so sánh' },
  { type: 'LINE_GRAPH',  icon: LineChart,  label: 'Line Graph',   desc: 'Biểu đồ đường theo thời gian' },
  { type: 'PIE_CHART',   icon: PieChart,   label: 'Pie Chart',    desc: 'Biểu đồ tròn tỉ lệ' },
  { type: 'TABLE',       icon: Table2,     label: 'Table',        desc: 'Bảng số liệu' },
  { type: 'PROCESS',     icon: Workflow,   label: 'Process',      desc: 'Sơ đồ quy trình / các bước' },
  { type: 'MAP',         icon: Map,        label: 'Map / Plan',   desc: 'Bản đồ hoặc sơ đồ thay đổi' },
  { type: 'MIXED_CHART', icon: GitMerge,   label: 'Mixed Charts', desc: 'Kết hợp nhiều loại biểu đồ' },
];

interface Task1TypePickerProps {
  value: Task1Type | null;
  onChange: (type: Task1Type) => void;
}

export function Task1TypePicker({ value, onChange }: Task1TypePickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {TASK1_TYPES.map(({ type, icon: Icon, label, desc }) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all bg-card',
            value === type
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40',
          )}
        >
          <div className={cn('p-2 rounded-lg', value === type ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="font-semibold text-xs">{label}</p>
          <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
        </button>
      ))}
    </div>
  );
}
