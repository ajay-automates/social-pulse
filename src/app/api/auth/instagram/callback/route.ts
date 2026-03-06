import { NextRequest, NextResponse } from 'next/server';
import { exchangeInstagramCode } from '@/lib/oauth';
import { getServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=no_code`);
  }

  try {
    const tokenData = await exchangeInstagramCode(code);

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=ig_token_failed`);
    }

    // Get Instagram profile
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${tokenData.access_token}`
    );
    const profile = await profileRes.json();

    const db = getServiceClient();

    await db.from('connected_accounts').upsert(
      {
        platform: 'instagram',
        platform_user_id: tokenData.ig_account_id || profile.id,
        username: profile.username || 'instagram_user',
        display_name: profile.username || 'Instagram',
        avatar_url: null,
        access_token: tokenData.access_token,
        refresh_token: null,
        token_expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        scopes: null,
        is_active: true,
      },
      { onConflict: 'platform,platform_user_id' }
    );

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connected=instagram`);
  } catch (error) {
    console.error('Instagram OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=instagram_failed`);
  }
}
