'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAnalyzeTranslationStandalone } from '@/hooks/useFlashcards';
import type { TranslationFeedbackSchema } from '@/types/api';
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Save, Trash2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── localStorage ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'lexi_translate_history';
const MAX_ENTRIES = 100;

type HistoryEntry = {
  id: string;
  createdAt: string;
  vi: string;
  en: string;
  feedback: TranslationFeedbackSchema;
};

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

function persistHistory(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Shared feedback detail ───────────────────────────────────────────────────

function FeedbackDetail({ vi, en, feedback }: { vi: string; en: string; feedback: TranslationFeedbackSchema }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Câu tiếng Việt</p>
            <p className="text-sm">{vi}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Bản dịch của bạn</p>
            <p className="text-sm font-medium">{en}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <ScoreBadge label="Tổng" value={feedback.overallScore} />
        <ScoreBadge label="Chính xác" value={feedback.accuracyScore ?? feedback.overallScore} />
        <ScoreBadge label="Ngữ pháp" value={feedback.grammarScore} />
        <ScoreBadge label="Tự nhiên" value={feedback.naturalnessScore} />
      </div>

      <div className="flex items-center gap-2">
        {feedback.isCorrect ? (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium"><CheckCircle2 className="h-4 w-4" /> Đúng nghĩa</span>
        ) : feedback.partiallyCorrect ? (
          <span className="flex items-center gap-1.5 text-sm text-yellow-600 font-medium"><CheckCircle2 className="h-4 w-4" /> Đúng một phần</span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium"><XCircle className="h-4 w-4" /> Chưa đúng nghĩa</span>
        )}
        {feedback.cefrEstimate && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground ml-auto">{feedback.cefrEstimate}</span>
        )}
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm leading-relaxed">{feedback.feedbackSummary}</p>
      </div>

      {feedback.correctedSentence && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Câu đúng</p>
          <p className="text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg p-3">{feedback.correctedSentence}</p>
        </div>
      )}

      {feedback.moreNaturalSentence && feedback.moreNaturalSentence !== feedback.correctedSentence && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Tự nhiên hơn</p>
          <p className="text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">{feedback.moreNaturalSentence}</p>
        </div>
      )}

      {feedback.mistakes?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Lỗi cần sửa</p>
          {feedback.mistakes.map((m, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 font-medium">{m.type}</span>
                <span className="text-sm">
                  <span className="line-through text-muted-foreground">{m.original}</span>
                  {' → '}
                  <span className="font-medium text-green-700 dark:text-green-400">{m.correction}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{m.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {feedback.goodPoints?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Điểm tốt</p>
          <ul className="space-y-1">
            {feedback.goodPoints.map((pt, i) => (
              <li key={i} className="text-sm flex items-start gap-1.5 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.keyLearningPoints?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Ghi nhớ</p>
          <ul className="space-y-1">
            {feedback.keyLearningPoints.map((pt, i) => (
              <li key={i} className="text-sm flex items-start gap-1.5">
                <span className="text-primary mt-0.5 shrink-0">•</span><span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-green-100 text-green-700' : value >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return (
    <div className={`flex-1 rounded-lg p-3 text-center ${color}`}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}

// ─── History item ─────────────────────────────────────────────────────────────

function HistoryItem({ entry, onDelete }: { entry: HistoryEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const score = entry.feedback.overallScore;
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-500';

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{entry.vi}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.en}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('text-sm font-bold', scoreColor)}>{score}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />{formatDate(entry.createdAt)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t p-4 bg-muted/20 space-y-4">
          <FeedbackDetail vi={entry.vi} en={entry.en} feedback={entry.feedback} />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TranslatePage() {
  const [viInput, setViInput] = useState('');
  const [enInput, setEnInput] = useState('');
  const [submittedVi, setSubmittedVi] = useState('');
  const [submittedEn, setSubmittedEn] = useState('');
  const [feedback, setFeedback] = useState<TranslationFeedbackSchema | null>(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const analyzeMutation = useAnalyzeTranslationStandalone();

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function handleAnalyze() {
    if (!viInput.trim() || !enInput.trim()) return;
    const vi = viInput.trim();
    const en = enInput.trim();
    setSubmittedVi(vi);
    setSubmittedEn(en);
    setSaved(false);
    analyzeMutation.mutate(
      { vietnameseSentence: vi, userAnswer: en },
      { onSuccess: (result) => setFeedback(result) },
    );
  }

  function handleSave() {
    if (!feedback) return;
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      vi: submittedVi,
      en: submittedEn,
      feedback,
    };
    const updated = [entry, ...history].slice(0, MAX_ENTRIES);
    persistHistory(updated);
    setHistory(updated);
    setSaved(true);
  }

  function handleDelete(id: string) {
    const updated = history.filter((e) => e.id !== id);
    persistHistory(updated);
    setHistory(updated);
  }

  function handleReset() {
    setFeedback(null);
    setViInput('');
    setEnInput('');
    setSubmittedVi('');
    setSubmittedEn('');
    setSaved(false);
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dịch câu</h1>
        <p className="text-muted-foreground text-sm mt-1">Nhập câu tiếng Việt và bản dịch của bạn để nhận phân tích AI</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {!feedback ? (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Câu tiếng Việt</p>
                <Textarea
                  placeholder="VD: Tôi đang cố gắng tìm việc tốt ở công ty nước ngoài."
                  value={viInput}
                  onChange={(e) => setViInput(e.target.value)}
                  className="min-h-[80px] resize-none"
                  disabled={analyzeMutation.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Bản dịch của bạn (tiếng Anh)</p>
                <Textarea
                  placeholder="VD: I am trying to find a good job at a foreign company."
                  value={enInput}
                  onChange={(e) => setEnInput(e.target.value)}
                  className="min-h-[80px] resize-none"
                  disabled={analyzeMutation.isPending}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze(); }}
                />
                <p className="text-xs text-muted-foreground text-right">Ctrl+Enter để phân tích</p>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={!viInput.trim() || !enInput.trim() || analyzeMutation.isPending}
                className="w-full"
              >
                {analyzeMutation.isPending ? 'Đang phân tích...' : 'Phân tích'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <FeedbackDetail vi={submittedVi} en={submittedEn} feedback={feedback} />

            <div className="flex gap-2">
              <Button
                variant={saved ? 'outline' : 'default'}
                className="flex-1 gap-2"
                onClick={handleSave}
                disabled={saved}
              >
                <Save className="h-4 w-4" />
                {saved ? 'Đã lưu' : 'Lưu'}
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Dịch câu khác
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lịch sử */}
      {history.length > 0 && (
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Lịch sử ({history.length})</p>
            <button
              onClick={() => {
                if (window.confirm('Xóa toàn bộ lịch sử dịch câu? Không thể hoàn tác.')) {
                  persistHistory([]); setHistory([]);
                }
              }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
          <div className="space-y-2">
            {history.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} onDelete={() => handleDelete(entry.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
