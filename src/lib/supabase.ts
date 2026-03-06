import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =============================================
// Database Types
// =============================================

export type Platform = 'youtube' | 'twitter' | 'linkedin' | 'instagram' | 'substack';

export interface ConnectedAccount {
  id: string;
  platform: Platform;
  platform_user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string | null;
  connected_at: string;
  is_active: boolean;
}

export interface DailySnapshot {
  id: string;
  account_id: string;
  date: string;
  followers: number;
  followers_delta: number;
  total_views: number;
  views_delta: number;
  total_likes: number;
  likes_delta: number;
  total_comments: number;
  comments_delta: number;
  total_posts: number;
  engagement_rate: number;
  extra_metrics: Record<string, any>;
  created_at: string;
}

export interface PostMetric {
  id: string;
  account_id: string;
  platform_post_id: string;
  title: string | null;
  post_url: string | null;
  thumbnail_url: string | null;
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  extra_metrics: Record<string, any>;
  fetched_at: string;
}
