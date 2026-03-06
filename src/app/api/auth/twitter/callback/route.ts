import { NextRequest, NextResponse } from 'next/server';
import { exchangeTwitterCode } from '@/lib/oauth';
import { getServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const codeVerifier = req.cookies.get('twitter_code_verifier')?.value;
  const storedState = req.cookies.get('twitter_state')?.value;

  if (!code || !codeVerifier) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=no_code`);
  }

  if (state !== storedState) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=state_mismatch`);
  }

  try {
    const tokenData = await exchangeTwitterCode(code, codeVerifier);

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=twitter_token_failed`);
    }

    // Get Twitter user info
    const userRes = await fetch(
      'https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const userData = await userRes.json();
    const user = userData.data;

    const db = getServiceClient();

    await db.from('connected_accounts').upsert(
      {
        platform: 'twitter',
        platform_user_id: user.id,
        username: user.username,
        display_name: user.name,
        avatar_url: user.profile_image_url || null,
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

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connected=twitter`
    );
    // Clear cookies
    response.cookies.delete('twitter_code_verifier');
    response.cookies.delete('twitter_state');

    return response;
  } catch (error) {
    console.error('Twitter OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=twitter_failed`);
  }
}
