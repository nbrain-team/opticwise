/**
 * Dry-run: full pipeline with DRY_RUN=true.
 * Uses real Gmail and Claude, writes to Drive sandbox folder, skips OWnet and archive.
 */
process.env.DRY_RUN = 'true';

console.log('Content Engine — Dry Run');
console.log('Uses real Gmail + Claude. No OWnet calls. No email archive.');
console.log('');

await import('../src/index.js');
