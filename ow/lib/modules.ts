export type ModuleKey =
  | "deals"
  | "contacts"
  | "organizations"
  | "sales-inbox"
  | "ownet-agent"
  | "cs-agent"
  | "social"
  | "meeting-transcripts"
  | "conferences"
  | "campaigns"
  | "forms"
  | "blog"
  | "content-engine"
  | "knowledge-base"
  | "audit-tool";

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  description: string;
  routePrefixes: string[];
}

export const ALL_MODULES: ModuleDefinition[] = [
  {
    key: "deals",
    label: "Deals",
    description: "CRM deal pipeline and management",
    routePrefixes: ["/deals", "/deal/"],
  },
  {
    key: "contacts",
    label: "Contacts",
    description: "People and contact management",
    routePrefixes: ["/contacts", "/person/"],
  },
  {
    key: "organizations",
    label: "Organizations",
    description: "Company and organization records",
    routePrefixes: ["/organizations", "/organization/"],
  },
  {
    key: "sales-inbox",
    label: "Sales Inbox",
    description: "Email inbox and communication tracking",
    routePrefixes: ["/sales-inbox"],
  },
  {
    key: "ownet-agent",
    label: "OWnet Agent",
    description: "AI assistant for sales and CRM",
    routePrefixes: ["/ownet-agent"],
  },
  {
    key: "cs-agent",
    label: "CS Agent",
    description: "Customer support AI assistant",
    routePrefixes: ["/support-agent"],
  },
  {
    key: "social",
    label: "Social",
    description: "Social media posting and management",
    routePrefixes: ["/social"],
  },
  {
    key: "meeting-transcripts",
    label: "Transcripts",
    description: "Meeting recordings and transcripts",
    routePrefixes: ["/meeting-transcripts"],
  },
  {
    key: "conferences",
    label: "Conferences",
    description: "Conference and event management",
    routePrefixes: ["/conferences"],
  },
  {
    key: "campaigns",
    label: "Campaigns",
    description: "Marketing campaigns and sequences",
    routePrefixes: ["/campaigns"],
  },
  {
    key: "forms",
    label: "Forms",
    description: "Website forms and lead capture",
    routePrefixes: ["/forms"],
  },
  {
    key: "blog",
    label: "Blog Publisher",
    description: "Blog content creation and publishing",
    routePrefixes: ["/blog"],
  },
  {
    key: "content-engine",
    label: "Content Engine",
    description: "AI content generation tools",
    routePrefixes: ["/content-engine"],
  },
  {
    key: "knowledge-base",
    label: "AI Knowledge Base",
    description: "Training documents and knowledge management",
    routePrefixes: ["/knowledge-base"],
  },
  {
    key: "audit-tool",
    label: "Audit Tool",
    description: "Property audit and lead qualification",
    routePrefixes: ["/audit-tool"],
  },
];

export const ALL_MODULE_KEYS: ModuleKey[] = ALL_MODULES.map((m) => m.key);

export function getModuleForPath(pathname: string): ModuleKey | null {
  for (const mod of ALL_MODULES) {
    if (mod.routePrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return mod.key;
    }
  }
  return null;
}
