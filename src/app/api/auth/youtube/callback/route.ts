import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCode } from '@/lib/oauth';
import { getServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=no_code`);
  }

  try {
    const tokenData = await exchangeGoogleCode(code);

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=token_failed`);
    }

    // Get user/channel info
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    if (!channel) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=no_channel`);
    }

    const db = getServiceClient();

    // Upsert connected account
    await db.from('connected_accounts').upsert(
      {
        platform: 'youtube',
        platform_user_id: channel.id,
        username: channel.snippet.customUrl || channel.snippet.title,
        display_name: channel.snippet.title,
        avatar_url: channel.snippet.thumbnails?.default?.url,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        scopes: tokenData.scope || null,
        is_active: true,
      },
      { onConflict: 'platform,platform_user_id' }
    );

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connected=youtube`);
  } catch (error) {
    console.error('YouTube OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=youtube_failed`);
  }
}
