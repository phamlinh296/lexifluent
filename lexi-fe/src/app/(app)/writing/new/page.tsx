'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WritingModePicker } from '@/components/writing/WritingModePicker';
import { CorrectionStylePicker } from '@/components/writing/CorrectionStylePicker';
import { EssayTypePicker } from '@/components/writing/EssayTypePicker';
import { Task1TypePicker } from '@/components/writing/Task1TypePicker';
import { TargetBandPicker } from '@/components/writing/TargetBandPicker';
import { WritingEditor } from '@/components/writing/WritingEditor';
import { useSubmitWriting, useSaveDraft, useUpdateDraft, useSubmitDraft, useWritingDetail } from '@/hooks/useWriting';
import { toast } from '@/hooks/useToast';
import { countWords } from '@/lib/utils';
import type { CorrectionStyle, EssayType, Task1Type, TargetBand, WritingMode } from '@/types/api';

const TOPIC_PLACEHOLDERS: Record<WritingMode, string> = {
  DAILY_ENGLISH: 'Chủ đề bạn muốn viết về...',
  IELTS_TASK1: 'Ví dụ: The bar chart shows the number of tourists visiting five countries in 2020.',
  IELTS_TASK2: 'Ví dụ: To what extent do you agree that technology has transformed the way people learn?',
};

const TEXT_PLACEHOLDERS: Record<WritingMode, string> = {
  DAILY_ENGLISH: 'Hôm nay tôi muốn viết về...',
  IELTS_TASK1: 'The chart shows...',
  IELTS_TASK2: 'In recent years...',
};

// Steps vary by mode — IELTS has classification step, Daily goes straight to write
type Step = 'mode' | 'classify' | 'band' | 'style' | 'write';

function getSteps(mode: WritingMode | null): Step[] {
  if (!mode) return ['mode'];
  if (mode === 'DAILY_ENGLISH') return ['mode', 'style', 'write'];
  return ['mode', 'classify', 'band', 'write'];
}

export default function NewWritingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draftId');

  const submit = useSubmitWriting();
  const saveDraft = useSaveDraft();
  const updateDraft = useUpdateDraft();
  const submitDraft = useSubmitDraft();

  const { data: draftEntry } = useWritingDetail(draftId ?? '');

  const [mode, setMode] = useState<WritingMode | null>(null);
  const [correctionStyle, setCorrectionStyle] = useState<CorrectionStyle | null>(null);
  const [essayType, setEssayType] = useState<EssayType | null>(null);
  const [task1Type, setTask1Type] = useState<Task1Type | null>(null);
  const [targetBand, setTargetBand] = useState<TargetBand | null>(null);
  const [title, setTitle] = useState('');
  const [topicPrompt, setTopicPrompt] = useState('');
  const [text, setText] = useState('');
  const [stepIndex, setStepIndex] = useState(0);

  // Pre-fill form when continuing a draft
  useEffect(() => {
    if (!draftEntry || draftEntry.status !== 'DRAFT') return;
    setMode(draftEntry.mode);
    setCorrectionStyle(draftEntry.correctionStyle);
    if (draftEntry.essayType) setEssayType(draftEntry.essayType);
    if (draftEntry.task1Type) setTask1Type(draftEntry.task1Type);
    if (draftEntry.targetBand) setTargetBand(draftEntry.targetBand);
    setTitle(draftEntry.title ?? '');
    setTopicPrompt(draftEntry.topicPrompt ?? '');
    setText(draftEntry.originalText ?? '');
    // Jump straight to write step
    const steps = getSteps(draftEntry.mode);
    setStepIndex(steps.length - 1);
  }, [draftEntry]);

  const steps = useMemo(() => getSteps(mode), [mode]);
  const currentStep = steps[stepIndex] as Step | undefined;

  const canNext = useMemo(() => {
    switch (currentStep) {
      case 'mode':     return mode !== null;
      case 'classify': return mode === 'IELTS_TASK2' ? essayType !== null : task1Type !== null;
      case 'band':     return targetBand !== null;
      case 'style':    return correctionStyle !== null;
      case 'write':    return countWords(text) >= 20 && countWords(text) <= 5000;
      default:         return false;
    }
  }, [currentStep, mode, essayType, task1Type, targetBand, correctionStyle, text]);

  const handleModeChange = (m: WritingMode) => {
    setMode(m);
    // reset classification when mode changes
    setEssayType(null);
    setTask1Type(null);
    setTargetBand(null);
    setCorrectionStyle(null);
  };

  const draftPayload = {
    mode: mode!,
    text: text || undefined,
    title: title || undefined,
    topicPrompt: topicPrompt || undefined,
    ...(mode !== 'DAILY_ENGLISH'
      ? { essayType: essayType ?? undefined, task1Type: task1Type ?? undefined, targetBand: targetBand ?? undefined }
      : { correctionStyle: correctionStyle ?? undefined }),
  };

  const handleSaveDraft = () => {
    if (draftId) {
      updateDraft.mutate(
        { id: draftId, data: draftPayload },
        {
          onSuccess: () => toast({ description: 'Đã cập nhật bản nháp' }),
          onError: () => toast({ variant: 'destructive', description: 'Lưu nháp thất bại' }),
        },
      );
    } else {
      saveDraft.mutate(draftPayload, {
        onSuccess: (entry) => {
          toast({ description: 'Đã lưu bản nháp' });
          router.replace(`/writing/new?draftId=${entry.id}`, { scroll: false });
        },
        onError: () => toast({ variant: 'destructive', description: 'Lưu nháp thất bại' }),
      });
    }
  };

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    // Submit draft if continuing from one, otherwise fresh submit
    if (draftId) {
      submitDraft.mutate(draftId, {
        onSuccess: (entry) => {
          toast({ description: 'Bài viết đã được gửi! AI đang xử lý...' });
          router.push(`/writing/${entry.id}`);
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message;
          toast({ variant: 'destructive', description: msg ?? 'Có lỗi khi gửi bài, vui lòng thử lại' });
        },
      });
    } else {
      submit.mutate(
        {
          mode: mode!,
          text,
          title: title || undefined,
          topicPrompt: topicPrompt || undefined,
          ...(mode !== 'DAILY_ENGLISH'
            ? { essayType: essayType ?? undefined, task1Type: task1Type ?? undefined, targetBand: targetBand ?? undefined }
            : { correctionStyle: correctionStyle! }),
        },
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
    }
  };

  const STEP_TITLES: Record<Step, string> = {
    mode:     'Bạn muốn luyện viết gì?',
    classify: mode === 'IELTS_TASK2' ? 'Dạng bài của bạn là gì?' : 'Loại biểu đồ / sơ đồ?',
    band:     'Mục tiêu band điểm?',
    style:    'AI sẽ giúp bạn theo cách nào?',
    write:    'Viết bài của bạn',
  };

  const isLastStep = stepIndex === steps.length - 1;
  const stepLabels = steps.map((s) => ({
    mode: 'Loại bài',
    classify: mode === 'IELTS_TASK2' ? 'Dạng essay' : 'Loại biểu đồ',
    band: 'Target band',
    style: 'Cách sửa',
    write: 'Viết bài',
  }[s]));

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors
              ${i <= stepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i === stepIndex ? 'font-medium' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`h-px w-6 ${i < stepIndex ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-xl font-semibold">{currentStep ? STEP_TITLES[currentStep] : ''}</h1>

          {currentStep === 'mode' && (
            <WritingModePicker value={mode} onChange={handleModeChange} />
          )}

          {currentStep === 'classify' && mode === 'IELTS_TASK2' && (
            <EssayTypePicker value={essayType} onChange={setEssayType} />
          )}

          {currentStep === 'classify' && mode === 'IELTS_TASK1' && (
            <Task1TypePicker value={task1Type} onChange={setTask1Type} />
          )}

          {currentStep === 'band' && (
            <TargetBandPicker value={targetBand} onChange={setTargetBand} />
          )}

          {currentStep === 'style' && mode && (
            <CorrectionStylePicker mode={mode} value={correctionStyle} onChange={setCorrectionStyle} />
          )}

          {currentStep === 'write' && mode && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề (tuỳ chọn)</Label>
                <Input id="title" placeholder="Tiêu đề bài viết..." value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topicPrompt">
                  Đề bài {mode !== 'DAILY_ENGLISH' && <span className="text-muted-foreground">(nên nhập để AI feedback chính xác hơn)</span>}
                </Label>
                <Input
                  id="topicPrompt"
                  placeholder={TOPIC_PLACEHOLDERS[mode]}
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Bài viết <span className="text-destructive ml-0.5">*</span>{' '}
                  <span className="text-muted-foreground text-xs">
                    ({countWords(text)}/5000 từ)
                  </span>
                </Label>
                <WritingEditor value={text} onChange={setText} placeholder={TEXT_PLACEHOLDERS[mode]} />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setStepIndex(stepIndex - 1)}
          disabled={stepIndex === 0}
        >
          <ChevronLeft /> Quay lại
        </Button>
        <div className="flex items-center gap-2">
          {isLastStep && (
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={!mode || saveDraft.isPending || updateDraft.isPending}
            >
              {(saveDraft.isPending || updateDraft.isPending)
                ? <Loader2 className="animate-spin h-4 w-4 mr-1" />
                : <Save className="h-4 w-4 mr-1" />}
              {draftId ? 'Cập nhật nháp' : 'Lưu nháp'}
            </Button>
          )}
          <Button onClick={handleNext} disabled={!canNext || submit.isPending || submitDraft.isPending}>
            {(submit.isPending || submitDraft.isPending) && <Loader2 className="animate-spin mr-2" />}
            {isLastStep ? 'Gửi bài' : 'Tiếp theo'}
            {!isLastStep && <ChevronRight />}
          </Button>
        </div>
      </div>
    </div>
  );
}
