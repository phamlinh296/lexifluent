'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUpdateProfile } from '@/hooks/useMe';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CefrLevel } from '@/types/api';

const levels: { level: CefrLevel; label: string; desc: string; color: string }[] = [
  { level: 'A1', label: 'A1 — Sơ cấp', desc: 'Mới bắt đầu học tiếng Anh', color: 'border-blue-200 hover:border-blue-400' },
  { level: 'A2', label: 'A2 — Cơ bản', desc: 'Hiểu câu đơn giản, giao tiếp cơ bản', color: 'border-blue-200 hover:border-blue-400' },
  { level: 'B1', label: 'B1 — Trung cấp', desc: 'Giao tiếp tốt trong tình huống quen thuộc', color: 'border-green-200 hover:border-green-400' },
  { level: 'B2', label: 'B2 — Trên trung cấp', desc: 'Hiểu các chủ đề phức tạp, viết rõ ràng', color: 'border-green-200 hover:border-green-400' },
  { level: 'C1', label: 'C1 — Nâng cao', desc: 'Biểu đạt linh hoạt, hiệu quả', color: 'border-purple-200 hover:border-purple-400' },
  { level: 'C2', label: 'C2 — Thành thạo', desc: 'Gần như native speaker', color: 'border-purple-200 hover:border-purple-400' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<CefrLevel | null>(null);
  const update = useUpdateProfile();

  const handleConfirm = () => {
    if (!selected) return;
    update.mutate(
      { cefrLevel: selected },
      { onSuccess: () => router.replace('/dashboard') },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold">Trình độ tiếng Anh của bạn là gì?</h1>
          <p className="text-muted-foreground mt-2">
            AI sẽ điều chỉnh feedback phù hợp với level của bạn
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {levels.map(({ level, label, desc, color }, i) => (
            <motion.button
              key={level}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(level)}
              className={cn(
                'text-left p-4 rounded-xl border-2 transition-all bg-card',
                color,
                selected === level && 'ring-2 ring-primary border-primary',
              )}
            >
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </motion.button>
          ))}
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!selected || update.isPending}
          onClick={handleConfirm}
        >
          {update.isPending ? 'Đang lưu...' : 'Bắt đầu luyện viết'}
        </Button>
      </div>
    </div>
  );
}
