#!/bin/bash
# =============================================
# Social Pulse - Quick Setup Script
# Run this after extracting social-pulse.tar.gz
# =============================================

set -e

echo "📊 Social Pulse Setup"
echo "====================="

# Step 1: Navigate to project
cd social-pulse

# Step 2: Initialize git and push to the existing repo
echo ""
echo "🔗 Pushing to GitHub..."
git init
git remote add origin https://github.com/ajay-automates/social-pulse.git
git add -A
git commit -m "feat: Social Pulse v1.0 - unified social media analytics dashboard

- OAuth integration for YouTube, Twitter/X, LinkedIn, Instagram
- Substack public API integration  
- Daily snapshot tracking with day-over-day deltas
- Post-level metrics across all platforms
- Dark theme dashboard with platform-specific styling
- Cron job for automatic data refresh every 6 hours
- Supabase PostgreSQL for data persistence"

git branch -M main
git push -f origin main

echo ""
echo "✅ Pushed to https://github.com/ajay-automates/social-pulse"

# Step 3: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "=============================================
✅ Code is on GitHub!

NEXT STEPS:
=============================================

1️⃣  SUPABASE SETUP:
   - Go to https://supabase.com → New Project
   - Open SQL Editor → paste contents of supabase-migration.sql → Run
   - Copy Project URL + Service Role Key from Settings > API

2️⃣  CREATE OAUTH APPS:
   YouTube: https://console.cloud.google.com (enable YouTube Data API v3)
   Instagram: https://developers.facebook.com
   LinkedIn: https://www.linkedin.com/developers  
   Twitter: https://developer.twitter.com

3️⃣  DEPLOY TO RAILWAY:
   - Go to https://railway.app → New Project → Deploy from GitHub
   - Select ajay-automates/social-pulse
   - Add ALL environment variables from .env.example
   - Set NEXT_PUBLIC_APP_URL to your Railway domain
   - Update OAuth redirect URIs to use your Railway domain

4️⃣  SET UP CRON (auto-refresh every 6 hours):
   - Go to https://cron-job.org → Create free account
   - URL: https://YOUR-DOMAIN.up.railway.app/api/cron?secret=YOUR_CRON_SECRET
   - Schedule: Every 6 hours (0 */6 * * *)

5️⃣  CONNECT YOUR ACCOUNTS:
   - Open your Railway URL
   - Click 'Connect' for each platform
   - Log in and authorize
   - Click 'Refresh' to pull your first data snapshot!
============================================="
