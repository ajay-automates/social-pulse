import { NextRequest, NextResponse } from 'next/server';
import { exchangeLinkedInCode } from '@/lib/oauth';
import { getServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=no_code`);
  }

  try {
    const tokenData = await exchangeLinkedInCode(code);

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=li_token_failed`);
    }

    // Get LinkedIn profile
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    const db = getServiceClient();

    await db.from('connected_accounts').upsert(
      {
        platform: 'linkedin',
        platform_user_id: profile.sub,
        username: profile.email || profile.name,
        display_name: profile.name,
        avatar_url: profile.picture || null,
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

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connected=linkedin`);
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=linkedin_failed`);
  }
}
