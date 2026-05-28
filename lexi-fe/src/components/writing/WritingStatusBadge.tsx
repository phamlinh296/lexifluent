import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WritingStatus } from '@/types/api';

const STATUS_CONFIG: Record<WritingStatus, { label: string; className: string; pulse?: boolean }> = {
  DRAFT: { label: 'Nháp', className: 'bg-gray-100 text-gray-600' },
  SUBMITTED: { label: 'Đã gửi', className: 'bg-blue-100 text-blue-700' },
  AI_PROCESSING: { label: 'AI đang xử lý', className: 'bg-yellow-100 text-yellow-700', pulse: true },
  PROCESSED: { label: 'Hoàn tất', className: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Thất bại', className: 'bg-red-100 text-red-700' },
};

export function WritingStatusBadge({ status }: { status: WritingStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.pulse && <Loader2 className="h-3 w-3 animate-spin" />}
      {config.label}
    </span>
  );
}
