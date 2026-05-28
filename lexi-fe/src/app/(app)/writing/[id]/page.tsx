'use client';

import { use, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useWritingDetail } from '@/hooks/useWriting';
import { useFeedback } from '@/hooks/useFeedback';
import { WritingStatusBadge } from '@/components/writing/WritingStatusBadge';
import { AnalyticsScores } from '@/components/writing/feedback/AnalyticsScores';
import { IeltsScoreCard } from '@/components/writing/feedback/IeltsScoreCard';
import { CorrectionsList } from '@/components/writing/feedback/CorrectionsList';
import { VocabSuggestions } from '@/components/writing/feedback/VocabSuggestions';
import { RewrittenSentences } from '@/components/writing/feedback/RewrittenSentences';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

const AI_PROCESSING_MESSAGES = [
  'AI đang đọc bài viết của bạn...',
  'Đang phân tích ngữ pháp và cấu trúc...',
  'Đang đánh giá từ vựng và phong cách...',
  'Đang tạo feedback chi tiết...',
];

function AiProcessingState() {
  const [msgIndex, setMsgIndex] = useState(0);

  useState(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % AI_PROCESSING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  });

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-3 w-3 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-muted-foreground text-sm"
        >
          {AI_PROCESSING_MESSAGES[msgIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="sm" onClick={handle}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Đã copy' : 'Copy'}
    </Button>
  );
}

export default function WritingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: entry, isLoading } = useWritingDetail(id);
  const { data: feedback } = useFeedback(id, entry?.status);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground text-sm">Đang tải...</div>;
  }

  if (!entry) {
    return <div className="p-6 text-muted-foreground text-sm">Không tìm thấy bài viết</div>;
  }

  const isPending = entry.status === 'SUBMITTED' || entry.status === 'AI_PROCESSING';
  const isFailed = entry.status === 'FAILED';
  const isIelts = entry.mode === 'IELTS_TASK1' || entry.mode === 'IELTS_TASK2';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">{entry.title ?? 'Không có tiêu đề'}</h1>
          <div className="flex items-center gap-3 mt-2">
            <WritingStatusBadge status={entry.status} />
            <span className="text-xs text-muted-foreground">{entry.wordCount} từ</span>
            <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
            {feedback?.confidence != null && (
              <span className="text-xs text-muted-foreground">Độ tin cậy: {Math.round(feedback.confidence * 100)}%</span>
            )}
          </div>
        </div>
      </div>

      {/* Failed state */}
      {isFailed && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-4 text-sm text-destructive mb-6">
          AI xử lý thất bại. Vui lòng thử lại hoặc liên hệ hỗ trợ.
        </div>
      )}

      {/* AI Processing */}
      {isPending && <AiProcessingState />}

      {/* Feedback ready */}
      {feedback && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Original text */}
          <div className="border rounded-xl p-5 bg-card">
            <h2 className="font-medium mb-3 text-sm text-muted-foreground">Bài viết gốc</h2>
            <p className="text-sm leading-7 whitespace-pre-wrap">{entry.originalText}</p>
          </div>

          {/* Right: Feedback tabs */}
          <div className="border rounded-xl p-5 bg-card">
            <Tabs defaultValue="overview">
              <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                {isIelts && <TabsTrigger value="ielts">IELTS Score</TabsTrigger>}
                <TabsTrigger value="corrections">Sửa lỗi ({feedback.corrections?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="corrected">Bài đã sửa</TabsTrigger>
                <TabsTrigger value="rewritten">Viết lại</TabsTrigger>
                <TabsTrigger value="vocab">Từ vựng ({feedback.vocabularySuggestions?.length ?? 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <AnalyticsScores analytics={feedback.analytics} />
              </TabsContent>

              {isIelts && feedback.ieltsScore && (
                <TabsContent value="ielts">
                  <IeltsScoreCard score={feedback.ieltsScore} />
                </TabsContent>
              )}

              <TabsContent value="corrections">
                <CorrectionsList corrections={feedback.corrections} />
              </TabsContent>

              <TabsContent value="corrected">
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <CopyButton text={feedback.correctedText} />
                  </div>
                  <p className="text-sm leading-7 whitespace-pre-wrap">{feedback.correctedText}</p>
                </div>
              </TabsContent>

              <TabsContent value="rewritten">
                <RewrittenSentences sentences={feedback.rewrittenSentences} />
              </TabsContent>

              <TabsContent value="vocab">
                <VocabSuggestions suggestions={feedback.vocabularySuggestions} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
