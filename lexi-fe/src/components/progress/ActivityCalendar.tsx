'use client';

import type { CalendarDay } from '@/types/api';

const CELL = 11;
const GAP = 2;
const STEP = CELL + GAP;         // 13px per week column
const DAY_COL_W = 22;            // width of the day-label column

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_SHORT = ['Thg 1','Thg 2','Thg 3','Thg 4','Thg 5','Thg 6',
                     'Thg 7','Thg 8','Thg 9','Thg 10','Thg 11','Thg 12'];

function getIntensity(count: number): string {
  if (count === 0) return 'bg-muted';
  if (count === 1) return 'bg-emerald-200 dark:bg-emerald-900';
  if (count === 2) return 'bg-emerald-400 dark:bg-emerald-600';
  return 'bg-emerald-600 dark:bg-emerald-400';
}

export function ActivityCalendar({ data }: { data: CalendarDay[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from the Monday 52 full weeks ago
  const start = new Date(today);
  start.setDate(today.getDate() - 52 * 7);
  const dow = (start.getDay() + 6) % 7; // Mon=0
  start.setDate(start.getDate() - dow);

  // Generate every day from start → complete last week
  const dates: Date[] = [];
  const cur = new Date(start);
  while (cur <= today) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  while (dates.length % 7 !== 0) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }

  const numWeeks = dates.length / 7;
  const activityMap = new Map(data.map((d) => [d.date, d.writingCount]));

  // Build month + year labels: one label per "first week of a new month"
  type HeaderLabel = { col: number; text: string; isYear: boolean };
  const headerLabels: HeaderLabel[] = [];
  let lastMonth = -1;

  for (let w = 0; w < numWeeks; w++) {
    const d = dates[w * 7];
    if (!d) continue;
    const m = d.getMonth();
    const y = d.getFullYear();
    if (m !== lastMonth) {
      const isYearChange = m === 0 && lastMonth !== -1;
      const lastCol = headerLabels.at(-1)?.col ?? -4;
      if (w - lastCol >= 3) {
        const label = isYearChange ? String(y) : MONTH_SHORT[m];
        if (label !== undefined) {
          headerLabels.push({ col: w, text: label, isYear: isYearChange });
        }
      }
      lastMonth = m;
    }
  }

  const totalActive = data.filter((d) => d.writingCount > 0).length;

  return (
    <div className="space-y-3 overflow-x-auto">
      <div
        className="inline-flex flex-col"
        style={{ gap: 4, minWidth: DAY_COL_W + GAP + numWeeks * STEP - GAP }}
      >
        {/* Month / year labels row */}
        <div className="relative" style={{ height: 14, paddingLeft: DAY_COL_W + GAP }}>
          {headerLabels.map(({ col, text, isYear }) => (
            <span
              key={col}
              className={`absolute text-[9px] leading-none whitespace-nowrap ${isYear ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
              style={{ left: DAY_COL_W + GAP + col * STEP }}
            >
              {text}
            </span>
          ))}
        </div>

        {/* Day labels + grid */}
        <div className="flex items-start" style={{ gap: GAP }}>
          {/* Day-of-week labels */}
          <div className="flex flex-col shrink-0" style={{ gap: GAP, width: DAY_COL_W }}>
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-[9px] text-muted-foreground flex items-center justify-end pr-1"
                style={{ height: CELL }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap grid — column-flow (week = column, day = row) */}
          <div
            className="grid"
            style={{
              gridTemplateRows: `repeat(7, ${CELL}px)`,
              gridTemplateColumns: `repeat(${numWeeks}, ${CELL}px)`,
              gridAutoFlow: 'column',
              gap: GAP,
            }}
          >
            {dates.map((date, i) => {
              const isFuture = date > today;
              const key = date.toISOString().slice(0, 10);
              const count = isFuture ? 0 : (activityMap.get(key) ?? 0);
              return (
                <div
                  key={i}
                  title={!isFuture ? (count > 0 ? `${key}: ${count} bài` : key) : ''}
                  className={`rounded-[2px] transition-colors ${isFuture ? 'opacity-0' : getIntensity(count)}`}
                  style={{ width: CELL, height: CELL }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {totalActive} ngày có hoạt động trong 52 tuần qua
        </p>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <span>Ít</span>
          {[0, 1, 2, 3].map((level) => (
            <div key={level} className={`rounded-[2px] ${getIntensity(level)}`} style={{ width: CELL, height: CELL }} />
          ))}
          <span>Nhiều</span>
        </div>
      </div>
    </div>
  );
}
