import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client, getTokensFromCode } from '@/lib/google';
import { prisma } from '@/lib/db';

/**
 * Handles Google OAuth callback
 * GET /api/integrations/google/callback?code=xxx&state=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    const oauth2Client = getOAuth2Client();
    const tokens = await getTokensFromCode(oauth2Client, code);

    // TODO: Store tokens in database associated with user
    // For now, we'll just return them (in production, store securely!)
    console.log('Google OAuth tokens received:', {
      access_token: tokens.access_token ? 'present' : 'missing',
      refresh_token: tokens.refresh_token ? 'present' : 'missing',
      expiry_date: tokens.expiry_date,
    });

    // In a real implementation, you would:
    // 1. Get the current user from session
    // 2. Store tokens in database encrypted
    // 3. Redirect to success page
    
    // For now, redirect to a success page
    return NextResponse.redirect(
      new URL('/settings?google_connected=true', request.url)
    );
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/settings?error=oauth_failed', request.url)
    );
  }
}

