'use client';

import { useState, useEffect, useCallback } from 'react';
import { PLATFORM_CONFIG, formatNumber, formatDelta } from '@/lib/constants';
import type { Platform } from '@/lib/supabase';

interface Account {
  id: string;
  platform: Platform;
  username: string;
  display_name: string;
  avatar_url: string | null;
  connected_at: string;
  is_active: boolean;
}

interface Snapshot {
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
}

interface Post {
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
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [substackInput, setSubstackInput] = useState('');
  const [connectingSubstack, setConnectingSubstack] = useState(false);
  const [showConnect, setShowConnect] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAccounts(data.accounts || []);
      setSnapshots(data.snapshots || []);
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/analytics', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnectSubstack = async () => {
    if (!substackInput.trim()) return;
    setConnectingSubstack(true);
    try {
      const res = await fetch('/api/auth/substack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain: substackInput.trim() }),
      });
      if (res.ok) {
        setSubstackInput('');
        await fetchData();
      }
    } catch (err) {
      console.error('Substack connect failed:', err);
    } finally {
      setConnectingSubstack(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await fetch('/api/auth/disconnect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      await fetchData();
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  // Get latest snapshot for each account
  const getLatestSnapshot = (accountId: string): Snapshot | null => {
    return snapshots
      .filter((s) => s.account_id === accountId)
      .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  };

  // Aggregate totals
  const totals = accounts.reduce(
    (acc, account) => {
      const snap = getLatestSnapshot(account.id);
      if (snap) {
        acc.followers += snap.followers;
        acc.followersDelta += snap.followers_delta;
        acc.views += snap.total_views;
        acc.viewsDelta += snap.views_delta;
        acc.likes += snap.total_likes;
        acc.likesDelta += snap.likes_delta;
        acc.comments += snap.total_comments;
        acc.commentsDelta += snap.comments_delta;
      }
      return acc;
    },
    { followers: 0, followersDelta: 0, views: 0, viewsDelta: 0, likes: 0, likesDelta: 0, comments: 0, commentsDelta: 0 }
  );

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));
  const unconnectedPlatforms = (Object.keys(PLATFORM_CONFIG) as Platform[]).filter(
    (p) => !connectedPlatforms.has(p)
  );

  // Get posts for an account
  const getAccountPosts = (accountId: string) =>
    posts
      .filter((p) => p.account_id === accountId)
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  // Get all trend data for sparkline
  const getSnapshots = (accountId: string) =>
    snapshots
      .filter((s) => s.account_id === accountId)
      .sort((a, b) => a.date.localeCompare(b.date));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-pulse-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-gray-400">Loading Social Pulse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="border-b border-surface-3 sticky top-0 bg-surface-0/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pulse-green to-pulse-blue flex items-center justify-center">
              <span className="text-black font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                SP
              </span>
            </div>
            <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Social Pulse
            </h1>
            <span className="text-[10px] font-mono text-gray-500 bg-surface-2 px-2 py-0.5 rounded-full">
              by @ajay-automates
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConnect(!showConnect)}
              className="px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-sm font-medium transition-colors"
            >
              + Connect
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 rounded-lg bg-pulse-green/10 text-pulse-green hover:bg-pulse-green/20 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {refreshing ? '↻ Syncing...' : '↻ Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Connect Panel */}
        {showConnect && (
          <div className="mb-8 p-6 rounded-2xl bg-surface-1 border border-surface-3 animate-slide-up">
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Connect Your Accounts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG[Platform]][]).map(
                ([platform, config]) => {
                  const isConnected = connectedPlatforms.has(platform);

                  if (platform === 'substack') {
                    return (
                      <div
                        key={platform}
                        className="p-4 rounded-xl border border-surface-3 bg-surface-2/50"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{ background: config.bgColor, color: config.color }}
                          >
                            {config.icon}
                          </span>
                          <span className="text-sm font-medium">{config.label}</span>
                          {isConnected && <span className="pulse-dot bg-pulse-green ml-auto" />}
                        </div>
                        {isConnected ? (
                          <p className="text-xs text-gray-400">Connected</p>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="your-subdomain"
                              value={substackInput}
                              onChange={(e) => setSubstackInput(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-surface-0 border border-surface-3 text-xs focus:outline-none focus:border-accent-substack"
                            />
                            <button
                              onClick={handleConnectSubstack}
                              disabled={connectingSubstack}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: config.bgColor, color: config.color }}
                            >
                              {connectingSubstack ? '...' : 'Go'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <a
                      key={platform}
                      href={isConnected ? undefined : config.authUrl}
                      className={`p-4 rounded-xl border border-surface-3 bg-surface-2/50 transition-all ${
                        isConnected ? 'opacity-80' : 'hover:border-opacity-50 cursor-pointer'
                      }`}
                      style={!isConnected ? { ['--tw-border-opacity' as any]: 0.3 } : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                          style={{ background: config.bgColor, color: config.color }}
                        >
                          {config.icon}
                        </span>
                        <span className="text-sm font-medium">{config.label}</span>
                        {isConnected && <span className="pulse-dot bg-pulse-green ml-auto" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {isConnected ? 'Connected' : 'Click to connect'}
                      </p>
                    </a>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {accounts.length === 0 && !showConnect && (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pulse-green/20 to-pulse-blue/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📊</span>
            </div>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Welcome to Social Pulse
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Connect your social media accounts to start tracking views, likes, comments, and growth
              — all in one place.
            </p>
            <button
              onClick={() => setShowConnect(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pulse-green to-pulse-blue text-black font-semibold hover:opacity-90 transition-opacity"
            >
              Connect Your First Account
            </button>
          </div>
        )}

        {/* Aggregate Stats */}
        {accounts.length > 0 && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Followers', value: totals.followers, delta: totals.followersDelta, color: '#00FF88' },
                { label: 'Total Views', value: totals.views, delta: totals.viewsDelta, color: '#3366FF' },
                { label: 'Total Likes', value: totals.likes, delta: totals.likesDelta, color: '#FF0033' },
                { label: 'Total Comments', value: totals.comments, delta: totals.commentsDelta, color: '#FFAA00' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`metric-card p-5 rounded-2xl bg-surface-1 border border-surface-3 animate-slide-up stagger-${i + 1}`}
                  style={{ opacity: 0 }}
                >
                  <p className="text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p
                    className="text-3xl font-bold animate-count-up"
                    style={{ fontFamily: 'var(--font-display)', color: stat.color }}
                  >
                    {formatNumber(stat.value)}
                  </p>
                  {stat.delta !== 0 && (
                    <p className={`text-sm font-mono mt-1 ${stat.delta > 0 ? 'delta-positive' : 'delta-negative'}`}>
                      {formatDelta(stat.delta)} today
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Platform Cards */}
            <h2
              className="text-lg font-semibold mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Platform Breakdown
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {accounts.map((account) => {
                const config = PLATFORM_CONFIG[account.platform];
                const snap = getLatestSnapshot(account.id);
                const accountPosts = getAccountPosts(account.id).slice(0, 5);
                const history = getSnapshots(account.id);

                return (
                  <div
                    key={account.id}
                    className={`rounded-2xl bg-surface-1 border border-surface-3 overflow-hidden glow-${account.platform}`}
                  >
                    {/* Platform Header */}
                    <div
                      className="px-5 py-4 flex items-center justify-between"
                      style={{ borderBottom: `1px solid ${config.color}22` }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                          style={{ background: config.bgColor, color: config.color }}
                        >
                          {config.icon}
                        </span>
                        <div>
                          <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                            {config.label}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">@{account.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="pulse-dot" style={{ background: config.color }} />
                        <button
                          onClick={() => handleDisconnect(account.id)}
                          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    {snap ? (
                      <div className="grid grid-cols-2 gap-px bg-surface-3">
                        {[
                          { label: 'Followers', value: snap.followers, delta: snap.followers_delta },
                          { label: 'Views', value: snap.total_views, delta: snap.views_delta },
                          { label: 'Likes', value: snap.total_likes, delta: snap.likes_delta },
                          { label: 'Comments', value: snap.total_comments, delta: snap.comments_delta },
                        ].map((metric) => (
                          <div key={metric.label} className="bg-surface-1 px-4 py-3">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                              {metric.label}
                            </p>
                            <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                              {formatNumber(metric.value)}
                            </p>
                            {metric.delta !== 0 && (
                              <p
                                className={`text-xs font-mono ${
                                  metric.delta > 0 ? 'delta-positive' : 'delta-negative'
                                }`}
                              >
                                {formatDelta(metric.delta)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-5 py-8 text-center">
                        <p className="text-sm text-gray-400">No data yet</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Click Refresh to pull your first snapshot
                        </p>
                      </div>
                    )}

                    {/* Mini sparkline using CSS */}
                    {history.length > 1 && (
                      <div className="px-5 py-3 border-t border-surface-3">
                        <p className="text-[10px] font-mono text-gray-500 mb-2">FOLLOWER TREND</p>
                        <div className="flex items-end gap-0.5 h-8">
                          {history.slice(-14).map((s, i) => {
                            const values = history.slice(-14).map((h) => h.followers);
                            const max = Math.max(...values);
                            const min = Math.min(...values);
                            const range = max - min || 1;
                            const height = ((s.followers - min) / range) * 100;
                            return (
                              <div
                                key={i}
                                className="flex-1 rounded-sm transition-all"
                                style={{
                                  height: `${Math.max(height, 5)}%`,
                                  background: config.color,
                                  opacity: 0.3 + (i / 14) * 0.7,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recent Posts */}
                    {accountPosts.length > 0 && (
                      <div className="px-5 py-3 border-t border-surface-3">
                        <p className="text-[10px] font-mono text-gray-500 mb-2">RECENT POSTS</p>
                        <div className="space-y-2">
                          {accountPosts.map((post) => (
                            <a
                              key={post.id}
                              href={post.post_url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 py-1.5 hover:bg-surface-2/50 rounded-lg px-2 -mx-2 transition-colors"
                            >
                              {post.thumbnail_url && (
                                <img
                                  src={post.thumbnail_url}
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs truncate">
                                  {post.title || 'Untitled post'}
                                </p>
                                <div className="flex gap-3 text-[10px] font-mono text-gray-500 mt-0.5">
                                  {post.views > 0 && <span>{formatNumber(post.views)} views</span>}
                                  <span>{formatNumber(post.likes)} likes</span>
                                  <span>{formatNumber(post.comments)} comments</span>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Top Posts Table */}
            {posts.length > 0 && (
              <>
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Top Performing Posts
                </h2>
                <div className="rounded-2xl bg-surface-1 border border-surface-3 overflow-hidden mb-8">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-3">
                          <th className="text-left py-3 px-5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                            Post
                          </th>
                          <th className="text-left py-3 px-5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                            Platform
                          </th>
                          <th className="text-right py-3 px-5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                            Views
                          </th>
                          <th className="text-right py-3 px-5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                            Likes
                          </th>
                          <th className="text-right py-3 px-5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                            Comments
                          </th>
                          <th className="text-right py-3 px-5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                            Published
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...posts]
                          .sort((a, b) => b.views + b.likes * 10 - (a.views + a.likes * 10))
                          .slice(0, 20)
                          .map((post) => {
                            const account = accounts.find((a) => a.id === post.account_id);
                            const config = account ? PLATFORM_CONFIG[account.platform] : null;

                            return (
                              <tr key={post.id} className="border-b border-surface-3/50 hover:bg-surface-2/30">
                                <td className="py-3 px-5">
                                  <a
                                    href={post.post_url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 hover:text-white transition-colors"
                                  >
                                    {post.thumbnail_url && (
                                      <img
                                        src={post.thumbnail_url}
                                        alt=""
                                        className="w-8 h-8 rounded-lg object-cover"
                                      />
                                    )}
                                    <span className="truncate max-w-[200px]">
                                      {post.title || 'Untitled'}
                                    </span>
                                  </a>
                                </td>
                                <td className="py-3 px-5">
                                  {config && (
                                    <span
                                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                                      style={{ background: config.bgColor, color: config.color }}
                                    >
                                      {config.label}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-5 text-right font-mono text-xs">
                                  {formatNumber(post.views)}
                                </td>
                                <td className="py-3 px-5 text-right font-mono text-xs">
                                  {formatNumber(post.likes)}
                                </td>
                                <td className="py-3 px-5 text-right font-mono text-xs">
                                  {formatNumber(post.comments)}
                                </td>
                                <td className="py-3 px-5 text-right font-mono text-xs text-gray-400">
                                  {new Date(post.published_at).toLocaleDateString()}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-3 py-6 text-center">
        <p className="text-xs text-gray-500 font-mono">
          Social Pulse • Built by Ajay • Data refreshes every 6 hours
        </p>
      </footer>
    </div>
  );
}
