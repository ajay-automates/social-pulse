import { Platform } from '@/lib/supabase';

export const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; color: string; bgColor: string; icon: string; authUrl: string }
> = {
  youtube: {
    label: 'YouTube',
    color: '#FF0033',
    bgColor: 'rgba(255, 0, 51, 0.1)',
    icon: '▶',
    authUrl: '/api/auth/youtube',
  },
  twitter: {
    label: 'Twitter / X',
    color: '#1DA1F2',
    bgColor: 'rgba(29, 161, 242, 0.1)',
    icon: '𝕏',
    authUrl: '/api/auth/twitter',
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    bgColor: 'rgba(10, 102, 194, 0.1)',
    icon: 'in',
    authUrl: '/api/auth/linkedin',
  },
  instagram: {
    label: 'Instagram',
    color: '#E4405F',
    bgColor: 'rgba(228, 64, 95, 0.1)',
    icon: '📷',
    authUrl: '/api/auth/instagram',
  },
  substack: {
    label: 'Substack',
    color: '#FF6719',
    bgColor: 'rgba(255, 103, 25, 0.1)',
    icon: '✉',
    authUrl: '', // Manual connect
  },
};

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toLocaleString();
}

export function formatDelta(delta: number): string {
  if (delta === 0) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${formatNumber(delta)}`;
}
