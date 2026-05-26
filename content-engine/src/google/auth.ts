import { google } from 'googleapis';
import type { JWT } from 'googleapis-common';

let cachedAuth: JWT | null = null;

export function getAuthClient(clientEmail: string, privateKey: string): JWT {
  if (cachedAuth) return cachedAuth;

  cachedAuth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents',
    ],
    subject: 'bill@opticwise.com',
  });

  return cachedAuth;
}

export async function verifyAuth(auth: JWT): Promise<void> {
  await auth.authorize();
}
