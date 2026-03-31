import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import * as zernio from '@/lib/zernio';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const maxSize = 8 * 1024 * 1024; // 8MB for images
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 8MB.' },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/x-msvideo',
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not supported` },
        { status: 400 }
      );
    }

    const result = await zernio.uploadMedia(file, file.name);

    let mediaType = 'image';
    if (file.type.startsWith('video/')) mediaType = 'video';
    else if (file.type === 'application/pdf' || file.type.includes('presentation') || file.type.includes('word')) {
      mediaType = 'document';
    }

    return NextResponse.json({
      url: result.url,
      type: mediaType,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload media' },
      { status: 500 }
    );
  }
}
