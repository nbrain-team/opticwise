import { google, drive_v3, docs_v1 } from 'googleapis';
import type { JWT } from 'googleapis-common';
import fs from 'fs';
import { createLogger } from '../util/logger.js';

const log = createLogger('drive');

export function getDriveClient(auth: JWT): drive_v3.Drive {
  return google.drive({ version: 'v3', auth });
}

export function getDocsClient(auth: JWT): docs_v1.Docs {
  return google.docs({ version: 'v1', auth });
}

export async function ensureDateFolder(
  drive: drive_v3.Drive,
  parentFolderId: string,
  dateString: string,
): Promise<string> {
  const existing = await drive.files.list({
    q: `'${parentFolderId}' in parents and name = '${dateString}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
  });

  if (existing.data.files?.length) {
    log.info('date_folder_exists', { folderId: existing.data.files[0].id, date: dateString });
    return existing.data.files[0].id!;
  }

  const created = await drive.files.create({
    requestBody: {
      name: dateString,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
  });

  log.info('date_folder_created', { folderId: created.data.id, date: dateString });
  return created.data.id!;
}

export async function createGoogleDoc(
  drive: drive_v3.Drive,
  docs: docs_v1.Docs,
  folderId: string,
  title: string,
  content: string,
): Promise<{ fileId: string; webViewLink: string }> {
  const file = await drive.files.create({
    requestBody: {
      name: title,
      mimeType: 'application/vnd.google-apps.document',
      parents: [folderId],
    },
    fields: 'id, webViewLink',
  });

  const fileId = file.data.id!;

  if (content.length > 0) {
    await docs.documents.batchUpdate({
      documentId: fileId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      },
    });
  }

  const verified = await verifyDoc(drive, docs, fileId, title, content);
  if (!verified.ok) {
    throw new Error(`Doc verification failed for "${title}": ${verified.reason}`);
  }

  return { fileId, webViewLink: file.data.webViewLink || `https://docs.google.com/document/d/${fileId}/edit` };
}

async function verifyDoc(
  drive: drive_v3.Drive,
  docs: docs_v1.Docs,
  fileId: string,
  expectedTitle: string,
  expectedContent: string,
): Promise<{ ok: boolean; reason?: string }> {
  const meta = await drive.files.get({ fileId, fields: 'name, mimeType' });
  if (meta.data.name !== expectedTitle) {
    return { ok: false, reason: `Title mismatch: got "${meta.data.name}", expected "${expectedTitle}"` };
  }

  const doc = await docs.documents.get({ documentId: fileId });
  const bodyContent = doc.data.body?.content
    ?.map((el) => el.paragraph?.elements?.map((e) => e.textRun?.content || '').join('') || '')
    .join('') || '';

  if (bodyContent.length < Math.min(200, expectedContent.length * 0.5)) {
    return {
      ok: false,
      reason: `Content too short: got ${bodyContent.length} chars, expected at least ${Math.min(200, expectedContent.length * 0.5)}`,
    };
  }

  const first200Expected = expectedContent.slice(0, 200).trim();
  const first200Got = bodyContent.slice(0, 200).trim();
  if (first200Expected.length > 50 && !first200Got.includes(first200Expected.slice(0, 50))) {
    return { ok: false, reason: 'First 200 chars do not match expected content' };
  }

  return { ok: true };
}

export async function uploadPng(
  drive: drive_v3.Drive,
  folderId: string,
  fileName: string,
  filePath: string,
): Promise<{ fileId: string; webContentLink: string }> {
  const fileSize = fs.statSync(filePath).size;

  const uploaded = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: 'image/png',
      body: fs.createReadStream(filePath),
    },
    fields: 'id, name, size, mimeType, webContentLink',
  });

  const fileId = uploaded.data.id!;

  if (uploaded.data.mimeType !== 'image/png') {
    throw new Error(`PNG upload mime mismatch: got ${uploaded.data.mimeType}`);
  }

  const uploadedSize = parseInt(uploaded.data.size || '0', 10);
  if (Math.abs(uploadedSize - fileSize) > 100) {
    throw new Error(`PNG size mismatch: uploaded ${uploadedSize}, local ${fileSize}`);
  }

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    fileId,
    webContentLink: `https://drive.google.com/uc?id=${fileId}&export=download`,
  };
}

export async function rollbackFolder(
  drive: drive_v3.Drive,
  folderId: string,
  fileIds: string[],
): Promise<void> {
  log.warn('drive_rollback_start', { folderId, fileCount: fileIds.length });

  for (const id of fileIds) {
    try {
      await drive.files.delete({ fileId: id });
    } catch (err) {
      log.error('rollback_file_delete_failed', err instanceof Error ? err : new Error(String(err)), {
        fileId: id,
      });
    }
  }

  log.info('drive_rollback_complete', { folderId });
}
