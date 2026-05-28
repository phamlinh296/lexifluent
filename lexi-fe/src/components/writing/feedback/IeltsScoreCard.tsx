import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { IeltsScore } from '@/types/api';

interface IeltsScoreCardProps {
  score: IeltsScore;
}

export function IeltsScoreCard({ score }: IeltsScoreCardProps) {
  const radarData = [
    { subject: 'Task\nAchievement', value: score.taskAchievement },
    { subject: 'Coherence &\nCohesion', value: score.coherenceCohesion },
    { subject: 'Lexical\nResource', value: score.lexicalResource },
    { subject: 'Grammatical\nRange', value: score.grammaticalRange },
  ];

  return (
    <div className="space-y-6">
      {/* Overall band */}
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold text-primary">{score.band.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground mt-1">Estimated Band Score</div>
        </div>
      </div>

      {/* Radar chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
            <Radar dataKey="value" fill="hsl(var(--primary))" fillOpacity={0.2} stroke="hsl(var(--primary))" strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Task Achievement', value: score.taskAchievement },
          { label: 'Coherence & Cohesion', value: score.coherenceCohesion },
          { label: 'Lexical Resource', value: score.lexicalResource },
          { label: 'Grammatical Range', value: score.grammaticalRange },
        ].map(({ label, value }) => (
          <div key={label} className="bg-muted rounded-lg p-3 text-center">
            <div className="text-lg font-bold">{value.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* AI Feedback text */}
      {score.feedback && (
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
          {score.feedback}
        </div>
      )}
    </div>
  );
}
