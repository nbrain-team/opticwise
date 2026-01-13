import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client, generateAuthUrl } from '@/lib/google';

/**
 * Initiates Google OAuth flow
 * GET /api/integrations/google/auth
 */
export async function GET(request: NextRequest) {
  try {
    const oauth2Client = getOAuth2Client();
    
    // Optional: pass user ID or other state to maintain context after callback
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state') || undefined;
    
    const authUrl = generateAuthUrl(oauth2Client, state);
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}






