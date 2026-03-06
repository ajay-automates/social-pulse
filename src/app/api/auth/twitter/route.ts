import { NextRequest, NextResponse } from 'next/server';
import { getTwitterAuthUrl } from '@/lib/oauth';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  // Generate PKCE code verifier and S256 challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');

  const url = getTwitterAuthUrl(state, codeChallenge);

  // Store code verifier in a cookie for the callback
  const response = NextResponse.redirect(url);
  response.cookies.set('twitter_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });
  response.cookies.set('twitter_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
  });

  return response;
}
