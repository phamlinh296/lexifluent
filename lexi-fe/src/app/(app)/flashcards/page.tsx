'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  useFlashcards,
  useFlashcardStats,
  useReviewFlashcard,
  useDeleteFlashcard,
  useAnalyzeTranslation,
  useCreateFlashcard,
} from '@/hooks/useFlashcards';
import type { Flashcard, TranslationFeedbackSchema } from '@/types/api';
import { cefrColor } from '@/lib/utils';
import { CheckCircle2, Flame, Plus, RotateCcw, Trash2, X, XCircle } from 'lucide-react';

const SESSION_LIMIT = 20;

const QUALITY_LABELS = [
  { q: 0, label: 'Không nhớ', color: 'bg-red-500 hover:bg-red-600' },
  { q: 2, label: 'Khó', color: 'bg-orange-500 hover:bg-orange-600' },
  { q: 3, label: 'Nhớ được', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { q: 5, label: 'Dễ', color: 'bg-green-500 hover:bg-green-600' },
];

const TYPE_LABEL: Record<string, string> = {
  CLOZE: 'Điền chỗ trống',
  COLLOCATION: 'Collocation',
  GRAMMAR_CORRECTION: 'Sửa lỗi',
  TRANSLATION: 'Dịch',
};

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80
      ? 'bg-green-100 text-green-700'
      : value >= 60
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700';
  return (
    <div className={`flex-1 rounded-lg p-3 text-center ${color}`}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}

// ─── Translation study card ───────────────────────────────────────────────────

function TranslationStudyCard({ card, onComplete }: { card: Flashcard; onComplete: () => void }) {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<TranslationFeedbackSchema | null>(null);
  const analyzeMutation = useAnalyzeTranslation();

  function handleAnalyze() {
    if (!input.trim()) return;
    analyzeMutation.mutate(
      { id: card.id, data: { vietnameseSentence: card.front, userAnswer: input.trim() } },
      { onSuccess: (result) => setFeedback(result) },
    );
  }

  return (
    <div className="space-y-4">
      {/* Vietnamese prompt */}
      <div className="rounded-xl border-2 p-8 text-center space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Dịch sang tiếng Anh</p>
        <p className="text-2xl font-bold leading-snug">{card.front}</p>
        {card.cefrLevel && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block ${cefrColor(card.cefrLevel as never)}`}>
            {card.cefrLevel}
          </span>
        )}
      </div>

      {!feedback ? (
        /* Input phase */
        <div className="space-y-3">
          <Textarea
            placeholder="Nhập bản dịch của bạn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={analyzeMutation.isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze();
            }}
          />
          <p className="text-xs text-muted-foreground text-right">Ctrl+Enter để gửi</p>
          <Button
            onClick={handleAnalyze}
            disabled={!input.trim() || analyzeMutation.isPending}
            className="w-full"
          >
            {analyzeMutation.isPending ? 'Đang phân tích...' : 'Phân tích'}
          </Button>
        </div>
      ) : (
        /* Feedback phase */
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Scores */}
          <div className="flex gap-2">
            <ScoreBadge label="Tổng" value={feedback.overallScore} />
            <ScoreBadge label="Ngữ pháp" value={feedback.grammarScore} />
            <ScoreBadge label="Tự nhiên" value={feedback.naturalnessScore} />
          </div>

          {/* Correct / Partially correct badge */}
          <div className="flex items-center gap-2">
            {feedback.isCorrect ? (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Đúng nghĩa
              </span>
            ) : feedback.partiallyCorrect ? (
              <span className="flex items-center gap-1.5 text-sm text-yellow-600 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Đúng một phần
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
                <XCircle className="h-4 w-4" /> Chưa đúng nghĩa
              </span>
            )}
            {feedback.cefrEstimate && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground ml-auto">
                {feedback.cefrEstimate}
              </span>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm leading-relaxed">{feedback.feedbackSummary}</p>
          </div>

          {/* Corrected sentence */}
          {feedback.correctedSentence && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Câu đúng</p>
              <p className="text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                {feedback.correctedSentence}
              </p>
            </div>
          )}

          {/* More natural (only if different) */}
          {feedback.moreNaturalSentence &&
            feedback.moreNaturalSentence !== feedback.correctedSentence && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Tự nhiên hơn</p>
                <p className="text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                  {feedback.moreNaturalSentence}
                </p>
              </div>
            )}

          {/* Mistakes */}
          {feedback.mistakes?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Lỗi cần sửa</p>
              {feedback.mistakes.map((m, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 font-medium">
                      {m.type}
                    </span>
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

          {/* Key learning points */}
          {feedback.keyLearningPoints?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Ghi nhớ</p>
              <ul className="space-y-1">
                {feedback.keyLearningPoints.map((point, i) => (
                  <li key={i} className="text-sm flex items-start gap-1.5">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Good points */}
          {feedback.goodPoints?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Điểm tốt</p>
              <ul className="space-y-1">
                {feedback.goodPoints.map((point, i) => (
                  <li key={i} className="text-sm flex items-start gap-1.5 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={onComplete} className="w-full sticky bottom-0">
            Tiếp tục
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Standard study card ──────────────────────────────────────────────────────

function StudyCard({ card, onReview }: { card: Flashcard; onReview: (q: number) => void }) {
  const [flipped, setFlipped] = useState(false);
  const isCloze = card.type === 'CLOZE';
  const isCollocation = card.type === 'COLLOCATION';

  return (
    <div className="space-y-4">
      <div
        className="min-h-48 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center p-8 text-center gap-3 transition-colors hover:border-primary/40"
        onClick={() => setFlipped((f) => !f)}
      >
        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div key="front" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              {isCloze ? (
                <>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Điền vào chỗ trống</p>
                  <p className="text-lg leading-relaxed font-medium">{card.front}</p>
                </>
              ) : isCollocation ? (
                <>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Hoàn thành collocation</p>
                  <p className="text-2xl font-bold tracking-wide">{card.front}</p>
                </>
              ) : (
                <p className="text-2xl font-bold">{card.front}</p>
              )}
              {card.cefrLevel && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${cefrColor(card.cefrLevel as never)}`}>
                  {card.cefrLevel}
                </span>
              )}
              <p className="text-xs text-muted-foreground mt-4">Nhấn để xem đáp án</p>
            </motion.div>
          ) : (
            <motion.div key="back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {isCloze || isCollocation ? (
                <p className="text-2xl font-bold text-primary">{card.back}</p>
              ) : (
                <p className="text-sm whitespace-pre-wrap text-left">{card.back}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {QUALITY_LABELS.map(({ q, label, color }) => (
            <Button key={q} className={`text-white ${color}`} onClick={() => onReview(q)}>
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Flashcard list item ──────────────────────────────────────────────────────

function FlashcardListItem({ card, onDelete }: { card: Flashcard; onDelete: () => void }) {
  const typeLabel = TYPE_LABEL[card.type];
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="font-medium text-sm">{card.front}</p>
          <p className="text-xs text-muted-foreground truncate max-w-xs">
            {card.type === 'TRANSLATION' ? 'Dịch Việt → Anh' : card.back.split('\n')[0]}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {card.cefrLevel && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cefrColor(card.cefrLevel as never)}`}>
              {card.cefrLevel}
            </span>
          )}
          {typeLabel && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {typeLabel}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right text-xs text-muted-foreground hidden sm:block">
          <p>Ôn lần {card.reviewCount}</p>
          {card.isDue && <p className="text-orange-500 font-medium">Đến hạn ôn</p>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const [mode, setMode] = useState<'list' | 'study'>('list');
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyDeck, setStudyDeck] = useState<Flashcard[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viInput, setViInput] = useState('');

  const { data: allCards = [], isLoading } = useFlashcards(false);
  const { data: dueCards = [] } = useFlashcards(true);
  const { data: stats } = useFlashcardStats();
  const reviewMutation = useReviewFlashcard();
  const deleteMutation = useDeleteFlashcard();
  const createFlashcard = useCreateFlashcard();

  const streak = stats?.flashcardStreak ?? 0;
  const currentCard = studyDeck[studyIndex];

  function startStudy() {
    const deck = [...allCards]
      .sort((a, b) => {
        if (a.isDue && !b.isDue) return -1;
        if (!a.isDue && b.isDue) return 1;
        return 0;
      })
      .slice(0, SESSION_LIMIT);
    setStudyDeck(deck);
    setStudyIndex(0);
    setMode('study');
  }

  function advance() {
    if (studyIndex < studyDeck.length - 1) {
      setStudyIndex((i) => i + 1);
    } else {
      setMode('list');
      setStudyIndex(0);
      setStudyDeck([]);
    }
  }

  // Standard cards: call review API (SM-2) then advance
  function handleReview(quality: number) {
    if (!currentCard) return;
    reviewMutation.mutate({ id: currentCard.id, data: { quality } }, { onSuccess: advance });
  }

  // Translation cards: SM-2 already applied by translate/analyze endpoint — just advance
  function handleTranslationComplete() {
    advance();
  }

  function handleCreateTranslation() {
    if (!viInput.trim()) return;
    createFlashcard.mutate(
      { front: viInput.trim(), back: '', type: 'TRANSLATION' },
      {
        onSuccess: () => {
          setViInput('');
          setShowCreateForm(false);
        },
      },
    );
  }

  if (isLoading) {
    return <div className="text-center py-16 text-muted-foreground text-sm">Đang tải...</div>;
  }

  if (mode === 'study' && currentCard) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Ôn flashcard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {studyIndex + 1} / {studyDeck.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setMode('list'); setStudyIndex(0); setStudyDeck([]); }}
            >
              Thoát
            </Button>
          </div>
        </div>

        {/* key=studyIndex forces remount → resets all local state between cards */}
        {currentCard.type === 'TRANSLATION' ? (
          <TranslationStudyCard
            key={studyIndex}
            card={currentCard}
            onComplete={handleTranslationComplete}
          />
        ) : (
          <StudyCard key={studyIndex} card={currentCard} onReview={handleReview} />
        )}
      </div>
    );
  }

  const sessionSize = Math.min(allCards.length, SESSION_LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Flashcard</h1>
            {streak > 0 && (
              <span className="flex items-center gap-1 text-sm font-medium text-orange-500">
                <Flame className="h-4 w-4" />
                {streak} ngày
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {allCards.length} thẻ
            {dueCards.length > 0 && ` · ${dueCards.length} đến hạn hôm nay`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowCreateForm((v) => !v)}
          >
            {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Thẻ dịch
          </Button>
          {allCards.length > 0 && (
            <Button onClick={startStudy} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Ôn {sessionSize} thẻ
            </Button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">Tạo thẻ dịch mới</p>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Câu tiếng Việt</p>
              <Textarea
                placeholder="VD: Tôi đang cố gắng cải thiện tiếng Anh của mình."
                value={viInput}
                onChange={(e) => setViInput(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={createFlashcard.isPending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCreateTranslation();
                }}
              />
              <p className="text-xs text-muted-foreground text-right">Ctrl+Enter để tạo</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateTranslation}
                disabled={!viInput.trim() || createFlashcard.isPending}
                size="sm"
                className="flex-1"
              >
                {createFlashcard.isPending ? 'Đang tạo...' : 'Tạo thẻ'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowCreateForm(false); setViInput(''); }}
              >
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {allCards.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            <p>Chưa có flashcard nào.</p>
            <p className="mt-1">
              Lưu từ vựng từ tab <strong>Từ vựng</strong> sau khi nhận AI feedback, hoặc tạo thẻ dịch bằng nút bên trên.
            </p>
          </CardContent>
        </Card>
      )}

      {allCards.length > 0 && (
        <div className="space-y-2">
          {allCards.map((card) => (
            <FlashcardListItem
              key={card.id}
              card={card}
              onDelete={() => deleteMutation.mutate(card.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
