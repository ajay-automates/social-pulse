import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { fetchAnalytics } from '@/lib/platforms';

export async function GET() {
  try {
    const db = getServiceClient();

    // Get all connected accounts
    const { data: accounts, error } = await db
      .from('connected_accounts')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    if (!accounts?.length) {
      return NextResponse.json({ accounts: [], snapshots: [], posts: [] });
    }

    // Get latest snapshots for comparison
    const { data: latestSnapshots } = await db
      .from('daily_snapshots')
      .select('*')
      .order('date', { ascending: false })
      .limit(accounts.length * 30); // Last 30 days per account

    // Get recent post metrics
    const { data: recentPosts } = await db
      .from('post_metrics')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(100);

    // Return sanitized accounts (no tokens)
    const safeAccounts = accounts.map((a) => ({
      id: a.id,
      platform: a.platform,
      username: a.username,
      display_name: a.display_name,
      avatar_url: a.avatar_url,
      connected_at: a.connected_at,
      is_active: a.is_active,
    }));

    return NextResponse.json({
      accounts: safeAccounts,
      snapshots: latestSnapshots || [],
      posts: recentPosts || [],
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

// Manual refresh trigger
export async function POST() {
  try {
    const db = getServiceClient();

    const { data: accounts, error } = await db
      .from('connected_accounts')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    if (!accounts?.length) {
      return NextResponse.json({ message: 'No accounts connected' });
    }

    const results = [];
    const today = new Date().toISOString().split('T')[0];

    for (const account of accounts) {
      try {
        const analytics = await fetchAnalytics(account);

        // Get yesterday's snapshot for delta calculation
        const { data: prevSnapshot } = await db
          .from('daily_snapshots')
          .select('*')
          .eq('account_id', account.id)
          .lt('date', today)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        // Upsert today's snapshot
        await db.from('daily_snapshots').upsert(
          {
            account_id: account.id,
            date: today,
            followers: analytics.followers,
            followers_delta: prevSnapshot ? analytics.followers - prevSnapshot.followers : 0,
            total_views: analytics.totalViews,
            views_delta: prevSnapshot ? analytics.totalViews - prevSnapshot.total_views : 0,
            total_likes: analytics.totalLikes,
            likes_delta: prevSnapshot ? analytics.totalLikes - prevSnapshot.total_likes : 0,
            total_comments: analytics.totalComments,
            comments_delta: prevSnapshot ? analytics.totalComments - prevSnapshot.total_comments : 0,
            total_posts: analytics.totalPosts,
            engagement_rate: analytics.engagementRate,
            extra_metrics: analytics.extraMetrics,
          },
          { onConflict: 'account_id,date' }
        );

        // Upsert post metrics
        for (const post of analytics.posts) {
          await db.from('post_metrics').upsert(
            {
              account_id: account.id,
              platform_post_id: post.platformPostId,
              title: post.title,
              post_url: post.postUrl,
              thumbnail_url: post.thumbnailUrl,
              published_at: post.publishedAt,
              views: post.views,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              extra_metrics: post.extraMetrics,
            },
            { onConflict: 'account_id,platform_post_id' }
          );
        }

        results.push({ platform: account.platform, status: 'success' });
      } catch (err: any) {
        console.error(`Failed to fetch ${account.platform}:`, err.message);
        results.push({ platform: account.platform, status: 'error', message: err.message });
      }
    }

    return NextResponse.json({ results, refreshedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Analytics refresh error:', error);
    return NextResponse.json({ error: 'Failed to refresh analytics' }, { status: 500 });
  }
}
