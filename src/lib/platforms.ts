// =============================================
// Platform API integrations
// Each fetcher uses OAuth tokens to pull analytics
// =============================================

import { ConnectedAccount } from './supabase';

export interface AnalyticsData {
  followers: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalPosts: number;
  engagementRate: number;
  extraMetrics: Record<string, any>;
  posts: PostData[];
}

export interface PostData {
  platformPostId: string;
  title: string | null;
  postUrl: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  extraMetrics: Record<string, any>;
}

// =============================================
// YOUTUBE - YouTube Data API v3 + Analytics API
// =============================================
export async function fetchYouTubeAnalytics(account: ConnectedAccount): Promise<AnalyticsData> {
  const token = account.access_token;

  // Get channel stats
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const channelData = await channelRes.json();

  if (!channelData.items?.length) {
    throw new Error('No YouTube channel found');
  }

  const channel = channelData.items[0];
  const stats = channel.statistics;

  // Get recent videos (last 50)
  const videosRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=20&order=date`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const videosData = await videosRes.json();

  const videoIds = (videosData.items || []).map((v: any) => v.id.videoId).join(',');

  let posts: PostData[] = [];
  if (videoIds) {
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const statsData = await statsRes.json();

    posts = (statsData.items || []).map((video: any) => ({
      platformPostId: video.id,
      title: video.snippet.title,
      postUrl: `https://youtube.com/watch?v=${video.id}`,
      thumbnailUrl: video.snippet.thumbnails?.medium?.url || null,
      publishedAt: video.snippet.publishedAt,
      views: parseInt(video.statistics.viewCount || '0'),
      likes: parseInt(video.statistics.likeCount || '0'),
      comments: parseInt(video.statistics.commentCount || '0'),
      shares: 0,
      extraMetrics: {
        favoriteCount: parseInt(video.statistics.favoriteCount || '0'),
      },
    }));
  }

  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);

  return {
    followers: parseInt(stats.subscriberCount || '0'),
    totalViews: parseInt(stats.viewCount || '0'),
    totalLikes: totalLikes,
    totalComments: totalComments,
    totalPosts: parseInt(stats.videoCount || '0'),
    engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0,
    extraMetrics: {
      subscriberCount: parseInt(stats.subscriberCount || '0'),
      hiddenSubscriberCount: stats.hiddenSubscriberCount,
    },
    posts,
  };
}

// =============================================
// INSTAGRAM - Instagram Graph API (Meta)
// =============================================
export async function fetchInstagramAnalytics(account: ConnectedAccount): Promise<AnalyticsData> {
  const token = account.access_token;

  // Get user profile + insights
  const profileRes = await fetch(
    `https://graph.instagram.com/me?fields=id,username,media_count,followers_count&access_token=${token}`
  );
  const profile = await profileRes.json();

  // Get recent media with insights
  const mediaRes = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20&access_token=${token}`
  );
  const mediaData = await mediaRes.json();

  const posts: PostData[] = (mediaData.data || []).map((post: any) => ({
    platformPostId: post.id,
    title: post.caption?.substring(0, 100) || null,
    postUrl: post.permalink,
    thumbnailUrl: post.thumbnail_url || post.media_url || null,
    publishedAt: post.timestamp,
    views: 0, // Requires insights endpoint for reach
    likes: post.like_count || 0,
    comments: post.comments_count || 0,
    shares: 0,
    extraMetrics: {
      mediaType: post.media_type,
    },
  }));

  // Try to get account insights (requires business account)
  let reach = 0;
  let impressions = 0;
  try {
    const insightsRes = await fetch(
      `https://graph.instagram.com/${profile.id}/insights?metric=reach,impressions&period=day&access_token=${token}`
    );
    const insightsData = await insightsRes.json();
    if (insightsData.data) {
      reach = insightsData.data.find((m: any) => m.name === 'reach')?.values?.[0]?.value || 0;
      impressions = insightsData.data.find((m: any) => m.name === 'impressions')?.values?.[0]?.value || 0;
    }
  } catch (e) {
    // Insights may not be available for all account types
  }

  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);

  return {
    followers: profile.followers_count || 0,
    totalViews: impressions,
    totalLikes: totalLikes,
    totalComments: totalComments,
    totalPosts: profile.media_count || 0,
    engagementRate: profile.followers_count > 0
      ? ((totalLikes + totalComments) / profile.followers_count) * 100
      : 0,
    extraMetrics: { reach, impressions },
    posts,
  };
}

// =============================================
// LINKEDIN - LinkedIn API v2
// =============================================
export async function fetchLinkedInAnalytics(account: ConnectedAccount): Promise<AnalyticsData> {
  const token = account.access_token;

  // Get profile
  const profileRes = await fetch(
    'https://api.linkedin.com/v2/userinfo',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const profile = await profileRes.json();

  // Get posts (UGC posts)
  let posts: PostData[] = [];
  let totalLikes = 0;
  let totalComments = 0;
  let totalViews = 0;

  try {
    const postsRes = await fetch(
      `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:${account.platform_user_id})&count=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const postsData = await postsRes.json();

    if (postsData.elements) {
      for (const post of postsData.elements) {
        const urn = post['id'];
        // Try fetching social actions
        try {
          const actionsRes = await fetch(
            `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(urn)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const actions = await actionsRes.json();

          const likes = actions.likesSummary?.totalLikes || 0;
          const comments = actions.commentsSummary?.totalFirstLevelComments || 0;

          posts.push({
            platformPostId: urn,
            title: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text?.substring(0, 100) || null,
            postUrl: null,
            thumbnailUrl: null,
            publishedAt: new Date(post.created?.time || Date.now()).toISOString(),
            views: 0,
            likes,
            comments,
            shares: 0,
            extraMetrics: {},
          });

          totalLikes += likes;
          totalComments += comments;
        } catch (e) {
          // Skip post if social actions unavailable
        }
      }
    }
  } catch (e) {
    // Posts endpoint may require specific permissions
  }

  return {
    followers: 0, // LinkedIn doesn't expose follower count via basic API
    totalViews: totalViews,
    totalLikes: totalLikes,
    totalComments: totalComments,
    totalPosts: posts.length,
    engagementRate: 0,
    extraMetrics: {
      name: profile.name,
      picture: profile.picture,
    },
    posts,
  };
}

// =============================================
// TWITTER/X - X API v2
// =============================================
export async function fetchTwitterAnalytics(account: ConnectedAccount): Promise<AnalyticsData> {
  const token = account.access_token;

  // Get user info
  const userRes = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const userData = await userRes.json();
  const user = userData.data;
  const publicMetrics = user?.public_metrics || {};

  // Get recent tweets with metrics
  let posts: PostData[] = [];
  try {
    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${user.id}/tweets?max_results=20&tweet.fields=public_metrics,created_at`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const tweetsData = await tweetsRes.json();

    posts = (tweetsData.data || []).map((tweet: any) => ({
      platformPostId: tweet.id,
      title: tweet.text?.substring(0, 100) || null,
      postUrl: `https://x.com/${user.username}/status/${tweet.id}`,
      thumbnailUrl: null,
      publishedAt: tweet.created_at,
      views: tweet.public_metrics?.impression_count || 0,
      likes: tweet.public_metrics?.like_count || 0,
      comments: tweet.public_metrics?.reply_count || 0,
      shares: tweet.public_metrics?.retweet_count || 0,
      extraMetrics: {
        quoteCount: tweet.public_metrics?.quote_count || 0,
        bookmarkCount: tweet.public_metrics?.bookmark_count || 0,
      },
    }));
  } catch (e) {
    // May require paid tier for tweet reading
  }

  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);

  return {
    followers: publicMetrics.followers_count || 0,
    totalViews,
    totalLikes,
    totalComments,
    totalPosts: publicMetrics.tweet_count || 0,
    engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0,
    extraMetrics: {
      following: publicMetrics.following_count,
      listedCount: publicMetrics.listed_count,
    },
    posts,
  };
}

// =============================================
// SUBSTACK - Unofficial API
// =============================================
export async function fetchSubstackAnalytics(account: ConnectedAccount): Promise<AnalyticsData> {
  // Substack has no official API - we use the public RSS/JSON feed
  const subdomain = account.username; // e.g., "ajay" from ajay.substack.com

  try {
    const res = await fetch(`https://${subdomain}.substack.com/api/v1/archive?sort=new&limit=20`);
    const postsData = await res.json();

    const posts: PostData[] = (postsData || []).map((post: any) => ({
      platformPostId: String(post.id),
      title: post.title,
      postUrl: post.canonical_url,
      thumbnailUrl: post.cover_image || null,
      publishedAt: post.post_date,
      views: 0, // Not available from public endpoint
      likes: post.reactions?.length || 0,
      comments: post.comment_count || 0,
      shares: 0,
      extraMetrics: {
        subtitle: post.subtitle,
        wordCount: post.wordcount,
        type: post.type,
      },
    }));

    const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);

    return {
      followers: 0, // Not available without auth
      totalViews: 0,
      totalLikes: totalLikes,
      totalComments: totalComments,
      totalPosts: posts.length,
      engagementRate: 0,
      extraMetrics: {},
      posts,
    };
  } catch (e) {
    return {
      followers: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalPosts: 0,
      engagementRate: 0,
      extraMetrics: {},
      posts: [],
    };
  }
}

// =============================================
// Dispatcher
// =============================================
export async function fetchAnalytics(account: ConnectedAccount): Promise<AnalyticsData> {
  switch (account.platform) {
    case 'youtube':
      return fetchYouTubeAnalytics(account);
    case 'instagram':
      return fetchInstagramAnalytics(account);
    case 'linkedin':
      return fetchLinkedInAnalytics(account);
    case 'twitter':
      return fetchTwitterAnalytics(account);
    case 'substack':
      return fetchSubstackAnalytics(account);
    default:
      throw new Error(`Unknown platform: ${account.platform}`);
  }
}
