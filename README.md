# 📊 Social Pulse — Your Social Media Command Center

Track all your social media analytics in one unified dashboard. Connect YouTube, Twitter/X, LinkedIn, Instagram, and Substack — see views, likes, comments, follower growth, and daily deltas at a glance.

**Zero third-party API costs.** Uses direct OAuth connections to each platform's free API.

![Social Pulse](https://img.shields.io/badge/Next.js-14-black?style=flat-square) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square) ![Railway](https://img.shields.io/badge/Deploy-Railway-purple?style=flat-square)

## Features

- **YouTube** — Subscribers, views, likes, comments per video (YouTube Data API v3)
- **Twitter/X** — Followers, impressions, likes, replies, retweets (X API v2)
- **LinkedIn** — Post engagement, likes, comments (LinkedIn API v2)
- **Instagram** — Followers, reach, impressions, likes, comments (Instagram Graph API)
- **Substack** — Post count, likes, comments (unofficial public API)
- **Daily Snapshots** — Historical tracking with day-over-day deltas
- **Top Posts** — See your best performing content across all platforms
- **Auto-refresh** — Cron job pulls fresh data every 6 hours

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TailwindCSS, TypeScript
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Railway
- **Auth**: Direct OAuth 2.0 per platform

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `supabase-migration.sql`
3. Copy your **Project URL** and **Service Role Key** from Settings > API

### 2. Create OAuth Apps

#### YouTube (Google Cloud Console)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project, enable **YouTube Data API v3** and **YouTube Analytics API**
3. Create **OAuth 2.0 credentials** (Web application)
4. Add redirect URI: `https://your-domain.up.railway.app/api/auth/youtube/callback`
5. Copy Client ID and Client Secret

#### Instagram (Meta Developer Portal)
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create an app, add **Instagram Basic Display** and **Instagram Graph API**
3. Add redirect URI: `https://your-domain.up.railway.app/api/auth/instagram/callback`
4. Copy App ID and App Secret

#### LinkedIn (LinkedIn Developer Portal)
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers)
2. Create an app, add **Sign In with LinkedIn using OpenID Connect** and **Share on LinkedIn**
3. Add redirect URI: `https://your-domain.up.railway.app/api/auth/linkedin/callback`
4. Copy Client ID and Client Secret

#### Twitter/X (X Developer Portal)
1. Go to [X Developer Portal](https://developer.twitter.com)
2. Create a project and app with **OAuth 2.0** enabled
3. Set **Type of App** to "Web App"
4. Add redirect URI: `https://your-domain.up.railway.app/api/auth/twitter/callback`
5. Copy Client ID and Client Secret

### 3. Deploy to Railway

1. Push this repo to GitHub
2. Go to [Railway](https://railway.app) and create a new project from GitHub
3. Add environment variables (see `.env.example`)
4. Set `NEXT_PUBLIC_APP_URL` to your Railway domain (e.g., `https://social-pulse-production.up.railway.app`)
5. Railway will auto-detect Next.js and deploy

### 4. Set Up Cron Job

For automatic data refreshes, set up a cron job that hits:
```
GET https://your-domain.up.railway.app/api/cron?secret=YOUR_CRON_SECRET
```

Options:
- **Railway Cron**: Add a cron service in Railway
- **cron-job.org**: Free external cron service
- **GitHub Actions**: Schedule a workflow

Recommended: Every 6 hours (`0 */6 * * *`)

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `META_APP_ID` | Meta/Facebook App ID |
| `META_APP_SECRET` | Meta/Facebook App Secret |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth client secret |
| `TWITTER_CLIENT_ID` | X/Twitter OAuth 2.0 client ID |
| `TWITTER_CLIENT_SECRET` | X/Twitter OAuth 2.0 client secret |
| `CRON_SECRET` | Secret for cron job authentication |

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Next.js App                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ Dashboard │  │ OAuth    │  │ Analytics    │    │
│  │ (React)  │  │ Callbacks│  │ API + Cron   │    │
│  └──────────┘  └──────────┘  └──────────────┘    │
│        │              │              │             │
│        └──────────────┼──────────────┘             │
│                       │                            │
│               ┌───────▼───────┐                    │
│               │   Supabase    │                    │
│               │  (PostgreSQL) │                    │
│               └───────────────┘                    │
└──────────────────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
    ┌────▼────┐   ┌─────▼────┐  ┌─────▼─────┐
    │ YouTube │   │ Twitter  │  │ Instagram │ ...
    │  API    │   │  API     │  │  API      │
    └─────────┘   └──────────┘  └───────────┘
```

## Built by

**Ajay** ([@ajay-automates](https://github.com/ajay-automates))
