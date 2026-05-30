'use client';

import Link from 'next/link';
import { Trash2, BarChart3, FileText, PenLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { WritingStatusBadge } from './WritingStatusBadge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useDeleteWriting } from '@/hooks/useWriting';
import { toast } from '@/hooks/useToast';
import type { WritingEntry } from '@/types/api';

const MODE_ICONS = {
  DAILY_ENGLISH: PenLine,
  IELTS_TASK1: BarChart3,
  IELTS_TASK2: FileText,
};

const MODE_LABELS = {
  DAILY_ENGLISH: 'Daily English',
  IELTS_TASK1: 'IELTS Task 1',
  IELTS_TASK2: 'IELTS Task 2',
};

export function WritingCard({ entry }: { entry: WritingEntry }) {
  const deleteWriting = useDeleteWriting();
  const ModeIcon = MODE_ICONS[entry.mode];

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (entry.status === 'AI_PROCESSING') {
      toast({ variant: 'destructive', description: 'Bài viết đang được AI xử lý, không thể xóa' });
      return;
    }
    deleteWriting.mutate(entry.id, {
      onSuccess: () => toast({ description: 'Đã xóa bài viết' }),
    });
  };

  const isDraft = entry.status === 'DRAFT';
  const href = isDraft ? `/writing/new?draftId=${entry.id}` : `/writing/${entry.id}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <Link href={href}>
        <div className="group border rounded-xl p-4 bg-card hover:shadow-md transition-all hover:border-primary/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ModeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{MODE_LABELS[entry.mode]}</span>
              </div>
              <h3 className="font-medium text-sm truncate">
                {entry.title ?? 'Không có tiêu đề'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {entry.originalText}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteWriting.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between mt-3">
            <WritingStatusBadge status={entry.status} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{entry.wordCount} từ</span>
              <span>{formatDate(entry.createdAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
