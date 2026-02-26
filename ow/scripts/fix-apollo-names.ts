/**
 * Fix missing first/last names in Apollo export by extracting from email addresses.
 * 
 * Reads Apollo CSV, finds contacts with missing first/last name,
 * attempts to derive names from email addresses, outputs fixed CSV.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const inputPath = '/Users/dannydemichele/Downloads/apollo-contacts-export (29).csv';
const outputPath = path.join(process.cwd(), 'apollo-contacts-fixed.csv');

function guessNameFromEmail(email: string): { firstName: string; lastName: string } | null {
  if (!email || !email.includes('@')) return null;

  const localPart = email.split('@')[0].toLowerCase();
  const domain = email.split('@')[1]?.toLowerCase() || '';

  // Skip junk/system emails
  if (['info', 'support', 'admin', 'hello', 'contact', 'sales', 'team', 'hr', 'billing',
       'accounting', 'purchasing', 'office', 'careers', 'newsletter', 'notifications',
       'campusinvoices', 'ipadmin', 'securitylicense'].includes(localPart)) {
    return null;
  }

  // Skip long hashes/tokens
  if (localPart.length > 30) return null;
  if (/^[a-f0-9]{10,}/.test(localPart)) return null;
  if (localPart.includes('=')) return null;
  if (domain.includes('hubspot') || domain.includes('salesforce')) return null;

  // Pattern: firstname.lastname or firstname_lastname or firstname-lastname
  const parts = localPart.split(/[._-]/).filter(p => p.length > 0 && !/^\d+$/.test(p));

  if (parts.length >= 2) {
    let first = parts[0].replace(/\d+$/, '');
    let last = parts[parts.length - 1].replace(/\d+$/, '');

    if (!first || !last) return null;

    return {
      firstName: capitalize(first),
      lastName: capitalize(last),
    };
  }

    // Single word - try to split common patterns
    if (parts.length === 1) {
      const clean = parts[0].replace(/\d+$/, '');
      if (clean.length < 2) return null;

      // Check for camelCase: "johnSmith"
      const camelMatch = clean.match(/^([a-z]+?)([A-Z][a-z]+)$/);
      if (camelMatch) {
        return { firstName: capitalize(camelMatch[1]), lastName: capitalize(camelMatch[2]) };
      }

      // Common first names - if the email is a known first name, just use it
      const commonNames = [
        'andre', 'art', 'beth', 'bill', 'bob', 'brad', 'brian', 'bruce', 'carl', 'chad',
        'chris', 'dan', 'dave', 'dean', 'drew', 'eric', 'frank', 'gary', 'greg', 'jack',
        'jake', 'james', 'jason', 'jeff', 'jim', 'joe', 'john', 'jon', 'josh', 'keith',
        'ken', 'kevin', 'kyle', 'lane', 'larry', 'lee', 'luke', 'mark', 'matt', 'max',
        'mike', 'neil', 'nick', 'pat', 'paul', 'pete', 'phil', 'ray', 'rich', 'rick',
        'rob', 'ron', 'ross', 'ryan', 'sam', 'scott', 'sean', 'seth', 'steve', 'ted',
        'tim', 'todd', 'tom', 'tony', 'troy', 'wade', 'walt', 'zach',
        'amy', 'ann', 'anna', 'anne', 'beth', 'cara', 'carol', 'dani', 'dawn', 'elle',
        'emma', 'fiona', 'gail', 'gwen', 'hope', 'jade', 'jane', 'jean', 'jill', 'joan',
        'joy', 'judy', 'julie', 'june', 'kate', 'kay', 'kim', 'lana', 'laura', 'leah',
        'lily', 'lisa', 'liz', 'lynn', 'mary', 'megan', 'nina', 'nora', 'pam', 'pat',
        'rose', 'ruth', 'sara', 'sue', 'tara', 'tina', 'val', 'wendy', 'zoe',
        'aaron', 'adam', 'alan', 'alex', 'allen', 'angel', 'barry', 'blake', 'brett',
        'bryan', 'casey', 'chase', 'clark', 'cliff', 'colin', 'craig', 'darren', 'derek',
        'devon', 'diego', 'dylan', 'eddie', 'ethan', 'evan', 'felix', 'floyd', 'grant',
        'heath', 'henry', 'homer', 'hugo', 'isaac', 'ivan', 'jerry', 'jesse', 'jimmy',
        'joel', 'jordan', 'lance', 'lewis', 'logan', 'lucas', 'marco', 'mario', 'mason',
        'miles', 'mitch', 'nolan', 'omar', 'oscar', 'owen', 'percy', 'peter', 'quinn',
        'ralph', 'roger', 'roman', 'ruben', 'russell', 'simon', 'spencer', 'stuart',
        'terry', 'tyler', 'vince', 'wayne', 'wyatt',
        'alice', 'amber', 'april', 'becky', 'bonnie', 'chloe', 'cindy', 'clara',
        'daisy', 'diana', 'donna', 'elena', 'emily', 'erica', 'faith', 'grace', 'haley',
        'hannah', 'heidi', 'helen', 'holly', 'irene', 'janet', 'jenny', 'joanna', 'karen',
        'kathy', 'katie', 'kelly', 'kerry', 'kristen', 'linda', 'lori', 'lucia', 'mandy',
        'maria', 'megan', 'mia', 'molly', 'nancy', 'natalie', 'nicole', 'olive', 'paige',
        'penny', 'petra', 'rachel', 'renee', 'robin', 'rosa', 'sally', 'sandy', 'sarah',
        'shea', 'stella', 'susan', 'tammy', 'tanya', 'tracy', 'vera', 'wendy',
        'peyton', 'kit', 'lee', 'riley', 'dakota', 'parker', 'rowan',
      ];

      if (commonNames.includes(clean)) {
        return { firstName: capitalize(clean), lastName: '' };
      }

      // Known first-name patterns embedded in longer strings
      // e.g., jeffjones → Jeff Jones, samhowarth → Sam Howarth
      const knownFirstsInCombo = [
        'jeff', 'sam', 'dan', 'tom', 'ben', 'tim', 'rob', 'bob', 'jim', 'joe',
        'ray', 'ron', 'ken', 'ted', 'don', 'max', 'jay', 'pat', 'lee', 'dj',
        'ed', 'al', 'mj', 'tj', 'jp', 'cj', 'aj', 'bj', 'rj', 'jd',
        'mike', 'dave', 'matt', 'mark', 'john', 'ryan', 'adam', 'nick', 'eric',
        'greg', 'chad', 'sean', 'paul', 'jake', 'luke', 'alex', 'tony', 'pete',
        'kyle', 'brad', 'josh', 'rick', 'rich', 'drew', 'gary', 'alan', 'carl',
        'mary', 'lisa', 'kate', 'jane', 'anne', 'sara', 'emma', 'lori', 'amy',
        'kim', 'sue', 'pam', 'val', 'joy', 'liz', 'ann', 'mia', 'eva',
        'frank', 'brian', 'chris', 'steve', 'scott', 'kevin', 'bruce', 'barry',
        'jerry', 'roger', 'ralph', 'larry', 'terry', 'harry', 'wayne', 'lloyd',
        'sally', 'nancy', 'sandy', 'diana', 'carol', 'helen', 'wendy', 'tammy',
        'sarah', 'julie', 'karen', 'laura', 'donna', 'linda', 'jenny', 'holly',
      ];

      for (const prefix of knownFirstsInCombo.sort((a, b) => b.length - a.length)) {
        if (clean.startsWith(prefix) && clean.length > prefix.length + 2) {
          const rest = clean.slice(prefix.length);
          if (rest.length >= 3 && /^[a-z]+$/.test(rest)) {
            return { firstName: capitalize(prefix), lastName: capitalize(rest) };
          }
        }
      }

      // Pattern: single initial + lastname (e.g., bgoldstein → B Goldstein)
      if (clean.length >= 7) {
        const initialMatch = clean.match(/^([a-z])([a-z]{6,})$/);
        if (initialMatch) {
          return { firstName: initialMatch[1].toUpperCase(), lastName: capitalize(initialMatch[2]) };
        }
      }

      // Two-char initial + lastname (e.g., djsimpson → DJ Simpson)
      if (clean.length >= 8) {
        const twoInitialMatch = clean.match(/^([a-z]{2})([a-z]{6,})$/);
        if (twoInitialMatch) {
          return { firstName: twoInitialMatch[1].toUpperCase(), lastName: capitalize(twoInitialMatch[2]) };
        }
      }

      // Fallback: just use as first name if reasonable length
      if (clean.length >= 2 && clean.length <= 12) {
        return { firstName: capitalize(clean), lastName: '' };
      }
    }

  return null;
}

function capitalize(str: string): string {
  if (!str) return '';
  // Handle initials (single letter)
  if (str.length === 1) return str.toUpperCase();
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function main() {
  console.log('\n📧 FIXING APOLLO NAMES FROM EMAIL ADDRESSES');
  console.log('='.repeat(60));

  const csvContent = fs.readFileSync(inputPath, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, relax_column_count: true });

  console.log(`📄 Read ${records.length} contacts from Apollo export`);

  let missingBoth = 0;
  let missingFirst = 0;
  let missingLast = 0;
  let fixed = 0;
  let couldNotFix = 0;

  for (const record of records) {
    const hasFirst = record['First Name']?.trim();
    const hasLast = record['Last Name']?.trim();
    const email = record['Email']?.trim();

    if (hasFirst && hasLast) continue;

    if (!hasFirst && !hasLast) missingBoth++;
    else if (!hasFirst) missingFirst++;
    else missingLast++;

    const guessed = guessNameFromEmail(email);

    if (guessed) {
      if (!hasFirst && guessed.firstName) {
        record['First Name'] = guessed.firstName;
      }
      if (!hasLast && guessed.lastName) {
        record['Last Name'] = guessed.lastName;
      }
      fixed++;
    } else {
      couldNotFix++;
    }
  }

  // Write output CSV
  const headers = Object.keys(records[0]);
  const csvLines = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')];

  for (const record of records) {
    const row = headers.map(h => {
      const val = record[h] || '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvLines.push(row.join(','));
  }

  fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');

  // Show what was fixed
  console.log('\n📊 RESULTS:');
  console.log(`   Missing both names: ${missingBoth}`);
  console.log(`   Missing first name only: ${missingFirst}`);
  console.log(`   Missing last name only: ${missingLast}`);
  console.log(`   Total needing fix: ${missingBoth + missingFirst + missingLast}`);
  console.log(`   ✅ Fixed: ${fixed}`);
  console.log(`   ❌ Could not fix: ${couldNotFix}`);

  // Show samples of fixes
  console.log('\n✅ Sample fixes:');
  let shown = 0;
  for (const record of records) {
    const email = record['Email']?.trim();
    const guessed = guessNameFromEmail(email);
    if (guessed && (guessed.firstName || guessed.lastName) && shown < 20) {
      console.log(`   ${email} → ${guessed.firstName} ${guessed.lastName}`);
      shown++;
    }
  }

  console.log(`\n📄 Fixed CSV: ${outputPath}`);
  console.log('='.repeat(60) + '\n');
}

main();
