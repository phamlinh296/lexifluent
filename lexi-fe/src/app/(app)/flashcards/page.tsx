'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFlashcards, useFlashcardStats, useReviewFlashcard, useDeleteFlashcard } from '@/hooks/useFlashcards';
import type { Flashcard } from '@/types/api';
import { cefrColor } from '@/lib/utils';
import { Flame, RotateCcw, Trash2 } from 'lucide-react';

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
};

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

function FlashcardListItem({ card, onDelete }: { card: Flashcard; onDelete: () => void }) {
  const typeLabel = TYPE_LABEL[card.type];
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="font-medium text-sm">{card.front}</p>
          <p className="text-xs text-muted-foreground truncate max-w-xs">{card.back.split('\n')[0]}</p>
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
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const [mode, setMode] = useState<'list' | 'study'>('list');
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyDeck, setStudyDeck] = useState<Flashcard[]>([]);

  const { data: allCards = [], isLoading } = useFlashcards(false);
  const { data: dueCards = [] } = useFlashcards(true);
  const { data: stats } = useFlashcardStats();
  const reviewMutation = useReviewFlashcard();
  const deleteMutation = useDeleteFlashcard();

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

  function handleReview(quality: number) {
    if (!currentCard) return;
    reviewMutation.mutate({ id: currentCard.id, data: { quality } }, {
      onSuccess: () => {
        if (studyIndex < studyDeck.length - 1) {
          setStudyIndex((i) => i + 1);
        } else {
          setMode('list');
          setStudyIndex(0);
          setStudyDeck([]);
        }
      },
    });
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
            <span className="text-sm text-muted-foreground">{studyIndex + 1} / {studyDeck.length}</span>
            <Button variant="outline" size="sm" onClick={() => { setMode('list'); setStudyIndex(0); setStudyDeck([]); }}>
              Thoát
            </Button>
          </div>
        </div>
        {/* key=studyIndex forces remount → resets flipped state between cards */}
        <StudyCard key={studyIndex} card={currentCard} onReview={handleReview} />
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
            {allCards.length} thẻ{dueCards.length > 0 && ` · ${dueCards.length} đến hạn hôm nay`}
          </p>
        </div>
        {allCards.length > 0 && (
          <Button onClick={startStudy} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Ôn {sessionSize} thẻ
          </Button>
        )}
      </div>

      {allCards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            <p>Chưa có flashcard nào.</p>
            <p className="mt-1">Lưu từ vựng từ tab <strong>Từ vựng</strong> sau khi nhận AI feedback.</p>
          </CardContent>
        </Card>
      ) : (
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
