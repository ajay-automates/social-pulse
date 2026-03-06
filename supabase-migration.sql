-- =============================================
-- SOCIAL PULSE - Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Connected social media accounts
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'twitter', 'linkedin', 'instagram', 'substack')),
  platform_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(platform, platform_user_id)
);

-- Daily analytics snapshots (one per account per day)
CREATE TABLE IF NOT EXISTS daily_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  followers INTEGER DEFAULT 0,
  followers_delta INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  views_delta BIGINT DEFAULT 0,
  total_likes BIGINT DEFAULT 0,
  likes_delta BIGINT DEFAULT 0,
  total_comments BIGINT DEFAULT 0,
  comments_delta BIGINT DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  engagement_rate DECIMAL(10, 4) DEFAULT 0,
  extra_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, date)
);

-- Individual post metrics
CREATE TABLE IF NOT EXISTS post_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  platform_post_id TEXT NOT NULL,
  title TEXT,
  post_url TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  extra_metrics JSONB DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, platform_post_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_snapshots_account_date ON daily_snapshots(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON daily_snapshots(date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_account ON post_metrics(account_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON post_metrics(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_platform ON connected_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON connected_accounts(is_active);

-- RLS (Row Level Security) - Disabled for simplicity since this is a personal dashboard
-- If you want multi-user support, enable RLS and add policies
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_metrics ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by API routes)
CREATE POLICY "Service role full access" ON connected_accounts FOR ALL USING (true);
CREATE POLICY "Service role full access" ON daily_snapshots FOR ALL USING (true);
CREATE POLICY "Service role full access" ON post_metrics FOR ALL USING (true);
