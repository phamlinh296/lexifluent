'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { cn, countWords } from '@/lib/utils';

interface WritingEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  maxWords?: number;
  className?: string;
}

export function WritingEditor({
  value,
  onChange,
  placeholder = 'Bắt đầu viết...',
  maxWords = 5000,
  className,
}: WritingEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, bold: false, italic: false, bulletList: false, orderedList: false }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: value,
    editorProps: {
      attributes: { class: 'tiptap-editor focus:outline-none' },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
  });

  const wordCount = countWords(editor?.getText() ?? '');
  const isOverLimit = wordCount > maxWords;
  const isUnderMin = wordCount > 0 && wordCount < 20;

  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn('rounded-md border focus-within:ring-2 focus-within:ring-ring', isOverLimit && 'border-destructive focus-within:ring-destructive')}>
        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center justify-between text-xs">
        {isUnderMin ? (
          <span className="text-destructive">Tối thiểu 20 từ</span>
        ) : (
          <span />
        )}
        <span className={cn('text-muted-foreground ml-auto', isOverLimit && 'text-destructive')}>
          {wordCount.toLocaleString('vi-VN')} / {maxWords.toLocaleString('vi-VN')} từ
        </span>
      </div>
    </div>
  );
}
