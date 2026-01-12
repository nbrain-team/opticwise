-- Marketing Automation Platform Migration
-- Adds comprehensive marketing automation tables integrated with existing CRM

-- ============================================
-- CAMPAIGNS
-- ============================================

CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "workflow" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "goalType" TEXT,
    "goalTarget" INTEGER,
    "ownerId" TEXT,
    "tags" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Campaign_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX "Campaign_ownerId_idx" ON "Campaign"("ownerId");
CREATE INDEX "Campaign_type_idx" ON "Campaign"("type");
CREATE INDEX "Campaign_startDate_idx" ON "Campaign"("startDate");

-- ============================================
-- CAMPAIGN LEADS
-- ============================================

CREATE TABLE "CampaignLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "personId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "currentNodeId" TEXT,
    "completedNodes" JSONB,
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "emailsOpened" INTEGER NOT NULL DEFAULT 0,
    "emailsClicked" INTEGER NOT NULL DEFAULT 0,
    "emailsReplied" INTEGER NOT NULL DEFAULT 0,
    "lastEngagement" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "convertedToDealId" TEXT,
    "source" TEXT,
    "sourceMetadata" JSONB,
    "customFields" JSONB,
    "unsubscribedAt" TIMESTAMP(3),
    "unsubscribeReason" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CampaignLead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CampaignLead_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CampaignLead_convertedToDealId_fkey" FOREIGN KEY ("convertedToDealId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "CampaignLead_campaignId_idx" ON "CampaignLead"("campaignId");
CREATE INDEX "CampaignLead_personId_idx" ON "CampaignLead"("personId");
CREATE INDEX "CampaignLead_email_idx" ON "CampaignLead"("email");
CREATE INDEX "CampaignLead_status_idx" ON "CampaignLead"("status");
CREATE INDEX "CampaignLead_leadScore_idx" ON "CampaignLead"("leadScore");
CREATE INDEX "CampaignLead_convertedToDealId_idx" ON "CampaignLead"("convertedToDealId");

-- ============================================
-- CAMPAIGN TOUCHPOINTS
-- ============================================

CREATE TABLE "CampaignTouchpoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "campaignId" TEXT,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "bounceReason" TEXT,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "openedAt" TIMESTAMP(3),
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "clickedAt" TIMESTAMP(3),
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "repliedAt" TIMESTAMP(3),
    "linksClicked" JSONB,
    "metadata" JSONB,
    CONSTRAINT "CampaignTouchpoint_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CampaignLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CampaignTouchpoint_leadId_idx" ON "CampaignTouchpoint"("leadId");
CREATE INDEX "CampaignTouchpoint_campaignId_idx" ON "CampaignTouchpoint"("campaignId");
CREATE INDEX "CampaignTouchpoint_type_idx" ON "CampaignTouchpoint"("type");
CREATE INDEX "CampaignTouchpoint_sentAt_idx" ON "CampaignTouchpoint"("sentAt");

-- ============================================
-- CAMPAIGN SEQUENCES
-- ============================================

CREATE TABLE "CampaignSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CampaignSequence_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "CampaignSequence_campaignId_idx" ON "CampaignSequence"("campaignId");
CREATE INDEX "CampaignSequence_type_idx" ON "CampaignSequence"("type");

-- ============================================
-- CAMPAIGN ANALYTICS
-- ============================================

CREATE TABLE "CampaignAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "leadsAdded" INTEGER NOT NULL DEFAULT 0,
    "leadsActive" INTEGER NOT NULL DEFAULT 0,
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "emailsDelivered" INTEGER NOT NULL DEFAULT 0,
    "emailsBounced" INTEGER NOT NULL DEFAULT 0,
    "emailsOpened" INTEGER NOT NULL DEFAULT 0,
    "emailsClicked" INTEGER NOT NULL DEFAULT 0,
    "emailsReplied" INTEGER NOT NULL DEFAULT 0,
    "smsSent" INTEGER NOT NULL DEFAULT 0,
    "smsDelivered" INTEGER NOT NULL DEFAULT 0,
    "smsReplied" INTEGER NOT NULL DEFAULT 0,
    "voicemailsSent" INTEGER NOT NULL DEFAULT 0,
    "voicemailsDelivered" INTEGER NOT NULL DEFAULT 0,
    "linkedinSent" INTEGER NOT NULL DEFAULT 0,
    "linkedinAccepted" INTEGER NOT NULL DEFAULT 0,
    "linkedinReplied" INTEGER NOT NULL DEFAULT 0,
    "qualified" INTEGER NOT NULL DEFAULT 0,
    "demosBooked" INTEGER NOT NULL DEFAULT 0,
    "auditsRequested" INTEGER NOT NULL DEFAULT 0,
    "dealsCreated" INTEGER NOT NULL DEFAULT 0,
    "avgLeadScore" DOUBLE PRECISION,
    "avgEngagementRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignAnalytics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CampaignAnalytics_campaignId_date_key" ON "CampaignAnalytics"("campaignId", "date");
CREATE INDEX "CampaignAnalytics_campaignId_idx" ON "CampaignAnalytics"("campaignId");
CREATE INDEX "CampaignAnalytics_date_idx" ON "CampaignAnalytics"("date");

-- ============================================
-- AUDIT REQUESTS (Interactive Audit Tool)
-- ============================================

CREATE TABLE "AuditRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "personId" TEXT,
    "organizationId" TEXT,
    "propertyType" TEXT,
    "propertySize" TEXT,
    "numberOfUnits" INTEGER,
    "independentSystems" INTEGER,
    "physicalNetworks" INTEGER,
    "currentVendors" TEXT,
    "painPoints" TEXT,
    "decisionMaker" BOOLEAN NOT NULL DEFAULT false,
    "budget" TEXT,
    "timeline" TEXT,
    "score" INTEGER DEFAULT 0,
    "qualification" TEXT DEFAULT 'new',
    "bookingUrl" TEXT,
    "bookingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "bookedAt" TIMESTAMP(3),
    "meetingScheduledFor" TIMESTAMP(3),
    "convertedToDealId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "source" TEXT,
    "campaignId" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "contactedAt" TIMESTAMP(3),
    "contactedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AuditRequest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditRequest_convertedToDealId_fkey" FOREIGN KEY ("convertedToDealId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AuditRequest_email_idx" ON "AuditRequest"("email");
CREATE INDEX "AuditRequest_personId_idx" ON "AuditRequest"("personId");
CREATE INDEX "AuditRequest_organizationId_idx" ON "AuditRequest"("organizationId");
CREATE INDEX "AuditRequest_status_idx" ON "AuditRequest"("status");
CREATE INDEX "AuditRequest_score_idx" ON "AuditRequest"("score");
CREATE INDEX "AuditRequest_convertedToDealId_idx" ON "AuditRequest"("convertedToDealId");
CREATE INDEX "AuditRequest_createdAt_idx" ON "AuditRequest"("createdAt");

-- ============================================
-- BOOK DISTRIBUTION
-- ============================================

CREATE TABLE "BookRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "personId" TEXT,
    "organizationId" TEXT,
    "type" TEXT NOT NULL,
    "format" TEXT,
    "shippingAddress" TEXT,
    "shippingCity" TEXT,
    "shippingState" TEXT,
    "shippingZip" TEXT,
    "shippingCountry" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "downloadedAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "shippedAt" TIMESTAMP(3),
    "trackingNumber" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "chaptersRead" JSONB,
    "timeSpentReading" INTEGER,
    "source" TEXT,
    "campaignId" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "convertedToDealId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookRequest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BookRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BookRequest_convertedToDealId_fkey" FOREIGN KEY ("convertedToDealId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "BookRequest_email_idx" ON "BookRequest"("email");
CREATE INDEX "BookRequest_personId_idx" ON "BookRequest"("personId");
CREATE INDEX "BookRequest_organizationId_idx" ON "BookRequest"("organizationId");
CREATE INDEX "BookRequest_status_idx" ON "BookRequest"("status");
CREATE INDEX "BookRequest_convertedToDealId_idx" ON "BookRequest"("convertedToDealId");
CREATE INDEX "BookRequest_createdAt_idx" ON "BookRequest"("createdAt");

-- ============================================
-- BOOK ENGAGEMENT
-- ============================================

CREATE TABLE "BookEngagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "chapter" TEXT,
    "page" INTEGER,
    "action" TEXT NOT NULL,
    "linkClicked" TEXT,
    "deviceType" TEXT,
    "location" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookEngagement_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BookRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "BookEngagement_requestId_idx" ON "BookEngagement"("requestId");
CREATE INDEX "BookEngagement_timestamp_idx" ON "BookEngagement"("timestamp");

-- ============================================
-- CONFERENCES
-- ============================================

CREATE TABLE "Conference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "venue" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "websiteUrl" TEXT,
    "registrationUrl" TEXT,
    "boothNumber" TEXT,
    "teamMembers" JSONB,
    "targetMeetings" INTEGER,
    "targetLeads" INTEGER,
    "booksToDistribute" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "preCampaignId" TEXT,
    "postCampaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "Conference_startDate_idx" ON "Conference"("startDate");
CREATE INDEX "Conference_status_idx" ON "Conference"("status");

-- ============================================
-- CONFERENCE ATTENDEES
-- ============================================

CREATE TABLE "ConferenceAttendee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conferenceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "linkedInUrl" TEXT,
    "personId" TEXT,
    "organizationId" TEXT,
    "metAtEvent" BOOLEAN NOT NULL DEFAULT false,
    "metBy" TEXT,
    "metAt" TIMESTAMP(3),
    "boothVisit" BOOLEAN NOT NULL DEFAULT false,
    "bookReceived" BOOLEAN NOT NULL DEFAULT false,
    "bookReceivedAt" TIMESTAMP(3),
    "meetingBooked" BOOLEAN NOT NULL DEFAULT false,
    "meetingBookedAt" TIMESTAMP(3),
    "meetingScheduledFor" TIMESTAMP(3),
    "followedUp" BOOLEAN NOT NULL DEFAULT false,
    "followedUpAt" TIMESTAMP(3),
    "convertedToDealId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "source" TEXT,
    "importedFrom" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "qualification" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConferenceAttendee_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConferenceAttendee_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ConferenceAttendee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ConferenceAttendee_convertedToDealId_fkey" FOREIGN KEY ("convertedToDealId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ConferenceAttendee_conferenceId_idx" ON "ConferenceAttendee"("conferenceId");
CREATE INDEX "ConferenceAttendee_email_idx" ON "ConferenceAttendee"("email");
CREATE INDEX "ConferenceAttendee_personId_idx" ON "ConferenceAttendee"("personId");
CREATE INDEX "ConferenceAttendee_organizationId_idx" ON "ConferenceAttendee"("organizationId");
CREATE INDEX "ConferenceAttendee_metAtEvent_idx" ON "ConferenceAttendee"("metAtEvent");
CREATE INDEX "ConferenceAttendee_convertedToDealId_idx" ON "ConferenceAttendee"("convertedToDealId");

-- ============================================
-- EMAIL TEMPLATES
-- ============================================

CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "variables" JSONB,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");
CREATE INDEX "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive");

-- ============================================
-- CHATBOT CONVERSATIONS
-- ============================================

CREATE TABLE "ChatbotConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitorId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "company" TEXT,
    "personId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isQualified" BOOLEAN NOT NULL DEFAULT false,
    "qualifiedAt" TIMESTAMP(3),
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "goalAchieved" TEXT,
    "convertedAt" TIMESTAMP(3),
    "convertedToDealId" TEXT,
    "pageUrl" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChatbotConversation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChatbotConversation_convertedToDealId_fkey" FOREIGN KEY ("convertedToDealId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ChatbotConversation_visitorId_idx" ON "ChatbotConversation"("visitorId");
CREATE INDEX "ChatbotConversation_email_idx" ON "ChatbotConversation"("email");
CREATE INDEX "ChatbotConversation_personId_idx" ON "ChatbotConversation"("personId");
CREATE INDEX "ChatbotConversation_status_idx" ON "ChatbotConversation"("status");
CREATE INDEX "ChatbotConversation_convertedToDealId_idx" ON "ChatbotConversation"("convertedToDealId");
CREATE INDEX "ChatbotConversation_startedAt_idx" ON "ChatbotConversation"("startedAt");

-- ============================================
-- CHATBOT MESSAGES
-- ============================================

CREATE TABLE "ChatbotMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intent" TEXT,
    "confidence" DOUBLE PRECISION,
    "extractedData" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatbotMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatbotConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ChatbotMessage_conversationId_idx" ON "ChatbotMessage"("conversationId");
CREATE INDEX "ChatbotMessage_timestamp_idx" ON "ChatbotMessage"("timestamp");

