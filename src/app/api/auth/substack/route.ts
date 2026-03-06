import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

// Substack has no OAuth - user provides their subdomain
export async function POST(req: NextRequest) {
  try {
    const { subdomain } = await req.json();

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain required' }, { status: 400 });
    }

    // Verify the substack exists by fetching the archive
    const verifyRes = await fetch(`https://${subdomain}.substack.com/api/v1/archive?limit=1`);
    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Substack not found' }, { status: 404 });
    }

    const db = getServiceClient();

    await db.from('connected_accounts').upsert(
      {
        platform: 'substack',
        platform_user_id: subdomain,
        username: subdomain,
        display_name: `${subdomain} on Substack`,
        avatar_url: null,
        access_token: 'public', // No auth needed for public data
        refresh_token: null,
        token_expires_at: null,
        scopes: null,
        is_active: true,
      },
      { onConflict: 'platform,platform_user_id' }
    );

    return NextResponse.json({ success: true, subdomain });
  } catch (error) {
    console.error('Substack connect error:', error);
    return NextResponse.json({ error: 'Failed to connect Substack' }, { status: 500 });
  }
}
