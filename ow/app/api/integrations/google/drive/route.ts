import { NextRequest, NextResponse } from 'next/server';
import { getServiceAccountClient, getDriveClient } from '@/lib/google';

/**
 * List files from Google Drive (using service account)
 * GET /api/integrations/google/drive?maxResults=10&query=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageSize = parseInt(searchParams.get('maxResults') || '10');
    const query = searchParams.get('query') || '';

    const auth = getServiceAccountClient();
    const drive = await getDriveClient(auth);

    const response = await drive.files.list({
      pageSize,
      q: query,
      fields: 'files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink)',
    });

    return NextResponse.json({
      files: response.data.files || [],
    });
  } catch (error) {
    console.error('Error fetching Drive files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Drive files', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Get file metadata or download file
 * GET /api/integrations/google/drive/[fileId]
 */
export async function POST(request: NextRequest) {
  try {
    const { fileId, action = 'metadata' } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing fileId' },
        { status: 400 }
      );
    }

    const auth = getServiceAccountClient();
    const drive = await getDriveClient(auth);

    if (action === 'metadata') {
      const response = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, createdTime, modifiedTime, size, webViewLink, description',
      });

      return NextResponse.json(response.data);
    } else if (action === 'download') {
      const response = await drive.files.get(
        {
          fileId,
          alt: 'media',
        },
        { responseType: 'stream' }
      );

      // For actual file download, you'd need to stream this properly
      // This is a simplified version
      return NextResponse.json({
        message: 'File download would stream here',
        fileId,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error accessing Drive file:', error);
    return NextResponse.json(
      { error: 'Failed to access Drive file', details: String(error) },
      { status: 500 }
    );
  }
}

