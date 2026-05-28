'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenSquare } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useWritingList } from '@/hooks/useWriting';
import { WritingCard } from '@/components/writing/WritingCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WritingMode } from '@/types/api';

const TABS: { label: string; mode?: WritingMode }[] = [
  { label: 'Tất cả' },
  { label: 'Daily English', mode: 'DAILY_ENGLISH' },
  { label: 'IELTS Task 1', mode: 'IELTS_TASK1' },
  { label: 'IELTS Task 2', mode: 'IELTS_TASK2' },
];

export default function WritingListPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const mode = TABS[activeTab]?.mode;

  const { data, isLoading } = useWritingList(mode, page);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bài viết của tôi</h1>
        <Button onClick={() => router.push('/writing/new')}>
          <PenSquare className="h-4 w-4" />
          Viết mới
        </Button>
      </div>

      {/* Tab filter */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg w-fit">
        {TABS.map(({ label }, i) => (
          <button
            key={label}
            onClick={() => { setActiveTab(i); setPage(0); }}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === i ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-xl p-4 bg-card animate-pulse h-28" />
          ))}
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-muted-foreground">Chưa có bài viết nào</p>
          <Button variant="outline" onClick={() => router.push('/writing/new')}>
            Viết bài đầu tiên
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {data.content.map((entry) => (
              <WritingCard key={entry.id} entry={entry} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Trước</Button>
          <span className="text-sm text-muted-foreground py-2">{page + 1} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages - 1} onClick={() => setPage(page + 1)}>Sau</Button>
        </div>
      )}
    </div>
  );
}
