/**
 * Sync Google Calendar events from the last 6 months
 * Vectorize and store in PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { getServiceAccountClient, getCalendarClient } from '../lib/google';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

async function syncCalendar() {
  console.log('Starting Calendar sync...');
  
  try {
    const auth = getServiceAccountClient();
    const calendar = await getCalendarClient(auth);
    
    // Get events from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    console.log(`Fetching events from ${sixMonthsAgo.toISOString()}...`);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: sixMonthsAgo.toISOString(),
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const events = response.data.items || [];
    console.log(`Found ${events.length} events to sync`);
    
    let synced = 0;
    let skipped = 0;
    
    for (const event of events) {
      if (!event.id) continue;
      
      // Check if already synced
      const existing = await prisma.calendarEvent.findUnique({
        where: { googleEventId: event.id },
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Extract attendees
      const attendees = event.attendees?.map(a => ({
        email: a.email,
        name: a.displayName,
        responseStatus: a.responseStatus,
        organizer: a.organizer || false,
      })) || [];
      
      // Extract times
      const startTime = event.start?.dateTime 
        ? new Date(event.start.dateTime)
        : event.start?.date 
          ? new Date(event.start.date)
          : new Date();
          
      const endTime = event.end?.dateTime
        ? new Date(event.end.dateTime)
        : event.end?.date
          ? new Date(event.end.date)
          : new Date(startTime.getTime() + 3600000); // +1 hour default
      
      const allDay = !event.start?.dateTime && !!event.start?.date;
      
      // Generate embedding for vectorization
      const attendeesList = attendees.map(a => a.name || a.email).join(', ');
      const textForEmbedding = `
        Event: ${event.summary || 'No title'}
        Description: ${event.description || ''}
        Location: ${event.location || ''}
        Attendees: ${attendeesList}
        Time: ${startTime.toLocaleDateString()} ${startTime.toLocaleTimeString()}
      `.trim().slice(0, 8000);
      
      const embedding = await generateEmbedding(textForEmbedding);
      
      // Extract meeting link
      let meetingLink = event.hangoutLink || null;
      if (!meetingLink && event.conferenceData?.entryPoints) {
        const videoEntry = event.conferenceData.entryPoints.find(
          (e: any) => e.entryPointType === 'video'
        );
        meetingLink = videoEntry?.uri || null;
      }
      
      // Save to database
      await prisma.calendarEvent.create({
        data: {
          googleEventId: event.id,
          summary: event.summary || 'No title',
          description: event.description || null,
          location: event.location || null,
          startTime,
          endTime,
          timezone: event.start?.timeZone || null,
          allDay,
          organizer: event.organizer?.email || null,
          attendees: attendees,
          meetingLink,
          conferenceData: event.conferenceData || null,
          status: event.status || null,
          visibility: event.visibility || null,
          vectorized: true,
          embedding: `[${embedding.join(',')}]`,
        },
      });
      
      synced++;
      
      if (synced % 25 === 0) {
        console.log(`Synced ${synced}/${events.length} events...`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`\nCalendar sync complete:`);
    console.log(`- Synced: ${synced} new events`);
    console.log(`- Skipped: ${skipped} existing events`);
    console.log(`- Total: ${events.length} events processed`);
    
  } catch (error) {
    console.error('Error syncing Calendar:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncCalendar().catch(console.error);

