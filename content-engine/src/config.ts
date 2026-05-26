export interface Config {
  googleSaClientEmail: string;
  googleSaPrivateKey: string;
  anthropicApiKey: string;
  imageApiKey: string;
  ownetApiToken: string;
  ownetInsightsEndpoint: string;
  ownetSocialEndpoint: string;
  driveMasterFolderId: string;
  slackBotToken: string;
  slackNotifyChannelId: string;
  gmailLabel: string;
  runId: string;
  isDryRun: boolean;
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export function loadConfig(): Config {
  const now = new Date();
  const runId = `ce-${now.toISOString().replace(/[-:T]/g, '').slice(0, 15)}-${process.env.GITHUB_RUN_ID || 'local'}`;

  return {
    googleSaClientEmail: requireEnv('GOOGLE_SA_CLIENT_EMAIL'),
    googleSaPrivateKey: requireEnv('GOOGLE_SA_PRIVATE_KEY').replace(/\\n/g, '\n'),
    anthropicApiKey: requireEnv('ANTHROPIC_API_KEY'),
    imageApiKey: requireEnv('IMAGE_API_KEY'),
    ownetApiToken: requireEnv('OWNET_API_TOKEN'),
    ownetInsightsEndpoint: process.env.OWNET_INSIGHTS_ENDPOINT || 'https://ownet.opticwise.com/api/insights/schedule',
    ownetSocialEndpoint: process.env.OWNET_SOCIAL_ENDPOINT || 'https://ownet.opticwise.com/api/social/compose',
    driveMasterFolderId: process.env.DRIVE_MASTER_FOLDER_ID || '1AaLAdB-3u2OVQ0tXiNk1X7ZynRUhOGqv',
    slackBotToken: requireEnv('SLACK_BOT_TOKEN'),
    slackNotifyChannelId: requireEnv('SLACK_NOTIFY_CHANNEL_ID'),
    gmailLabel: process.env.GMAIL_LABEL || '2day-wd-inbox-2day-wd-read',
    runId,
    isDryRun: process.env.DRY_RUN === 'true',
  };
}
