'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Chrome, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegister } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { ERROR_MESSAGES } from '@/types/api';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';

const schema = z.object({
  displayName: z.string().min(2, 'Tên tối thiểu 2 ký tự').max(100),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(72),
});

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const register_ = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    register_.mutate(data, {
      onError: (err) => {
        const code = (err as AxiosError<ApiResponse<unknown>>)?.response?.data?.error?.code ?? '';
        toast({
          variant: 'destructive',
          title: 'Đăng ký thất bại',
          description: ERROR_MESSAGES[code] ?? 'Có lỗi xảy ra, vui lòng thử lại',
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Tên hiển thị</Label>
          <Input id="displayName" placeholder="Nguyễn Văn A" {...register('displayName')} />
          {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input id="password" type="password" placeholder="Tối thiểu 8 ký tự" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={register_.isPending}>
          {register_.isPending && <Loader2 className="animate-spin" />}
          Tạo tài khoản
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => { window.location.href = process.env.NEXT_PUBLIC_OAUTH_GOOGLE_URL!; }}
      >
        <Chrome className="h-4 w-4" />
        Đăng ký với Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
