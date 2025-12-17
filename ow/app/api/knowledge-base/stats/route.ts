import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get Drive file stats by type
    const driveStats = await prisma.$queryRaw<{ mimeType: string; total: bigint; vectorized: bigint }[]>`
      SELECT 
        "mimeType",
        COUNT(*) as total,
        SUM(CASE WHEN vectorized = true THEN 1 ELSE 0 END) as vectorized
      FROM "DriveFile"
      GROUP BY "mimeType"
      ORDER BY COUNT(*) DESC
    `;

    // Get email stats
    const emailStats = await prisma.$queryRaw<{ total: bigint; vectorized: bigint }[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN vectorized = true THEN 1 ELSE 0 END) as vectorized
      FROM "GmailMessage"
    `;

    // Get transcript stats
    const transcriptStats = await prisma.$queryRaw<{ total: bigint; vectorized: bigint }[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN vectorized = true THEN 1 ELSE 0 END) as vectorized
      FROM "CallTranscript"
    `;

    // Get calendar event stats
    const calendarStats = await prisma.$queryRaw<{ total: bigint; vectorized: bigint }[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN vectorized = true THEN 1 ELSE 0 END) as vectorized
      FROM "CalendarEvent"
    `;

    // Define vectorizable types
    const vectorizableTypes = [
      'application/pdf',
      'application/vnd.google-apps.document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv',
    ];

    // Format drive stats
    const formattedDriveStats = driveStats.map(stat => ({
      mimeType: stat.mimeType,
      total: Number(stat.total),
      vectorized: Number(stat.vectorized),
      isVectorizable: vectorizableTypes.includes(stat.mimeType),
      displayName: getMimeTypeDisplayName(stat.mimeType),
    }));

    // Calculate totals
    const vectorizableDriveFiles = formattedDriveStats
      .filter(s => s.isVectorizable)
      .reduce((acc, s) => ({ total: acc.total + s.total, vectorized: acc.vectorized + s.vectorized }), { total: 0, vectorized: 0 });

    return NextResponse.json({
      drive: {
        byType: formattedDriveStats,
        vectorizable: vectorizableDriveFiles,
        lastSync: new Date().toISOString(),
      },
      emails: {
        total: Number(emailStats[0]?.total || 0),
        vectorized: Number(emailStats[0]?.vectorized || 0),
      },
      transcripts: {
        total: Number(transcriptStats[0]?.total || 0),
        vectorized: Number(transcriptStats[0]?.vectorized || 0),
      },
      calendar: {
        total: Number(calendarStats[0]?.total || 0),
        vectorized: Number(calendarStats[0]?.vectorized || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching knowledge base stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

function getMimeTypeDisplayName(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF Documents',
    'application/vnd.google-apps.document': 'Google Docs',
    'application/vnd.google-apps.spreadsheet': 'Google Sheets',
    'application/vnd.google-apps.presentation': 'Google Slides',
    'application/vnd.google-apps.folder': 'Folders',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Documents (.docx)',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheets (.xlsx)',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint (.pptx)',
    'text/plain': 'Plain Text Files',
    'text/markdown': 'Markdown Files',
    'text/csv': 'CSV Files',
    'image/jpeg': 'JPEG Images',
    'image/png': 'PNG Images',
    'image/heif': 'HEIF Images',
    'image/webp': 'WebP Images',
    'image/gif': 'GIF Images',
    'video/mp4': 'MP4 Videos',
    'video/quicktime': 'QuickTime Videos',
    'application/zip': 'ZIP Archives',
    'application/x-zip': 'ZIP Archives',
  };
  return typeMap[mimeType] || mimeType;
}

