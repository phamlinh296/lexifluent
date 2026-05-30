'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Home,
  Languages,
  LogOut,
  PenSquare,
  FileText,
  User,
  LayersIcon,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/writing', label: 'Bài viết', icon: FileText },
  { href: '/writing/new', label: 'Viết mới', icon: PenSquare },
  { href: '/vocabulary', label: 'Từ vựng', icon: BookOpen },
  { href: '/flashcards', label: 'Flashcard', icon: LayersIcon },
  { href: '/translate', label: 'Dịch câu', icon: Languages },
  { href: '/progress', label: 'Tiến trình', icon: BarChart3 },
  { href: '/profile', label: 'Hồ sơ', icon: User },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useLogout();

  return (
    <aside className="hidden md:flex flex-col w-60 border-r bg-card h-screen sticky top-0">
      {/* Logo */}
      <Link href="/" className="px-6 py-5 border-b block hover:bg-accent/50 transition-colors">
        <span className="text-xl font-bold text-primary">LexiFluent</span>
        <p className="text-xs text-muted-foreground mt-0.5">AI Writing Coach</p>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' &&
              pathname.startsWith(href + '/') &&
              !navItems.some((other) => other.href !== href && pathname.startsWith(other.href)));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t space-y-2">
        {user && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{user.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </aside>
  );
}
