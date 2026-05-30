'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';
import { SkillRadarChart } from '@/components/progress/SkillRadarChart';
import { ActivityCalendar } from '@/components/progress/ActivityCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cefrColor } from '@/lib/utils';

const MISTAKE_LABELS: Record<string, string> = {
  GRAMMAR: 'Ngữ pháp',
  SPELLING: 'Chính tả',
  PUNCTUATION: 'Dấu câu',
  WORD_CHOICE: 'Chọn từ',
  STRUCTURE: 'Cấu trúc câu',
  MISSING_WORD: 'Thiếu từ',
  EXTRA_WORD: 'Thừa từ',
  REDUNDANCY: 'Thừa từ',
  NATURALNESS: 'Tính tự nhiên',
  COLLOCATION: 'Collocation',
  CAPITALIZATION: 'Viết hoa',
  TENSE: 'Thì động từ',
  ARTICLE: 'Mạo từ',
  PREPOSITION: 'Giới từ',
  VERB_FORM: 'Dạng động từ',
  SUBJECT_VERB_AGREEMENT: 'Chủ-vị',
  WORD_ORDER: 'Trật tự từ',
};

const MISTAKE_COLORS: Record<string, string> = {
  GRAMMAR: 'bg-red-100 text-red-700',
  SPELLING: 'bg-orange-100 text-orange-700',
  PUNCTUATION: 'bg-yellow-100 text-yellow-700',
  WORD_CHOICE: 'bg-purple-100 text-purple-700',
  STRUCTURE: 'bg-blue-100 text-blue-700',
  MISSING_WORD: 'bg-pink-100 text-pink-700',
  EXTRA_WORD: 'bg-pink-100 text-pink-700',
  REDUNDANCY: 'bg-pink-100 text-pink-700',
  NATURALNESS: 'bg-teal-100 text-teal-700',
  COLLOCATION: 'bg-indigo-100 text-indigo-700',
  CAPITALIZATION: 'bg-gray-100 text-gray-700',
  TENSE: 'bg-red-100 text-red-700',
  ARTICLE: 'bg-amber-100 text-amber-700',
  PREPOSITION: 'bg-amber-100 text-amber-700',
  VERB_FORM: 'bg-red-100 text-red-700',
  SUBJECT_VERB_AGREEMENT: 'bg-red-100 text-red-700',
  WORD_ORDER: 'bg-blue-100 text-blue-700',
};

function formatMistakeType(type: string): string {
  return MISTAKE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProgressPage() {
  const { data: progress, isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => analyticsApi.getProgress().then((r) => r.data.data!),
  });

  const { data: calendarData = [] } = useQuery({
    queryKey: ['calendar'],
    queryFn: () => analyticsApi.getCalendar(365).then((r) => r.data.data ?? []),
  });

  const { data: mistakes = [] } = useQuery({
    queryKey: ['mistakes'],
    queryFn: () => analyticsApi.getMistakes().then((r) => r.data.data ?? []),
  });

  if (isLoading) {
    return <div className="p-6 text-muted-foreground text-sm">Đang tải...</div>;
  }

  if (!progress) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-muted-foreground text-sm">Chưa có dữ liệu tiến trình. Hãy nộp bài viết đầu tiên!</p>
      </div>
    );
  }

  const totalMistakes = mistakes.reduce((s, m) => s + m.occurrenceCount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Tiến trình học tập</h1>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Streak hiện tại', value: `🔥 ${progress.currentStreak} ngày` },
          { label: 'Streak dài nhất', value: `${progress.longestStreak} ngày` },
          { label: 'Tổng số bài', value: progress.totalEntries },
          { label: 'Tổng số từ', value: progress.totalWordsWritten.toLocaleString('vi-VN') },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity calendar */}
      <Card>
        <CardHeader><CardTitle>Lịch hoạt động</CardTitle></CardHeader>
        <CardContent>
          <ActivityCalendar data={calendarData} />
        </CardContent>
      </Card>

      {/* Skill radar */}
      <Card>
        <CardHeader><CardTitle>Kỹ năng tổng hợp</CardTitle></CardHeader>
        <CardContent>
          <SkillRadarChart progress={progress} />
        </CardContent>
      </Card>

      {/* IELTS + CEFR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Ước tính IELTS Band</p>
            <p className="text-5xl font-bold text-primary">
              {progress.estimatedIeltsBand?.toFixed(1) ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Trình độ CEFR ước tính</p>
            {progress.estimatedCefr ? (
              <span className={`inline-block text-3xl font-bold px-4 py-2 rounded-xl ${cefrColor(progress.estimatedCefr)}`}>
                {progress.estimatedCefr}
              </span>
            ) : (
              <p className="text-3xl font-bold text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recurring mistakes */}
      {mistakes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lỗi thường gặp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">{totalMistakes} lỗi tổng cộng qua {progress.totalEntries} bài</p>
            <div className="space-y-2">
              {mistakes.map((m) => (
                <div key={m.mistakeType} className="flex items-start gap-3">
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${MISTAKE_COLORS[m.mistakeType] ?? 'bg-muted text-muted-foreground'}`}>
                    {formatMistakeType(m.mistakeType)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (m.occurrenceCount / totalMistakes) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{m.occurrenceCount} lần</span>
                    </div>
                    {m.example && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{m.example}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vocab stats */}
      <Card>
        <CardHeader><CardTitle>Từ vựng</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Đã học được</p>
            <p className="text-2xl font-bold mt-1">{progress.vocabularyMastered}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
