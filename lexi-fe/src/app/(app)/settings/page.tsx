'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMe } from '@/hooks/useMe';
import { useUpdateSettings } from '@/hooks/useFlashcards';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

function KeyStatus({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="flex items-center gap-1 text-xs text-green-600">
      <CheckCircle2 className="h-3.5 w-3.5" /> Đã cấu hình
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <XCircle className="h-3.5 w-3.5" /> Chưa cấu hình
    </span>
  );
}

function ApiKeyField({
  label,
  hint,
  placeholder,
  configured,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  placeholder: string;
  configured: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <KeyStatus configured={configured} />
      </div>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          placeholder={configured ? '••••••••••••••••••••••••' : placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function SettingsPage() {
  const { data: user } = useMe();
  const updateSettings = useUpdateSettings();

  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  function handleSave() {
    const payload: { openaiApiKey?: string; geminiApiKey?: string } = {};
    if (openaiKey !== '') payload.openaiApiKey = openaiKey;
    if (geminiKey !== '') payload.geminiApiKey = geminiKey;
    if (Object.keys(payload).length > 0) {
      updateSettings.mutate(payload);
      setOpenaiKey('');
      setGeminiKey('');
    }
  }

  function handleClear(provider: 'openai' | 'gemini') {
    updateSettings.mutate(
      provider === 'openai' ? { openaiApiKey: '' } : { geminiApiKey: '' },
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt</h1>
        <p className="text-muted-foreground text-sm mt-1">Quản lý API key AI của bạn</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Provider — Bring Your Own Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p className="font-medium">Dùng AI key của bạn — không tốn quota server</p>
            <p>Nếu bạn cấu hình key riêng, bài viết sẽ dùng key đó thay vì quota chung. Key được lưu mã hóa AES-256 trên server.</p>
          </div>

          {/* Gemini — có free tier */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">Google Gemini API Key</p>
                <p className="text-xs text-green-600 font-medium">FREE — 15 request/phút, 1 triệu tokens/ngày</p>
              </div>
              {user?.geminiKeyConfigured && (
                <Button variant="ghost" size="sm" className="text-destructive text-xs h-7"
                  onClick={() => handleClear('gemini')}>Xóa key</Button>
              )}
            </div>
            <ApiKeyField
              label="Gemini API Key"
              hint='Lấy miễn phí tại ai.google.dev → "Get API key" (không cần credit card)'
              placeholder="AIzaSy..."
              configured={user?.geminiKeyConfigured ?? false}
              value={geminiKey}
              onChange={setGeminiKey}
            />
          </div>

          <hr />

          {/* OpenAI — trả phí nhưng rẻ */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">OpenAI API Key</p>
                <p className="text-xs text-muted-foreground">~$0.001/bài với GPT-4o-mini (account mới có $5 free credit)</p>
              </div>
              {user?.openaiKeyConfigured && (
                <Button variant="ghost" size="sm" className="text-destructive text-xs h-7"
                  onClick={() => handleClear('openai')}>Xóa key</Button>
              )}
            </div>
            <ApiKeyField
              label="OpenAI API Key"
              hint="Lấy tại platform.openai.com → API keys"
              placeholder="sk-..."
              configured={user?.openaiKeyConfigured ?? false}
              value={openaiKey}
              onChange={setOpenaiKey}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending || (!openaiKey && !geminiKey)}
            >
              {updateSettings.isPending ? 'Đang lưu...' : 'Lưu cài đặt'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Ưu tiên: Gemini (free) → OpenAI (BYOK) → server key
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
