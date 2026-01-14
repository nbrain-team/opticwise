// Campaign types for marketing automation

export type CampaignLead = {
  id: string;
  campaignId: string;
  personId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  status: string;
  leadScore: number;
  currentNodeId: string | null;
  completedNodes: unknown;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  lastEngagement: Date | null;
  convertedAt: Date | null;
  convertedToDealId: string | null;
  source: string | null;
  sourceMetadata: unknown;
  customFields: unknown;
  unsubscribedAt: Date | null;
  unsubscribeReason: string | null;
  enrolledAt: Date;
  updatedAt: Date;
  person?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    organization?: {
      id: string;
      name: string;
    } | null;
  } | null;
  convertedToDeal?: {
    id: string;
    title: string;
    value: number;
  } | null;
};

export type CampaignAnalytics = {
  id: string;
  campaignId: string;
  date: Date;
  leadsAdded: number;
  leadsActive: number;
  emailsSent: number;
  emailsDelivered: number;
  emailsBounced: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  smsSent: number;
  smsDelivered: number;
  smsReplied: number;
  voicemailsSent: number;
  voicemailsDelivered: number;
  linkedinSent: number;
  linkedinAccepted: number;
  linkedinReplied: number;
  qualified: number;
  demosBooked: number;
  auditsRequested: number;
  dealsCreated: number;
  avgLeadScore: number | null;
  avgEngagementRate: number | null;
  createdAt: Date;
};

export type CampaignSequence = {
  id: string;
  campaignId: string | null;
  name: string;
  description: string | null;
  type: string;
  steps: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Campaign = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  workflow: unknown;
  startDate: Date | null;
  endDate: Date | null;
  goalType: string | null;
  goalTarget: number | null;
  ownerId: string | null;
  tags: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  leads: CampaignLead[];
  sequences: CampaignSequence[];
  analytics: CampaignAnalytics[];
  _count?: {
    leads: number;
  };
};



