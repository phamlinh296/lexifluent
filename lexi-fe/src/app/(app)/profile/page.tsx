'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useMe, useUpdateProfile } from '@/hooks/useMe';
import { useLogout } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cefrColor, getInitials } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import type { CefrLevel } from '@/types/api';

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const schema = z.object({
  displayName: z.string().min(2, 'Tối thiểu 2 ký tự').max(100),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { data: user } = useMe();
  const update = useUpdateProfile();
  const logout = useLogout();
  const [selectedCefr, setSelectedCefr] = useState<CefrLevel | null>(user?.cefrLevel ?? null);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: { displayName: user?.displayName ?? '' },
  });

  const onSubmit = (data: FormData) => {
    update.mutate(
      { displayName: data.displayName, cefrLevel: selectedCefr ?? undefined },
      { onSuccess: () => toast({ description: 'Đã cập nhật hồ sơ' }) },
    );
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ</h1>

      <Card>
        <CardContent className="pt-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                {getInitials(user.displayName)}
              </div>
            )}
            <div>
              <p className="font-semibold">{user.displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className="text-xs bg-secondary px-2 py-0.5 rounded-full mt-1 inline-block">
                {user.provider === 'GOOGLE' ? 'Google' : 'Email'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Tên hiển thị</Label>
              <Input {...register('displayName')} />
              {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>Trình độ CEFR</Label>
              <div className="flex flex-wrap gap-2">
                {CEFR_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedCefr(level)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                      selectedCefr === level ? 'border-primary bg-primary/10' : 'border-border'
                    } ${cefrColor(level)}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground border-t pt-4">
              <p>Streak hiện tại: 🔥 {user.writingStreak} ngày</p>
              {user.lastActiveDate && <p>Hoạt động cuối: {user.lastActiveDate}</p>}
            </div>

            <Button type="submit" disabled={update.isPending || (!isDirty && selectedCefr === user.cefrLevel)}>
              {update.isPending && <Loader2 className="animate-spin" />}
              Lưu thay đổi
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Tài khoản</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => logout.mutate()} disabled={logout.isPending}>
            {logout.isPending && <Loader2 className="animate-spin" />}
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
