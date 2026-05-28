'use client';

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { UserProgress } from '@/types/api';

export function SkillRadarChart({ progress }: { progress: UserProgress }) {
  const data = [
    { subject: 'Ngữ pháp', value: Math.round((progress.avgGrammarAccuracy ?? 0) * 100) },
    { subject: 'Trôi chảy', value: Math.round((progress.avgFluencyScore ?? 0) * 100) },
    { subject: 'Từ vựng', value: Math.round((progress.avgLexicalDiversity ?? 0) * 100) },
    { subject: 'Tự nhiên', value: 0 }, // naturalnessScore not in UserProgress, placeholder
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => `${v}%`} />
          <Radar dataKey="value" fill="hsl(var(--primary))" fillOpacity={0.25} stroke="hsl(var(--primary))" strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
