'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useFlashcards, useFlashcardStats, useReviewFlashcard,
  useDeleteFlashcard, useAnalyzeTranslation, useCreateFlashcard,
  useFavoriteFlashcards, useToggleFavorite,
  useImportFlashcards, useExportFlashcards,
} from '@/hooks/useFlashcards';
import {
  useFlashcardGroups, useGroupCards, useCreateGroup,
  useDeleteGroup, useAddCardToGroup, useRemoveCardFromGroup,
} from '@/hooks/useFlashcardGroups';
import { flashcardsApi } from '@/api/flashcards';
import type { Flashcard, FlashcardGroup, ImportResult, TranslationFeedbackSchema } from '@/types/api';
import { cefrColor, cn } from '@/lib/utils';
import {
  AlertCircle, CheckCircle2, ChevronDown, Download, FileDown, FileSpreadsheet,
  FileText, Flame, Folder, FolderPlus, Heart, Plus,
  RotateCcw, Trash2, Upload, X, XCircle,
} from 'lucide-react';

const SESSION_LIMIT = 20;

const QUALITY_LABELS = [
  { q: 0, label: 'Không nhớ', color: 'bg-red-500 hover:bg-red-600' },
  { q: 2, label: 'Khó', color: 'bg-orange-500 hover:bg-orange-600' },
  { q: 3, label: 'Nhớ được', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { q: 5, label: 'Dễ', color: 'bg-green-500 hover:bg-green-600' },
];

const TYPE_LABEL: Record<string, string> = {
  CLOZE: 'Điền chỗ trống', COLLOCATION: 'Collocation',
  GRAMMAR_CORRECTION: 'Sửa lỗi', TRANSLATION: 'Dịch',
};

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
        <div className="space-y-3">
          <Textarea placeholder="Nhập bản dịch của bạn..." value={input} onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px] resize-none" disabled={analyzeMutation.isPending}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze(); }} />
          <p className="text-xs text-muted-foreground text-right">Ctrl+Enter để gửi</p>
          <Button onClick={handleAnalyze} disabled={!input.trim() || analyzeMutation.isPending} className="w-full">
            {analyzeMutation.isPending ? 'Đang phân tích...' : 'Phân tích'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex gap-2">
            <ScoreBadge label="Tổng" value={feedback.overallScore} />
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
          <div className="rounded-lg bg-muted/50 p-4"><p className="text-sm leading-relaxed">{feedback.feedbackSummary}</p></div>
          {feedback.correctedSentence && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Câu đúng</p>
              <p className="text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg p-3">{feedback.correctedSentence}</p>
            </div>
          )}
          {feedback.moreNaturalSentence && feedback.moreNaturalSentence !== feedback.correctedSentence && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Tự nhiên hơn</p>
              <p className="text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">{feedback.moreNaturalSentence}</p>
            </div>
          )}
          {feedback.mistakes?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Lỗi cần sửa</p>
              {feedback.mistakes.map((m, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 font-medium">{m.type}</span>
                    <span className="text-sm"><span className="line-through text-muted-foreground">{m.original}</span>{' → '}<span className="font-medium text-green-700 dark:text-green-400">{m.correction}</span></span>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.explanation}</p>
                </div>
              ))}
            </div>
          )}
          {feedback.keyLearningPoints?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Ghi nhớ</p>
              <ul className="space-y-1">{feedback.keyLearningPoints.map((pt, i) => (
                <li key={i} className="text-sm flex items-start gap-1.5"><span className="text-primary mt-0.5 shrink-0">•</span><span>{pt}</span></li>
              ))}</ul>
            </div>
          )}
          {feedback.goodPoints?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Điểm tốt</p>
              <ul className="space-y-1">{feedback.goodPoints.map((pt, i) => (
                <li key={i} className="text-sm flex items-start gap-1.5 text-green-700 dark:text-green-400"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>{pt}</span></li>
              ))}</ul>
            </div>
          )}
          <Button onClick={onComplete} className="w-full sticky bottom-0">Tiếp tục</Button>
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
      <div className="min-h-48 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center p-8 text-center gap-3 transition-colors hover:border-primary/40"
        onClick={() => setFlipped((f) => !f)}>
        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div key="front" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              {isCloze ? (<><p className="text-xs text-muted-foreground uppercase tracking-wide">Điền vào chỗ trống</p><p className="text-lg leading-relaxed font-medium">{card.front}</p></>)
                : isCollocation ? (<><p className="text-xs text-muted-foreground uppercase tracking-wide">Hoàn thành collocation</p><p className="text-2xl font-bold tracking-wide">{card.front}</p></>)
                : <p className="text-2xl font-bold">{card.front}</p>}
              {card.cefrLevel && <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${cefrColor(card.cefrLevel as never)}`}>{card.cefrLevel}</span>}
              <p className="text-xs text-muted-foreground mt-4">Nhấn để xem đáp án</p>
            </motion.div>
          ) : (
            <motion.div key="back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {isCloze || isCollocation ? <p className="text-2xl font-bold text-primary">{card.back}</p>
                : <p className="text-sm whitespace-pre-wrap text-left">{card.back}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {QUALITY_LABELS.map(({ q, label, color }) => (
            <Button key={q} className={`text-white ${color}`} onClick={() => onReview(q)}>{label}</Button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Flashcard list item ──────────────────────────────────────────────────────

function FlashcardListItem({
  card, groups, onDelete, onToggleFavorite, onAddToGroup,
}: {
  card: Flashcard;
  groups: FlashcardGroup[];
  onDelete: () => void;
  onToggleFavorite: () => void;
  onAddToGroup: (groupId: string) => void;
}) {
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const typeLabel = TYPE_LABEL[card.type];

  return (
    <div className="border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="font-medium text-sm">{card.front}</p>
            <p className="text-xs text-muted-foreground truncate max-w-xs">
              {card.type === 'TRANSLATION' ? 'Dịch Việt → Anh' : card.back.split('\n')[0]}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {card.cefrLevel && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cefrColor(card.cefrLevel as never)}`}>{card.cefrLevel}</span>
            )}
            {typeLabel && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{typeLabel}</span>}
            {card.groupIds?.length > 0 && (
              <span className="text-xs flex items-center gap-0.5 text-muted-foreground">
                <Folder className="h-3 w-3" />{card.groupIds.length}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-right text-xs text-muted-foreground hidden sm:block mr-1">
            <p>Ôn lần {card.reviewCount}</p>
            {card.isDue && <p className="text-orange-500 font-medium">Đến hạn ôn</p>}
          </div>
          {/* Add to group */}
          {groups.length > 0 && (
            <div className="relative">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" title="Thêm vào nhóm"
                onClick={() => setShowGroupPicker((v) => !v)}>
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
              {showGroupPicker && (
                <div className="absolute right-0 top-8 z-10 w-44 bg-popover border rounded-lg shadow-lg py-1">
                  {groups.map((g) => {
                    const inGroup = card.groupIds?.includes(g.id);
                    return (
                      <button key={g.id} onClick={() => { onAddToGroup(g.id); setShowGroupPicker(false); }}
                        className={cn('w-full text-left text-sm px-3 py-1.5 hover:bg-accent flex items-center gap-2',
                          inGroup && 'text-muted-foreground')}>
                        <Folder className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{g.name}</span>
                        {inGroup && <span className="ml-auto text-xs">(đã có)</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* Favorite */}
          <Button variant="ghost" size="sm" className={cn('h-7 w-7 p-0 transition-colors', card.isFavorite ? 'text-red-500' : 'text-muted-foreground')}
            onClick={onToggleFavorite} title={card.isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}>
            <Heart className={cn('h-3.5 w-3.5', card.isFavorite && 'fill-current')} />
          </Button>
          {/* Delete */}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Groups panel ─────────────────────────────────────────────────────────────

function GroupsPanel({ allCards }: { allCards: Flashcard[] }) {
  const [selectedGroup, setSelectedGroup] = useState<FlashcardGroup | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const { data: groups = [], isLoading } = useFlashcardGroups();
  const { data: groupCards = [] } = useGroupCards(selectedGroup?.id ?? null);
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const removeCard = useRemoveCardFromGroup();
  const addCard = useAddCardToGroup();
  const [showAddCards, setShowAddCards] = useState(false);

  function handleCreate() {
    if (!groupName.trim()) return;
    createGroup.mutate(groupName.trim(), { onSuccess: () => { setGroupName(''); setShowCreate(false); } });
  }

  const cardsNotInGroup = allCards.filter((c) => !c.groupIds?.includes(selectedGroup?.id ?? ''));

  if (selectedGroup) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { setSelectedGroup(null); setShowAddCards(false); }} className="text-sm text-muted-foreground hover:text-foreground">← Nhóm</button>
          <h2 className="font-semibold flex items-center gap-2"><Folder className="h-4 w-4" />{selectedGroup.name}</h2>
          <span className="text-xs text-muted-foreground">{groupCards.length} thẻ</span>
          <button onClick={() => { deleteGroup.mutate(selectedGroup.id); setSelectedGroup(null); }}
            className="ml-auto text-xs text-destructive hover:underline">Xóa nhóm</button>
        </div>

        <Button size="sm" variant="outline" className="mb-3 gap-1.5" onClick={() => setShowAddCards((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />{showAddCards ? 'Ẩn' : 'Thêm thẻ vào nhóm'}
        </Button>

        {showAddCards && cardsNotInGroup.length > 0 && (
          <div className="mb-4 border rounded-lg divide-y max-h-56 overflow-y-auto">
            {cardsNotInGroup.map((c) => (
              <button key={c.id} onClick={() => addCard.mutate({ groupId: selectedGroup.id, cardId: c.id })}
                className="w-full text-left text-sm px-3 py-2 hover:bg-accent flex items-center justify-between">
                <span className="truncate max-w-xs">{c.front}</span>
                <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
              </button>
            ))}
          </div>
        )}
        {showAddCards && cardsNotInGroup.length === 0 && (
          <p className="text-xs text-muted-foreground mb-3">Tất cả thẻ đã có trong nhóm này.</p>
        )}

        {groupCards.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Nhóm chưa có thẻ nào.</div>
        ) : (
          <div className="space-y-2">
            {groupCards.map((card) => (
              <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{card.front}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{card.back.split('\n')[0]}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground shrink-0"
                  onClick={() => removeCard.mutate({ groupId: selectedGroup.id, cardId: card.id })} title="Xóa khỏi nhóm">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{groups.length} nhóm</p>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? <X className="h-3.5 w-3.5" /> : <FolderPlus className="h-3.5 w-3.5" />}
          Tạo nhóm
        </Button>
      </div>

      {showCreate && (
        <div className="mb-4 flex gap-2">
          <Input placeholder="Tên nhóm..." value={groupName} onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            disabled={createGroup.isPending} className="flex-1" autoFocus />
          <Button size="sm" onClick={handleCreate} disabled={!groupName.trim() || createGroup.isPending}>
            {createGroup.isPending ? '...' : 'Tạo'}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 border rounded-lg animate-pulse" />)}</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Folder className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Chưa có nhóm nào. Tạo nhóm để tổ chức flashcard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {groups.map((g) => (
            <button key={g.id} onClick={() => setSelectedGroup(g)}
              className="flex items-start gap-3 p-4 border rounded-xl bg-card hover:border-primary/50 hover:bg-accent/40 transition-colors text-left">
              <Folder className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium text-sm">{g.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {allCards.filter((c) => c.groupIds?.includes(g.id)).length} thẻ
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Import modal ─────────────────────────────────────────────────────────────

function ImportModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportFlashcards();

  function handleFile(f: File) { setFile(f); setResult(null); }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleTemplateDownload() {
    try {
      const res = await flashcardsApi.downloadTemplate();
      const blob = res.data as unknown as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'flashcards_template.csv';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { /* silent */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-md border">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-base">Import Flashcard</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3 text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{result.imported}</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Đã nhập</p>
              </div>
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/30 p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{result.skipped}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">Bỏ qua</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-center">
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{result.failed}</p>
                <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Lỗi</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Chi tiết lỗi</p>
                <div className="rounded-lg border divide-y max-h-40 overflow-y-auto text-sm">
                  {result.errors.map((e, i) => (
                    <div key={i} className="px-3 py-2 flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground shrink-0">Dòng {e.row}:</span>
                      <span>{e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); }} className="flex-1">
                Import thêm
              </Button>
              <Button onClick={onClose} className="flex-1">Đóng</Button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <button onClick={handleTemplateDownload}
              className="w-full flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-lg border border-dashed hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <FileDown className="h-4 w-4 shrink-0" />
              <span>Tải file CSV mẫu</span>
            </button>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                isDragging && 'border-primary bg-primary/5',
                !isDragging && !file && 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30',
                file && !isDragging && 'border-primary/50 bg-primary/5',
              )}>
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              {file ? (
                <>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Kéo file CSV vào đây</p>
                  <p className="text-xs text-muted-foreground mt-0.5">hoặc nhấn để chọn file</p>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
              <Button
                onClick={() => importMutation.mutate(file!, { onSuccess: setResult })}
                disabled={!file || importMutation.isPending}
                className="flex-1">
                {importMutation.isPending ? 'Đang import...' : 'Import'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ListTab = 'all' | 'groups' | 'favorites';

export default function FlashcardsPage() {
  const [mode, setMode] = useState<'list' | 'study'>('list');
  const [listTab, setListTab] = useState<ListTab>('all');
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyDeck, setStudyDeck] = useState<Flashcard[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viInput, setViInput] = useState('');

  const { data: allCards = [], isLoading } = useFlashcards(false);
  const { data: dueCards = [] } = useFlashcards(true);
  const { data: favoriteCards = [] } = useFavoriteFlashcards();
  const { data: groups = [] } = useFlashcardGroups();
  const { data: stats } = useFlashcardStats();
  const reviewMutation = useReviewFlashcard();
  const deleteMutation = useDeleteFlashcard();
  const createFlashcard = useCreateFlashcard();
  const toggleFavorite = useToggleFavorite();
  const addCardToGroup = useAddCardToGroup();
  const exportFlashcards = useExportFlashcards();

  const streak = stats?.flashcardStreak ?? 0;
  const currentCard = studyDeck[studyIndex];

  function startStudy() {
    const deck = [...allCards].sort((a, b) => (a.isDue === b.isDue ? 0 : a.isDue ? -1 : 1)).slice(0, SESSION_LIMIT);
    setStudyDeck(deck); setStudyIndex(0); setMode('study');
  }

  function advance() {
    if (studyIndex < studyDeck.length - 1) { setStudyIndex((i) => i + 1); }
    else { setMode('list'); setStudyIndex(0); setStudyDeck([]); }
  }

  function handleReview(quality: number) {
    if (!currentCard) return;
    reviewMutation.mutate({ id: currentCard.id, data: { quality } }, { onSuccess: advance });
  }

  function handleCreateTranslation() {
    if (!viInput.trim()) return;
    createFlashcard.mutate({ front: viInput.trim(), back: '', type: 'TRANSLATION' },
      { onSuccess: () => { setViInput(''); setShowCreateForm(false); } });
  }

  if (isLoading) return <div className="text-center py-16 text-muted-foreground text-sm">Đang tải...</div>;

  if (mode === 'study' && currentCard) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Ôn flashcard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{studyIndex + 1} / {studyDeck.length}</span>
            <Button variant="outline" size="sm" onClick={() => { setMode('list'); setStudyIndex(0); setStudyDeck([]); }}>Thoát</Button>
          </div>
        </div>
        {currentCard.type === 'TRANSLATION'
          ? <TranslationStudyCard key={studyIndex} card={currentCard} onComplete={advance} />
          : <StudyCard key={studyIndex} card={currentCard} onReview={handleReview} />}
      </div>
    );
  }

  const sessionSize = Math.min(allCards.length, SESSION_LIMIT);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Flashcard</h1>
            {streak > 0 && (
              <span className="flex items-center gap-1 text-sm font-medium text-orange-500">
                <Flame className="h-4 w-4" />{streak} ngày
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {allCards.length} thẻ{dueCards.length > 0 && ` · ${dueCards.length} đến hạn hôm nay`}
            {favoriteCards.length > 0 && ` · ${favoriteCards.length} yêu thích`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowCreateForm((v) => !v)}>
            {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Thẻ dịch
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4" />Import
          </Button>
          <div className="relative">
            <Button variant="outline" size="sm" className="gap-1.5"
              onClick={() => setShowExportMenu((v) => !v)}
              disabled={allCards.length === 0}>
              <Download className="h-4 w-4" />Export<ChevronDown className="h-3 w-3" />
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 top-9 z-20 w-44 bg-popover border rounded-lg shadow-lg py-1">
                {([
                  { fmt: 'CSV', label: 'CSV (.csv)', Icon: FileDown },
                  { fmt: 'XLSX', label: 'Excel (.xlsx)', Icon: FileSpreadsheet },
                  { fmt: 'PDF', label: 'PDF (.pdf)', Icon: FileText },
                ] as const).map(({ fmt, label, Icon }) => (
                  <button key={fmt}
                    onClick={() => { exportFlashcards.mutate({ format: fmt }); setShowExportMenu(false); }}
                    disabled={exportFlashcards.isPending}
                    className="w-full text-left text-sm px-3 py-2 hover:bg-accent flex items-center gap-2.5 disabled:opacity-50">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />{label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {allCards.length > 0 && (
            <Button onClick={startStudy} className="gap-2">
              <RotateCcw className="h-4 w-4" />Ôn {sessionSize} thẻ
            </Button>
          )}
        </div>
      </div>

      {/* Create translation form */}
      {showCreateForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">Tạo thẻ dịch mới</p>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Câu tiếng Việt</p>
              <Textarea placeholder="VD: Tôi đang cố gắng cải thiện tiếng Anh của mình."
                value={viInput} onChange={(e) => setViInput(e.target.value)}
                className="min-h-[80px] resize-none" disabled={createFlashcard.isPending}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCreateTranslation(); }} />
              <p className="text-xs text-muted-foreground text-right">Ctrl+Enter để tạo</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateTranslation} disabled={!viInput.trim() || createFlashcard.isPending} size="sm" className="flex-1">
                {createFlashcard.isPending ? 'Đang tạo...' : 'Tạo thẻ'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowCreateForm(false); setViInput(''); }}>Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {([
          ['all', 'Tất cả'],
          ['groups', `Nhóm${groups.length ? ` (${groups.length})` : ''}`],
          ['favorites', `Yêu thích${favoriteCards.length ? ` (${favoriteCards.length})` : ''}`],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setListTab(key)}
            className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              listTab === key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {/* ── All tab ── */}
      {listTab === 'all' && (
        <>
          {allCards.length === 0 && !showCreateForm ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">
              <p>Chưa có flashcard nào.</p>
              <p className="mt-1">Lưu từ vựng từ tab <strong>Từ vựng</strong> sau khi nhận AI feedback, hoặc tạo thẻ dịch bằng nút bên trên.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {allCards.map((card) => (
                <FlashcardListItem key={card.id} card={card} groups={groups}
                  onDelete={() => deleteMutation.mutate(card.id)}
                  onToggleFavorite={() => toggleFavorite.mutate(card.id)}
                  onAddToGroup={(groupId) => addCardToGroup.mutate({ groupId, cardId: card.id })} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Groups tab ── */}
      {listTab === 'groups' && <GroupsPanel allCards={allCards} />}

      {/* ── Favorites tab ── */}
      {listTab === 'favorites' && (
        <>
          {favoriteCards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Heart className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Chưa có thẻ yêu thích nào.</p>
              <p className="mt-1 text-xs">Nhấn biểu tượng ❤ trên thẻ để thêm vào yêu thích.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {favoriteCards.map((card) => (
                <FlashcardListItem key={card.id} card={card} groups={groups}
                  onDelete={() => deleteMutation.mutate(card.id)}
                  onToggleFavorite={() => toggleFavorite.mutate(card.id)}
                  onAddToGroup={(groupId) => addCardToGroup.mutate({ groupId, cardId: card.id })} />
              ))}
            </div>
          )}
        </>
      )}

      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} />}
    </div>
  );
}
