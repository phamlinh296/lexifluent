'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Correction, CorrectionSeverity, CorrectionType } from '@/types/api';

const SEVERITY_CONFIG: Record<CorrectionSeverity, { label: string; className: string }> = {
  HIGH: { label: 'Cao', className: 'bg-red-100 text-red-700' },
  MEDIUM: { label: 'Trung bình', className: 'bg-yellow-100 text-yellow-700' },
  LOW: { label: 'Thấp', className: 'bg-blue-100 text-blue-700' },
};

const TYPE_LABELS: Record<CorrectionType, string> = {
  GRAMMAR: 'Ngữ pháp',
  SPELLING: 'Chính tả',
  PUNCTUATION: 'Dấu câu',
  WORD_CHOICE: 'Từ ngữ',
  STRUCTURE: 'Cấu trúc',
};

export function CorrectionsList({ corrections }: { corrections: Correction[] | null | undefined }) {
  const [typeFilter, setTypeFilter] = useState<CorrectionType | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<CorrectionSeverity | 'ALL'>('ALL');

  const list = corrections ?? [];
  const filtered = list.filter(
    (c) =>
      (typeFilter === 'ALL' || c.type === typeFilter) &&
      (severityFilter === 'ALL' || c.severity === severityFilter),
  );

  if (list.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Không tìm thấy lỗi nào 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'GRAMMAR', 'SPELLING', 'PUNCTUATION', 'WORD_CHOICE', 'STRUCTURE'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
              typeFilter === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50')}
          >
            {t === 'ALL' ? 'Tất cả' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
              severityFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50')}
          >
            {s === 'ALL' ? 'Tất cả' : SEVERITY_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((c, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium bg-secondary px-2 py-0.5 rounded">{TYPE_LABELS[c.type]}</span>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded', SEVERITY_CONFIG[c.severity].className)}>
                {SEVERITY_CONFIG[c.severity].label}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="line-through text-destructive/80">{c.original}</p>
                <p className="text-green-700 font-medium mt-1">{c.corrected}</p>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">{c.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
