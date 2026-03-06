import { NextResponse } from 'next/server';
import { getLinkedInAuthUrl } from '@/lib/oauth';

export async function GET() {
  const url = getLinkedInAuthUrl();
  return NextResponse.redirect(url);
}
