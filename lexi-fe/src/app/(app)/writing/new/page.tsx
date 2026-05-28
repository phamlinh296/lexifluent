'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WritingModePicker } from '@/components/writing/WritingModePicker';
import { CorrectionStylePicker } from '@/components/writing/CorrectionStylePicker';
import { WritingEditor } from '@/components/writing/WritingEditor';
import { useSubmitWriting } from '@/hooks/useWriting';
import { toast } from '@/hooks/useToast';
import { countWords } from '@/lib/utils';
import type { CorrectionStyle, WritingMode } from '@/types/api';

const STEPS = ['Chọn loại bài', 'Chọn cách sửa', 'Viết bài'];

const PLACEHOLDERS: Record<WritingMode, string> = {
  DAILY_ENGLISH: 'Hôm nay tôi muốn viết về...',
  IELTS_TASK1: 'The chart shows the percentage of...',
  IELTS_TASK2: 'In recent years, there has been a growing debate about...',
};

export default function NewWritingPage() {
  const router = useRouter();
  const submit = useSubmitWriting();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<WritingMode | null>(null);
  const [correctionStyle, setCorrectionStyle] = useState<CorrectionStyle | null>(null);
  const [title, setTitle] = useState('');
  const [topicPrompt, setTopicPrompt] = useState('');
  const [text, setText] = useState('');

  const canNext =
    (step === 0 && mode !== null) ||
    (step === 1 && correctionStyle !== null) ||
    (step === 2 && countWords(text) >= 20 && countWords(text) <= 5000);

  const handleNext = () => {
    if (step < 2) { setStep(step + 1); return; }
    submit.mutate(
      { mode: mode!, correctionStyle: correctionStyle!, text, title: title || undefined, topicPrompt: topicPrompt || undefined },
      {
        onSuccess: (entry) => {
          toast({ description: 'Bài viết đã được gửi! AI đang xử lý...' });
          router.push(`/writing/${entry.id}`);
        },
        onError: () => {
          toast({ variant: 'destructive', description: 'Có lỗi khi gửi bài, vui lòng thử lại' });
        },
      },
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i === step ? 'font-medium' : 'text-muted-foreground'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && (
            <div className="space-y-4">
              <h1 className="text-xl font-semibold">Bạn muốn luyện viết gì?</h1>
              <WritingModePicker value={mode} onChange={(m) => { setMode(m); setCorrectionStyle(null); }} />
            </div>
          )}

          {step === 1 && mode && (
            <div className="space-y-4">
              <h1 className="text-xl font-semibold">AI sẽ giúp bạn theo cách nào?</h1>
              <CorrectionStylePicker mode={mode} value={correctionStyle} onChange={setCorrectionStyle} />
            </div>
          )}

          {step === 2 && mode && (
            <div className="space-y-5">
              <h1 className="text-xl font-semibold">Viết bài của bạn</h1>
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề (tuỳ chọn)</Label>
                <Input id="title" placeholder="Tiêu đề bài viết..." value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topicPrompt">Đề bài / Chủ đề (tuỳ chọn)</Label>
                <Input id="topicPrompt" placeholder="Đề bài hoặc chủ đề bạn đang viết về..." value={topicPrompt} onChange={(e) => setTopicPrompt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bài viết</Label>
                <WritingEditor value={text} onChange={setText} placeholder={PLACEHOLDERS[mode]} />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
          <ChevronLeft /> Quay lại
        </Button>
        <Button onClick={handleNext} disabled={!canNext || submit.isPending}>
          {submit.isPending ? <Loader2 className="animate-spin" /> : null}
          {step === 2 ? 'Gửi bài' : 'Tiếp theo'}
          {step < 2 && <ChevronRight />}
        </Button>
      </div>
    </div>
  );
}
