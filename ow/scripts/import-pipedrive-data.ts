import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// ID mapping storage
const orgIdMap = new Map<number, string>(); // Pipedrive ID → DB ID
const personIdMap = new Map<number, string>(); // Pipedrive ID → DB ID
const personNameMap = new Map<string, string>(); // Person Name → DB ID

// Import statistics
const stats = {
  organizations: { total: 0, success: 0, failed: 0, skipped: 0 },
  people: { total: 0, success: 0, failed: 0, skipped: 0 },
  deals: { total: 0, success: 0, failed: 0, skipped: 0 },
};

const errors: Array<{ type: string; row: number; error: string; data?: any }> = [];

// Helper functions
function parseDate(dateStr: any): Date | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function parseDecimal(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

function cleanString(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim();
}

function mapStatus(status: string): 'open' | 'won' | 'lost' | 'deleted' {
  const normalized = status.toLowerCase();
  if (normalized === 'won') return 'won';
  if (normalized === 'lost') return 'lost';
  if (normalized === 'deleted') return 'deleted';
  return 'open';
}

async function getOrCreateUser(email: string, name: string) {
  let user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log(`Creating user: ${name} (${email})`);
    user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: 'placeholder_hash', // Will need to be reset
      },
    });
  }
  
  return user;
}

async function getOrCreatePipeline(name: string) {
  let pipeline = await prisma.pipeline.findUnique({ where: { name } });
  
  if (!pipeline) {
    console.log(`Creating pipeline: ${name}`);
    pipeline = await prisma.pipeline.create({
      data: { name },
    });
  }
  
  return pipeline;
}

async function getOrCreateStage(name: string, pipelineId: string, orderIndex: number) {
  let stage = await prisma.stage.findUnique({
    where: {
      pipelineId_name: {
        pipelineId,
        name,
      },
    },
  });
  
  if (!stage) {
    console.log(`Creating stage: ${name} (order: ${orderIndex})`);
    stage = await prisma.stage.create({
      data: {
        name,
        pipelineId,
        orderIndex,
      },
    });
  }
  
  return stage;
}

async function importOrganizations() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 IMPORTING ORGANIZATIONS');
  console.log('='.repeat(80) + '\n');

  const filePath = path.join(__dirname, '../../organizations-2029418-76.xlsx');
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: any[] = XLSX.utils.sheet_to_json(worksheet);

  stats.organizations.total = data.length;
  console.log(`Total organizations to import: ${data.length}\n`);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const pipedriveId = row['ID'];

    try {
      const orgData = {
        name: cleanString(row['Name']) || `Organization ${pipedriveId}`,
        address: cleanString(row['Address']),
        websiteUrl: cleanString(row['Website']),
        linkedInProfile: cleanString(row['LinkedIn profile']),
        labels: cleanString(row['Labels']),
        
        // Detailed address fields
        streetAddress: cleanString(row['Street/road name of Address']),
        houseNumber: cleanString(row['House number of Address']),
        apartmentSuite: cleanString(row['Apartment/suite no of Address']),
        district: cleanString(row['District/sublocality of Address']),
        city: cleanString(row['City/town/village/locality of Address']),
        state: cleanString(row['State/county of Address']),
        region: cleanString(row['Region of Address']),
        country: cleanString(row['Country of Address']),
        zipCode: cleanString(row['ZIP/Postal code of Address']),
        fullAddress: cleanString(row['Full/combined address of Address']),
        
        // Activity tracking
        openDeals: row['Open deals'] || 0,
        wonDeals: row['Won deals'] || 0,
        lostDeals: row['Lost deals'] || 0,
        closedDeals: row['Closed deals'] || 0,
        totalActivities: row['Total activities'] || 0,
        doneActivities: row['Done activities'] || 0,
        activitiesToDo: row['Activities to do'] || 0,
        emailMessagesCount: row['Email messages count'] || 0,
        nextActivityDate: parseDate(row['Next activity date']),
        lastActivityDate: parseDate(row['Last activity date']),
        
        // Timestamps
        createdAt: parseDate(row['Organization created']) || new Date(),
        updatedAt: parseDate(row['Update time']) || new Date(),
      };

      // Handle duplicate names
      let finalName = orgData.name;
      let counter = 1;
      while (await prisma.organization.findUnique({ where: { name: finalName } })) {
        finalName = `${orgData.name} (${counter})`;
        counter++;
      }
      orgData.name = finalName;

      const organization = await prisma.organization.create({ data: orgData });
      orgIdMap.set(pipedriveId, organization.id);
      
      stats.organizations.success++;
      
      if ((i + 1) % 500 === 0) {
        console.log(`Progress: ${i + 1}/${data.length} organizations imported...`);
      }
    } catch (error: any) {
      stats.organizations.failed++;
      errors.push({
        type: 'organization',
        row: i + 1,
        error: error.message,
        data: { name: row['Name'], id: pipedriveId },
      });
      console.error(`❌ Error importing organization row ${i + 1}: ${error.message}`);
    }
  }

  console.log(`\n✅ Organizations imported: ${stats.organizations.success}/${stats.organizations.total}`);
  console.log(`❌ Failed: ${stats.organizations.failed}\n`);
}

async function importPeople() {
  console.log('\n' + '='.repeat(80));
  console.log('👥 IMPORTING PEOPLE');
  console.log('='.repeat(80) + '\n');

  const filePath = path.join(__dirname, '../../people-2029418-77.xlsx');
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: any[] = XLSX.utils.sheet_to_json(worksheet);

  stats.people.total = data.length;
  console.log(`Total people to import: ${data.length}\n`);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const pipedriveId = row['ID'];

    try {
      // Get organization ID from mapping
      const pipedriveOrgId = row['Organization ID'];
      const organizationId = pipedriveOrgId ? orgIdMap.get(pipedriveOrgId) : null;

      // Handle email - use work email as primary
      let email = cleanString(row['Email - Work']);
      
      // If no work email, try other emails
      if (!email) {
        email = cleanString(row['Email - Other']) || cleanString(row['Email - Home']);
      }
      
      // If still no email, generate a placeholder
      if (!email) {
        email = `person_${pipedriveId}_noemail@placeholder.local`;
      }

      // Check for duplicate email
      const existingPerson = await prisma.person.findUnique({ where: { email } });
      if (existingPerson) {
        // Skip or use alternate email
        email = `person_${pipedriveId}_${Date.now()}@placeholder.local`;
      }

      const personData = {
        name: cleanString(row['Name']) || `${row['First name'] || ''} ${row['Last name'] || ''}`.trim(),
        firstName: cleanString(row['First name']) || 'Unknown',
        lastName: cleanString(row['Last name']) || '',
        email,
        phoneWork: cleanString(row['Phone - Work']),
        phoneHome: cleanString(row['Phone - Home']),
        phoneMobile: cleanString(row['Phone - Mobile']),
        phoneOther: cleanString(row['Phone - Other']),
        emailWork: cleanString(row['Email - Work']),
        emailHome: cleanString(row['Email - Home']),
        emailOther: cleanString(row['Email - Other']),
        title: cleanString(row['Job title']),
        labels: cleanString(row['Labels']),
        contactType: cleanString(row['Contact Type']),
        organizationId: organizationId || null,
        
        // Address fields
        postalAddress: cleanString(row['Postal address']),
        streetAddress: cleanString(row['Street/road name of Postal address']),
        houseNumber: cleanString(row['House number of Postal address']),
        apartmentSuite: cleanString(row['Apartment/suite no of Postal address']),
        city: cleanString(row['City/town/village/locality of Postal address']),
        state: cleanString(row['State/county of Postal address']),
        region: cleanString(row['Region of Postal address']),
        country: cleanString(row['Country of Postal address']),
        zipCode: cleanString(row['ZIP/Postal code of Postal address']),
        
        // Personal info
        birthday: parseDate(row['Birthday']),
        notes: cleanString(row['Notes']),
        linkedInProfile: cleanString(row['LinkedIn profile']),
        qwilrProposal: cleanString(row['Qwilr Proposal']),
        classification: cleanString(row['Classification']),
        instantMessenger: cleanString(row['Instant messenger']),
        
        // Activity tracking
        openDeals: row['Open deals'] || 0,
        wonDeals: row['Won deals'] || 0,
        lostDeals: row['Lost deals'] || 0,
        closedDeals: row['Closed deals'] || 0,
        totalActivities: row['Total activities'] || 0,
        doneActivities: row['Done activities'] || 0,
        activitiesToDo: row['Activities to do'] || 0,
        emailMessagesCount: row['Email messages count'] || 0,
        nextActivityDate: parseDate(row['Next activity date']),
        lastActivityDate: parseDate(row['Last activity date']),
        lastEmailReceived: parseDate(row['Last email received']),
        lastEmailSent: parseDate(row['Last email sent']),
        
        // Timestamps
        createdAt: parseDate(row['Person created']) || new Date(),
        updatedAt: parseDate(row['Update time']) || new Date(),
      };

      const person = await prisma.person.create({ data: personData });
      personIdMap.set(pipedriveId, person.id);
      
      // Also store by name for deal lookup
      if (personData.name) {
        personNameMap.set(personData.name.toLowerCase().trim(), person.id);
      }
      
      stats.people.success++;
      
      if ((i + 1) % 1000 === 0) {
        console.log(`Progress: ${i + 1}/${data.length} people imported...`);
      }
    } catch (error: any) {
      stats.people.failed++;
      errors.push({
        type: 'person',
        row: i + 1,
        error: error.message,
        data: { name: row['Name'], id: pipedriveId },
      });
      console.error(`❌ Error importing person row ${i + 1}: ${error.message}`);
    }
  }

  console.log(`\n✅ People imported: ${stats.people.success}/${stats.people.total}`);
  console.log(`❌ Failed: ${stats.people.failed}\n`);
}

async function importDeals() {
  console.log('\n' + '='.repeat(80));
  console.log('💼 IMPORTING DEALS');
  console.log('='.repeat(80) + '\n');

  const filePath = path.join(__dirname, '../../deals-2029418-75.xlsx');
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: any[] = XLSX.utils.sheet_to_json(worksheet);

  stats.deals.total = data.length;
  console.log(`Total deals to import: ${data.length}\n`);

  // Get or create default user
  const defaultUser = await getOrCreateUser('bill@opticwise.com', 'Bill Douglas');
  
  // Get or create pipeline
  const pipeline = await getOrCreatePipeline('Sales Pipeline');
  
  // Get all unique stages and create them
  const uniqueStages = [...new Set(data.map(row => row['Stage']).filter(Boolean))];
  console.log(`Creating ${uniqueStages.length} unique stages...\n`);
  
  const stageMap = new Map<string, string>();
  for (let i = 0; i < uniqueStages.length; i++) {
    const stageName = uniqueStages[i];
    const stage = await getOrCreateStage(stageName, pipeline.id, i);
    stageMap.set(stageName, stage.id);
  }

  console.log(`\nImporting deals...\n`);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const pipedriveId = row['ID'];

    try {
      // Get organization ID from mapping
      const pipedriveOrgId = row['Organization ID'];
      const organizationId = pipedriveOrgId ? orgIdMap.get(pipedriveOrgId) : null;

      // Get person ID by name lookup
      const contactPersonName = cleanString(row['Contact person']);
      let personId: string | null = null;
      if (contactPersonName) {
        personId = personNameMap.get(contactPersonName.toLowerCase().trim()) || null;
      }

      // Get stage ID
      const stageName = row['Stage'];
      const stageId = stageMap.get(stageName);
      
      if (!stageId) {
        throw new Error(`Stage not found: ${stageName}`);
      }

      const dealData = {
        title: cleanString(row['Title']) || `Deal ${pipedriveId}`,
        value: parseDecimal(row['Value']),
        currency: cleanString(row['Currency of Value']) || 'USD',
        status: mapStatus(row['Status']),
        expectedCloseDate: parseDate(row['Expected close date']),
        wonTime: parseDate(row['Won time']),
        lostTime: parseDate(row['Lost time']),
        lostReason: cleanString(row['Lost reason']),
        label: cleanString(row['Label']),
        
        // Activity tracking
        nextActivityDate: parseDate(row['Next activity date']),
        lastActivityDate: parseDate(row['Last activity date']),
        totalActivities: row['Total activities'] || 0,
        doneActivities: row['Done activities'] || 0,
        activitiesToDo: row['Activities to do'] || 0,
        emailMessagesCount: row['Email messages count'] || 0,
        lastEmailReceived: parseDate(row['Last email received']),
        lastEmailSent: parseDate(row['Last email sent']),
        
        // Products
        productName: cleanString(row['Product name']),
        
        // Source tracking
        sourceOrigin: cleanString(row['Source origin']),
        sourceOriginId: cleanString(row['Source origin ID']),
        sourceChannel: cleanString(row['Source channel']),
        sourceChannelId: cleanString(row['Source channel ID']),
        
        // Custom Opticwise fields
        goLiveTarget: cleanString(row['Go-Live Target']),
        propertyAddress: cleanString(row['Property Address']),
        propertyType: cleanString(row['Property Type']),
        qty: cleanString(row['Qty (clarify; units, beds, sqft)']),
        arrForecast: parseDecimal(row['ARR forecast']),
        arrForecastCurrency: cleanString(row['Currency of ARR forecast']),
        capexRom: parseDecimal(row['CapEx ROM:']),
        capexRomCurrency: cleanString(row['Currency of CapEx ROM:']),
        roiNoiBomSheet: cleanString(row['ROI/NOI/BOM sheet']),
        printsPlansExternal: cleanString(row['Prints/Plans External link']),
        printsPlansDropbox: cleanString(row['Prints/Plans OW DropBox Link']),
        leadSource: cleanString(row['Lead Source']),
        technicalPOC: cleanString(row['Technical POC']),
        icpSegment: cleanString(row['ICP Segment']),
        leadSourcePPP: cleanString(row['Lead Source PPP']),
        readinessScore: cleanString(row['Readiness Score']),
        ddiAuditStatus: cleanString(row['DDI Audit Status']),
        auditValue: parseDecimal(row['Audit Value']),
        auditValueCurrency: cleanString(row['Currency of Audit Value']),
        arrExpansionPotential: parseDecimal(row['ARR Expansion Potential']),
        arrExpansionCurrency: cleanString(row['Currency of ARR Expansion Potential']),
        
        // Timestamps
        addTime: parseDate(row['Deal created']) || new Date(),
        updateTime: parseDate(row['Update time']) || new Date(),
        stageChangeTime: parseDate(row['Last stage change']) || new Date(),
        
        // Required relationships
        pipelineId: pipeline.id,
        stageId,
        organizationId: organizationId || null,
        personId: personId || null,
        ownerId: defaultUser.id,
      };

      await prisma.deal.create({ data: dealData });
      
      stats.deals.success++;
      
      if ((i + 1) % 50 === 0) {
        console.log(`Progress: ${i + 1}/${data.length} deals imported...`);
      }
    } catch (error: any) {
      stats.deals.failed++;
      errors.push({
        type: 'deal',
        row: i + 1,
        error: error.message,
        data: { title: row['Title'], id: pipedriveId },
      });
      console.error(`❌ Error importing deal row ${i + 1}: ${error.message}`);
    }
  }

  console.log(`\n✅ Deals imported: ${stats.deals.success}/${stats.deals.total}`);
  console.log(`❌ Failed: ${stats.deals.failed}\n`);
}

async function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 IMPORT SUMMARY REPORT');
  console.log('='.repeat(80) + '\n');

  console.log('ORGANIZATIONS:');
  console.log(`  Total: ${stats.organizations.total}`);
  console.log(`  ✅ Success: ${stats.organizations.success}`);
  console.log(`  ❌ Failed: ${stats.organizations.failed}`);
  console.log(`  ⏭️  Skipped: ${stats.organizations.skipped}\n`);

  console.log('PEOPLE:');
  console.log(`  Total: ${stats.people.total}`);
  console.log(`  ✅ Success: ${stats.people.success}`);
  console.log(`  ❌ Failed: ${stats.people.failed}`);
  console.log(`  ⏭️  Skipped: ${stats.people.skipped}\n`);

  console.log('DEALS:');
  console.log(`  Total: ${stats.deals.total}`);
  console.log(`  ✅ Success: ${stats.deals.success}`);
  console.log(`  ❌ Failed: ${stats.deals.failed}`);
  console.log(`  ⏭️  Skipped: ${stats.deals.skipped}\n`);

  const totalSuccess = stats.organizations.success + stats.people.success + stats.deals.success;
  const totalFailed = stats.organizations.failed + stats.people.failed + stats.deals.failed;
  const totalRecords = stats.organizations.total + stats.people.total + stats.deals.total;

  console.log('OVERALL:');
  console.log(`  Total records: ${totalRecords}`);
  console.log(`  ✅ Successfully imported: ${totalSuccess}`);
  console.log(`  ❌ Failed: ${totalFailed}`);
  console.log(`  Success rate: ${((totalSuccess / totalRecords) * 100).toFixed(2)}%\n`);

  if (errors.length > 0) {
    console.log(`\n⚠️  ERRORS (showing first 20):\n`);
    errors.slice(0, 20).forEach((err, idx) => {
      console.log(`${idx + 1}. [${err.type.toUpperCase()}] Row ${err.row}: ${err.error}`);
      if (err.data) {
        console.log(`   Data: ${JSON.stringify(err.data)}`);
      }
    });
    
    if (errors.length > 20) {
      console.log(`\n... and ${errors.length - 20} more errors\n`);
    }
  }

  // Verify relationships
  console.log('\n' + '='.repeat(80));
  console.log('🔗 RELATIONSHIP VERIFICATION');
  console.log('='.repeat(80) + '\n');

  const peopleWithOrgs = await prisma.person.count({
    where: { organizationId: { not: null } },
  });
  
  const dealsWithOrgs = await prisma.deal.count({
    where: { organizationId: { not: null } },
  });
  
  const dealsWithPeople = await prisma.deal.count({
    where: { personId: { not: null } },
  });

  console.log(`People linked to organizations: ${peopleWithOrgs}/${stats.people.success}`);
  console.log(`Deals linked to organizations: ${dealsWithOrgs}/${stats.deals.success}`);
  console.log(`Deals linked to people: ${dealsWithPeople}/${stats.deals.success}\n`);
}

async function main() {
  console.log('\n' + '█'.repeat(80));
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█' + '  PIPEDRIVE DATA IMPORT - OpticWise Platform'.padEnd(79) + '█');
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█'.repeat(80) + '\n');

  try {
    await importOrganizations();
    await importPeople();
    await importDeals();
    await generateReport();

    console.log('\n' + '█'.repeat(80));
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█' + '  ✅ IMPORT COMPLETE!'.padEnd(79) + '█');
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█'.repeat(80) + '\n');
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

