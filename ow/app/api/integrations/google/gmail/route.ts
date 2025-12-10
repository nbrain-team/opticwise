import { NextRequest, NextResponse } from 'next/server';
import { getServiceAccountClient, getGmailClient } from '@/lib/google';

/**
 * Get Gmail messages (using service account)
 * GET /api/integrations/google/gmail?maxResults=10
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    const query = searchParams.get('query') || '';

    const auth = getServiceAccountClient();
    const gmail = await getGmailClient(auth);

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query,
    });

    return NextResponse.json({
      messages: response.data.messages || [],
      resultSizeEstimate: response.data.resultSizeEstimate,
    });
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Gmail messages', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Send an email via Gmail (using service account)
 * POST /api/integrations/google/gmail
 * Body: { to, subject, body }
 */
export async function POST(request: NextRequest) {
  try {
    const { to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    const auth = getServiceAccountClient();
    const gmail = await getGmailClient(auth);

    // Create email in RFC 2822 format
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body,
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: response.data.id,
    });
  } catch (error) {
    console.error('Error sending Gmail message:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: String(error) },
      { status: 500 }
    );
  }
}


