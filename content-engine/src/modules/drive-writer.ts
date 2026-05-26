import type { drive_v3, docs_v1 } from 'googleapis';
import type { AuthorPackage } from '../types/package.js';
import type { DriveAsset } from '../types/run.js';
import {
  ensureDateFolder,
  createGoogleDoc,
  uploadPng,
  rollbackFolder,
} from '../google/drive.js';
import type { GeneratedImage } from './image-generator.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('drive-writer');

interface DriveWriterInput {
  drive: drive_v3.Drive;
  docs: docs_v1.Docs;
  masterFolderId: string;
  date: string;
  packages: AuthorPackage[];
  briefing: { title: string; body: string };
  summary: { title: string; body: string };
  images: GeneratedImage[];
  runSummary: string;
  isReplay?: boolean;
}

export interface GeneratedImage {
  filePath: string;
  fileName: string;
  ok: boolean;
  error?: string;
}

export async function writeToDrive(input: DriveWriterInput): Promise<DriveAsset[]> {
  const folderName = input.isReplay ? `${input.date}-replay` : input.date;
  const folderId = await ensureDateFolder(input.drive, input.masterFolderId, folderName);

  const createdFileIds: string[] = [];
  const assets: DriveAsset[] = [];

  try {
    for (const pkg of input.packages) {
      const authorLabel = pkg.author === 'bill' ? 'Bill Douglas' : 'Drew Hall';
      const docTitle = `${input.date}-${pkg.author}-${pkg.slug}`;

      const docContent = [
        `# ${pkg.metadata.title}`,
        `Author: ${authorLabel}`,
        `Category: ${pkg.metadata.category}`,
        `Tags: ${pkg.metadata.tags.join(', ')}`,
        `Reading Time: ${pkg.metadata.readingTimeMinutes} min`,
        `SEO Title: ${pkg.metadata.seoTitle}`,
        `SEO Description: ${pkg.metadata.seoDescription}`,
        '',
        '---',
        '',
        '## Blog Post',
        '',
        pkg.blogMarkdown,
        '',
        '---',
        '',
        '## LinkedIn Article',
        '',
        pkg.linkedinArticleMarkdown,
        '',
        '---',
        '',
        '## LinkedIn Short Post',
        '',
        pkg.linkedinShortPost.text,
        '',
        `Hashtags: ${pkg.linkedinShortPost.hashtags.map((h) => `#${h}`).join(' ')}`,
      ].join('\n');

      const doc = await createGoogleDoc(input.drive, input.docs, folderId, docTitle, docContent);
      createdFileIds.push(doc.fileId);
      assets.push({
        fileId: doc.fileId,
        name: docTitle,
        mimeType: 'application/vnd.google-apps.document',
        webViewLink: doc.webViewLink,
      });

      log.info('doc_written', { author: pkg.author, title: docTitle, fileId: doc.fileId });
    }

    const briefingDoc = await createGoogleDoc(
      input.drive,
      input.docs,
      folderId,
      `${input.date}-weekly-intelligence-briefing`,
      `${input.briefing.title}\n\n${input.briefing.body}`,
    );
    createdFileIds.push(briefingDoc.fileId);
    assets.push({
      fileId: briefingDoc.fileId,
      name: `${input.date}-weekly-intelligence-briefing`,
      mimeType: 'application/vnd.google-apps.document',
      webViewLink: briefingDoc.webViewLink,
    });

    const summaryDoc = await createGoogleDoc(
      input.drive,
      input.docs,
      folderId,
      `${input.date}-content-summary`,
      `${input.summary.title}\n\n${input.summary.body}`,
    );
    createdFileIds.push(summaryDoc.fileId);
    assets.push({
      fileId: summaryDoc.fileId,
      name: `${input.date}-content-summary`,
      mimeType: 'application/vnd.google-apps.document',
      webViewLink: summaryDoc.webViewLink,
    });

    for (const img of input.images) {
      if (!img.ok) {
        log.warn('image_skipped', { fileName: img.fileName, error: img.error });
        continue;
      }

      const uploaded = await uploadPng(input.drive, folderId, img.fileName, img.filePath);
      createdFileIds.push(uploaded.fileId);
      assets.push({
        fileId: uploaded.fileId,
        name: img.fileName,
        mimeType: 'image/png',
        webViewLink: uploaded.webContentLink,
      });
    }

    const runSummaryDoc = await createGoogleDoc(
      input.drive,
      input.docs,
      folderId,
      `${input.date}-RUN_SUMMARY`,
      input.runSummary,
    );
    createdFileIds.push(runSummaryDoc.fileId);
    assets.push({
      fileId: runSummaryDoc.fileId,
      name: `${input.date}-RUN_SUMMARY`,
      mimeType: 'application/vnd.google-apps.document',
      webViewLink: runSummaryDoc.webViewLink,
    });

    log.info('drive_write_complete', {
      folderId,
      totalAssets: assets.length,
      docs: assets.filter((a) => a.mimeType.includes('document')).length,
      images: assets.filter((a) => a.mimeType === 'image/png').length,
    });

    return assets;
  } catch (err) {
    log.error('drive_write_failed_rolling_back', err instanceof Error ? err : new Error(String(err)));
    await rollbackFolder(input.drive, folderId, createdFileIds);
    throw err;
  }
}
