'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { isAuthenticated, isHydrating } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrating && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isHydrating, router]);

  if (isHydrating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-primary animate-pulse-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-primary">LexiFluent</span>
            <p className="text-xs text-muted-foreground hidden sm:block">AI Writing Coach</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Đăng ký</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Luyện viết tiếng Anh cùng{' '}
            <span className="text-primary">AI Coach</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Nhận phản hồi tức thì, xây dựng từ vựng, theo dõi tiến trình IELTS — tất cả trong một nền tảng.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button size="lg" asChild>
              <Link href="/register">Bắt đầu miễn phí</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Đã có tài khoản</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LexiFluent
      </footer>
    </div>
  );
}
