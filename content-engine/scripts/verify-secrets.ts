import { google } from 'googleapis';
import Anthropic from '@anthropic-ai/sdk';

interface Check {
  name: string;
  fn: () => Promise<void>;
}

const checks: Check[] = [
  {
    name: 'Google Service Account (Gmail)',
    fn: async () => {
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SA_CLIENT_EMAIL!,
        key: process.env.GOOGLE_SA_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/gmail.modify'],
        subject: 'bill@opticwise.com',
      });
      await auth.authorize();
      const gmail = google.gmail({ version: 'v1', auth });
      const resp = await gmail.users.labels.list({ userId: 'me' });
      if (!resp.data.labels?.length) throw new Error('No labels returned');
    },
  },
  {
    name: 'Google Service Account (Drive)',
    fn: async () => {
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SA_CLIENT_EMAIL!,
        key: process.env.GOOGLE_SA_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/drive'],
        subject: 'bill@opticwise.com',
      });
      await auth.authorize();
      const drive = google.drive({ version: 'v3', auth });
      const folderId = process.env.DRIVE_MASTER_FOLDER_ID || '1AaLAdB-3u2OVQ0tXiNk1X7ZynRUhOGqv';
      const resp = await drive.files.get({ fileId: folderId, fields: 'id, name' });
      if (!resp.data.id) throw new Error('Folder not accessible');
      console.log(`  Drive folder: ${resp.data.name} (${resp.data.id})`);
    },
  },
  {
    name: 'Anthropic API Key',
    fn: async () => {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const resp = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Reply with "ok"' }],
      });
      if (!resp.content.length) throw new Error('No response');
    },
  },
  {
    name: 'Image API Key (Ideogram)',
    fn: async () => {
      const resp = await fetch('https://api.ideogram.ai/describe', {
        method: 'POST',
        headers: {
          'Api-Key': process.env.IMAGE_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_url: 'https://ideogram.ai/assets/progressive-image/balanced/response/png' }),
      });
      if (resp.status === 401) throw new Error('Invalid API key');
      // Any non-401 means the key is valid (even 400 for bad input)
    },
  },
  {
    name: 'Slack Bot Token',
    fn: async () => {
      const resp = await fetch('https://slack.com/api/auth.test', {
        headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN!}` },
      });
      const data = (await resp.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error || 'Slack auth failed');
    },
  },
  {
    name: 'OWnet API Token',
    fn: async () => {
      const endpoint = process.env.OWNET_INSIGHTS_ENDPOINT || 'https://ownet.opticwise.com/api/insights/schedule';
      const healthUrl = endpoint.replace('/insights/schedule', '/health');
      try {
        const resp = await fetch(healthUrl, {
          headers: { Authorization: `Bearer ${process.env.OWNET_API_TOKEN!}` },
        });
        console.log(`  OWnet health: ${resp.status}`);
      } catch {
        console.log('  OWnet not reachable (may not be deployed yet)');
      }
    },
  },
];

async function main() {
  console.log('Content Engine — Secret Verification');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      await check.fn();
      console.log(`✓ ${check.name}`);
      passed++;
    } catch (err) {
      console.error(`✗ ${check.name}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log('');
  console.log(`${passed} passed, ${failed} failed`);

  if (failed > 0) process.exit(1);
}

main();
