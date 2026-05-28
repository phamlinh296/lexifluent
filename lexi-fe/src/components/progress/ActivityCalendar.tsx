'use client';

import type { CalendarDay } from '@/types/api';

interface Props {
  data: CalendarDay[];
  days?: number;
}

function getIntensity(count: number): string {
  if (count === 0) return 'bg-muted';
  if (count === 1) return 'bg-primary/30';
  if (count === 2) return 'bg-primary/55';
  return 'bg-primary/85';
}

export function ActivityCalendar({ data, days = 90 }: Props) {
  const today = new Date();
  const activityMap = new Map(data.map((d) => [d.date, d.writingCount]));

  // Build array of last `days` dates, oldest first
  const dates: Date[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return d;
  });

  // Pad so first day aligns to Mon (weekday 1)
  // Convert to Mon-based (Mon=0...Sun=6) so grid starts on Monday
  const mondayBased = ((dates[0]?.getDay() ?? 1) + 6) % 7;
  const paddedDates: (Date | null)[] = [
    ...Array(mondayBased).fill(null),
    ...dates,
  ];

  const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const totalStreak = data.filter((d) => d.writingCount > 0).length;

  return (
    <div className="space-y-2">
      <div className="flex gap-1 text-[10px] text-muted-foreground mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="w-3 text-center">{d}</div>
        ))}
      </div>

      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
        {paddedDates.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} className="h-3 w-3 rounded-sm" />;
          const key = date.toISOString().slice(0, 10);
          const count = activityMap.get(key) ?? 0;
          return (
            <div
              key={key}
              title={count > 0 ? `${key}: ${count} bài` : key}
              className={`h-3 w-3 rounded-sm transition-colors ${getIntensity(count)}`}
            />
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        {totalStreak} ngày có hoạt động trong {days} ngày qua
      </p>
    </div>
  );
}
