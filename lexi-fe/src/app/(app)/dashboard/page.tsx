'use client';

import Link from 'next/link';
import { PenSquare, BookOpen, Flame, FileText, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';
import { writingApi } from '@/api/writing';
import { vocabularyApi } from '@/api/vocabulary';
import { useAuthStore } from '@/store/authStore';
import { WritingCard } from '@/components/writing/WritingCard';
import { VocabCard } from '@/components/vocabulary/VocabCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ElementType; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: progress } = useQuery({
    queryKey: ['progress'],
    queryFn: () => analyticsApi.getProgress().then((r) => r.data.data!),
  });

  const { data: recentWriting } = useQuery({
    queryKey: ['writing', 'list', undefined, 0],
    queryFn: () => writingApi.list({ page: 0, size: 5 }).then((r) => r.data.data!),
  });

  const { data: weakVocab } = useQuery({
    queryKey: ['vocabulary', 'weak', 0],
    queryFn: () => vocabularyApi.listWeak({ page: 0, size: 5 }).then((r) => r.data.data!),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">
          Xin chào, {user?.displayName?.split(' ').at(-1) ?? 'bạn'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Tiếp tục hành trình luyện viết của bạn</p>
      </motion.div>

      {/* Stats */}
      {progress && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Streak" value={`🔥 ${progress.currentStreak}`} icon={Flame} sub="ngày liên tiếp" />
          <StatCard label="Bài viết" value={progress.totalEntries} icon={FileText} sub={`${progress.totalWordsWritten.toLocaleString('vi-VN')} từ`} />
          <StatCard label="IELTS Band" value={progress.estimatedIeltsBand?.toFixed(1) ?? '—'} icon={BarChart3} sub={progress.estimatedCefr ?? ''} />
          <StatCard label="Từ vựng" value={progress.vocabularyMastered} icon={BookOpen} sub="đã thành thạo" />
        </div>
      )}

      {/* Recent Writing */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Bài viết gần đây</h2>
          <Link href="/writing" className="text-sm text-primary hover:underline">Xem tất cả</Link>
        </div>
        {recentWriting?.content.length === 0 ? (
          <div className="border rounded-xl p-8 text-center space-y-3 bg-card">
            <p className="text-muted-foreground text-sm">Chưa có bài viết nào</p>
            <Button onClick={() => { window.location.href = '/writing/new'; }}>
              <PenSquare className="h-4 w-4" />
              Viết bài đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentWriting?.content.map((e) => <WritingCard key={e.id} entry={e} />)}
          </div>
        )}
      </div>

      {/* Weak Vocab */}
      {weakVocab && weakVocab.content.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Từ vựng cần ôn</h2>
            <Link href="/vocabulary?tab=weak" className="text-sm text-primary hover:underline">Xem tất cả</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {weakVocab.content.map((v) => <VocabCard key={v.id} item={v} />)}
          </div>
        </div>
      )}
    </div>
  );
}
