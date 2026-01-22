/**
 * Extract Email Examples for Brand Voice Training
 * 
 * This script queries the database for high-quality outgoing emails
 * that can be used as style examples for AI voice matching.
 * 
 * Usage:
 *   npx tsx scripts/extract-email-examples.ts
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

interface EmailExample {
  id: string;
  subject: string;
  body: string;
  from: string;
  to: string;
  date: Date;
  length: number;
  snippet: string;
}

async function extractEmailExamples() {
  console.log('🔍 Extracting high-quality email examples...\n');

  try {
    // Query for outgoing emails with good characteristics
    // Filter by 'from' containing opticwise or bill to identify outgoing emails
    const query = `
      SELECT 
        id,
        subject,
        body,
        "from",
        "to",
        date,
        LENGTH(body) as length,
        snippet
      FROM "GmailMessage"
      WHERE (
        "from" ILIKE '%opticwise%' 
        OR "from" ILIKE '%bill%douglas%'
        OR "from" ILIKE '%drew%hall%'
      )
        AND body IS NOT NULL
        AND LENGTH(body) BETWEEN 200 AND 2000
        AND date > NOW() - INTERVAL '12 months'
        AND body NOT ILIKE '%unsubscribe%'
        AND body NOT ILIKE '%automated%'
        AND body NOT ILIKE '%do not reply%'
      ORDER BY date DESC
      LIMIT 100;
    `;

    const result = await pool.query(query);
    const emails: EmailExample[] = result.rows;

    console.log(`✅ Found ${emails.length} candidate emails\n`);

    // Categorize emails for easier review
    const categorized = {
      short: emails.filter(e => e.length < 500),
      medium: emails.filter(e => e.length >= 500 && e.length < 1000),
      long: emails.filter(e => e.length >= 1000),
    };

    console.log('📊 Email Distribution:');
    console.log(`   Short (200-500 chars): ${categorized.short.length}`);
    console.log(`   Medium (500-1000 chars): ${categorized.medium.length}`);
    console.log(`   Long (1000-2000 chars): ${categorized.long.length}\n`);

    // Create output directory
    const outputDir = path.join(process.cwd(), 'style-examples-review');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Generate review files
    generateReviewFile(outputDir, 'short-emails.md', categorized.short);
    generateReviewFile(outputDir, 'medium-emails.md', categorized.medium);
    generateReviewFile(outputDir, 'long-emails.md', categorized.long);

    // Generate CSV for easier review
    generateCSV(outputDir, 'all-emails.csv', emails);

    console.log('✅ Review files generated in ./style-examples-review/\n');
    console.log('📋 Next Steps:');
    console.log('   1. Review the markdown files in ./style-examples-review/');
    console.log('   2. Mark good examples with ✅ in the markdown');
    console.log('   3. Categorize each selected example:');
    console.log('      - cold_outreach (first contact)');
    console.log('      - follow_up (check-ins, follow-ups)');
    console.log('      - proposal (pricing, proposals)');
    console.log('      - technical (technical explanations)');
    console.log('      - relationship (casual, relationship-building)');
    console.log('   4. Run populate-style-guide.ts with selected examples\n');

  } catch (error) {
    console.error('❌ Error extracting emails:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

function generateReviewFile(dir: string, filename: string, emails: EmailExample[]) {
  const filepath = path.join(dir, filename);
  let content = `# Email Examples for Review\n\n`;
  content += `Total: ${emails.length} emails\n\n`;
  content += `## Instructions\n\n`;
  content += `1. Review each email below\n`;
  content += `2. Mark good examples with ✅ at the start of the section\n`;
  content += `3. Add category tag: [cold_outreach], [follow_up], [proposal], [technical], or [relationship]\n`;
  content += `4. Delete or mark ❌ for poor examples\n\n`;
  content += `---\n\n`;

  emails.forEach((email, idx) => {
    content += `## Email ${idx + 1}\n\n`;
    content += `**Status:** [ ] Review | [ ] ✅ Good | [ ] ❌ Skip\n`;
    content += `**Category:** [ ] cold_outreach | [ ] follow_up | [ ] proposal | [ ] technical | [ ] relationship\n\n`;
    content += `**Subject:** ${email.subject}\n`;
    content += `**From:** ${email.from}\n`;
    content += `**To:** ${email.to}\n`;
    content += `**Date:** ${email.date.toLocaleDateString()}\n`;
    content += `**Length:** ${email.length} characters\n\n`;
    content += `**Body:**\n\n`;
    content += '```\n';
    content += cleanEmailBody(email.body);
    content += '\n```\n\n';
    content += `---\n\n`;
  });

  fs.writeFileSync(filepath, content);
  console.log(`   ✅ Created ${filename} (${emails.length} emails)`);
}

function generateCSV(dir: string, filename: string, emails: EmailExample[]) {
  const filepath = path.join(dir, filename);
  let content = 'ID,Date,Subject,From,To,Length,Snippet\n';

  emails.forEach(email => {
    const row = [
      email.id,
      email.date.toISOString(),
      `"${email.subject.replace(/"/g, '""')}"`,
      `"${email.from.replace(/"/g, '""')}"`,
      `"${email.to.replace(/"/g, '""')}"`,
      email.length,
      `"${(email.snippet || '').replace(/"/g, '""')}"`,
    ].join(',');
    content += row + '\n';
  });

  fs.writeFileSync(filepath, content);
  console.log(`   ✅ Created ${filename}`);
}

function cleanEmailBody(body: string): string {
  // Remove HTML tags
  let cleaned = body.replace(/<[^>]*>/g, '');
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove email signatures (common patterns)
  cleaned = cleaned.split(/---+\s*$/m)[0];
  cleaned = cleaned.split(/^--\s*$/m)[0];
  
  // Trim
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Run the extraction
extractEmailExamples()
  .then(() => {
    console.log('✅ Extraction complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Extraction failed:', error);
    process.exit(1);
  });
