'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, Home, Languages, PenSquare, LayersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/writing/new', label: 'Viết', icon: PenSquare },
  { href: '/vocabulary', label: 'Từ vựng', icon: BookOpen },
  { href: '/flashcards', label: 'Flashcard', icon: LayersIcon },
  { href: '/translate', label: 'Dịch câu', icon: Languages },
  { href: '/progress', label: 'Tiến trình', icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
      <div className="grid grid-cols-6">
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
                'flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
