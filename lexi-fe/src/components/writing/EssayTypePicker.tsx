import { cn } from '@/lib/utils';
import type { EssayType } from '@/types/api';

const ESSAY_TYPES: { type: EssayType; label: string; example: string }[] = [
  {
    type: 'OPINION',
    label: 'Opinion / Agree-Disagree',
    example: '"To what extent do you agree...?" / "Do you agree or disagree?"',
  },
  {
    type: 'DISCUSSION',
    label: 'Discussion',
    example: '"Discuss both views and give your opinion."',
  },
  {
    type: 'ADVANTAGES_DISADVANTAGES',
    label: 'Advantages & Disadvantages',
    example: '"Discuss the advantages and disadvantages..." / "Do the advantages outweigh...?"',
  },
  {
    type: 'PROBLEM_SOLUTION',
    label: 'Problem / Cause & Solution',
    example: '"What are the causes of this problem? What solutions can be offered?"',
  },
  {
    type: 'DOUBLE_QUESTION',
    label: 'Double Question',
    example: '"Why is this happening? What can be done to address it?"',
  },
  {
    type: 'DIRECT_QUESTION',
    label: 'Direct Question / Other',
    example: 'Không thuộc các dạng trên',
  },
];

interface EssayTypePickerProps {
  value: EssayType | null;
  onChange: (type: EssayType) => void;
}

export function EssayTypePicker({ value, onChange }: EssayTypePickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {ESSAY_TYPES.map(({ type, label, example }) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            'text-left p-4 rounded-xl border-2 transition-all bg-card',
            value === type
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40',
          )}
        >
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{example}</p>
        </button>
      ))}
    </div>
  );
}
