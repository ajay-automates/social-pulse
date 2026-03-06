import { NextRequest, NextResponse } from 'next/server';

// This endpoint is called by Railway cron or external cron service
// every 6 hours to refresh analytics data
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Call the analytics refresh endpoint
    const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics`, {
      method: 'POST',
    });
    const result = await refreshRes.json();

    return NextResponse.json({
      message: 'Cron job completed',
      ...result,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
