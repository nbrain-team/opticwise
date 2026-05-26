/**
 * Replay any past week's content engine run.
 *
 * Usage:
 *   npm run replay -- --week 2026-05-13
 *   npm run replay -- --week 2026-05-13 --commit
 */
import { createInterface } from 'readline';

const args = process.argv.slice(2);
const weekIdx = args.indexOf('--week');
const commitMode = args.includes('--commit');

if (weekIdx === -1 || !args[weekIdx + 1]) {
  console.error('Usage: npm run replay -- --week YYYY-MM-DD [--commit]');
  process.exit(1);
}

const weekDate = args[weekIdx + 1];

if (!/^\d{4}-\d{2}-\d{2}$/.test(weekDate)) {
  console.error(`Invalid date format: ${weekDate} (expected YYYY-MM-DD)`);
  process.exit(1);
}

console.log(`Content Engine — Replay Week ${weekDate}`);
console.log(`Mode: ${commitMode ? 'COMMIT (real writes)' : 'SANDBOX (read-only)'}`);
console.log('');

if (commitMode) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) => {
    rl.question('This will make real OWnet schedule calls and archive emails. Continue? [y/N] ', resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'y') {
    console.log('Aborted.');
    process.exit(0);
  }
}

if (!commitMode) {
  process.env.DRY_RUN = 'true';
}

process.env.REPLAY_WEEK = weekDate;
await import('../src/index.js');
