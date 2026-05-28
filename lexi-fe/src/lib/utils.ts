import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CefrLevel } from '@/types/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cefrColor(level: CefrLevel | null | undefined): string {
  if (!level) return 'bg-gray-100 text-gray-600';
  if (level === 'A1' || level === 'A2') return 'bg-blue-100 text-blue-700';
  if (level === 'B1' || level === 'B2') return 'bg-green-100 text-green-700';
  return 'bg-purple-100 text-purple-700';
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
