/**
 * Patches Ghost's session service to disable staff email verification (2FA).
 * Ghost 5.130+ sends a verification code via email after password login.
 * If SMTP is not configured, this blocks all admin access.
 * This script makes sendAuthCodeToUser a no-op so password-only login works.
 */
const fs = require('fs');
const path = require('path');

const ghostInstall = process.env.GHOST_INSTALL || '/var/lib/ghost';

// Find the session service file
let sessionFile = null;
const versionsDir = path.join(ghostInstall, 'versions');

if (fs.existsSync(versionsDir)) {
  const versions = fs.readdirSync(versionsDir);
  for (const ver of versions) {
    const candidate = path.join(versionsDir, ver, 'core/server/services/auth/session/session-service.js');
    if (fs.existsSync(candidate)) {
      sessionFile = candidate;
      break;
    }
  }
}

// Also check the "current" symlink
if (!sessionFile) {
  const currentPath = path.join(ghostInstall, 'current/core/server/services/auth/session/session-service.js');
  if (fs.existsSync(currentPath)) {
    sessionFile = currentPath;
  }
}

if (!sessionFile) {
  console.log('[Ghost 2FA] Session service file not found, skipping patch');
  process.exit(0);
}

console.log(`[Ghost 2FA] Found session service: ${sessionFile}`);

let content = fs.readFileSync(sessionFile, 'utf8');

if (content.includes('__2FA_DISABLED__')) {
  console.log('[Ghost 2FA] Already patched, skipping');
  process.exit(0);
}

if (!content.includes('sendAuthCodeToUser')) {
  console.log('[Ghost 2FA] sendAuthCodeToUser not found (older Ghost version?), skipping');
  process.exit(0);
}

// Find and patch the sendAuthCodeToUser method
// Match any form of: async sendAuthCodeToUser(...) { ... }
const pattern = /(async\s+sendAuthCodeToUser\s*\([^)]*\)\s*\{)/;
const match = content.match(pattern);

if (match) {
  const replacement = match[1] + '\n            // __2FA_DISABLED__ Patched by Opticwise to skip email verification\n            return;\n';
  content = content.replace(pattern, replacement);
  fs.writeFileSync(sessionFile, content, 'utf8');
  console.log('[Ghost 2FA] Successfully disabled staff email verification');
} else {
  // Try a broader approach: find the function and insert return at the top
  const lines = content.split('\n');
  let patched = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('sendAuthCodeToUser') && lines[i].includes('async')) {
      // Insert return statement after the opening brace
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].includes('{')) {
          lines.splice(j + 1, 0, '            // __2FA_DISABLED__ Patched by Opticwise to skip email verification', '            return;');
          patched = true;
          break;
        }
      }
      if (patched) break;
    }
  }

  if (patched) {
    fs.writeFileSync(sessionFile, lines.join('\n'), 'utf8');
    console.log('[Ghost 2FA] Successfully disabled staff email verification (broad match)');
  } else {
    console.error('[Ghost 2FA] Could not find sendAuthCodeToUser function to patch');
    process.exit(1);
  }
}
