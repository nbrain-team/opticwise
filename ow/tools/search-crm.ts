/**
 * Search CRM Tool
 * 
 * Searches CRM data (deals, contacts, organizations)
 */

import { ToolDefinition } from '../lib/tool-registry';

export const searchCRMTool: ToolDefinition = {
  name: 'search_crm',
  description: 'Searches CRM data including deals, contacts, organizations, and pipeline information',
  category: 'crm',
  requiresApproval: false,

  parameters: {
    query: {
      type: 'string',
      required: true,
      description: 'Search query for CRM data',
    },
    type: {
      type: 'string',
      required: false,
      description: 'Type of CRM data to search: deals, contacts, organizations (default: all)',
      default: 'all',
    },
    limit: {
      type: 'number',
      required: false,
      description: 'Maximum number of results (default: 20)',
      default: 20,
    },
  },

  async execute({ query, type = 'all', limit = 20 }, { dbPool }) {
    try {
      const results: any = { deals: [], contacts: [], organizations: [] };
      const queryLower = query.toLowerCase();

      // Search deals
      if (type === 'all' || type === 'deals') {
        const dealsResult = await dbPool.query(
          `SELECT d.id, d.title, d.value, d.currency, d.status, d.probability,
                  d."expectedCloseDate", d."lastActivityDate", d."nextActivityDate",
                  s.name as stage_name, p.name as pipeline_name,
                  o.name as organization_name, per.name as person_name,
                  u.name as owner_name
           FROM "Deal" d
           LEFT JOIN "Stage" s ON d."stageId" = s.id
           LEFT JOIN "Pipeline" p ON d."pipelineId" = p.id
           LEFT JOIN "Organization" o ON d."organizationId" = o.id
           LEFT JOIN "Person" per ON d."personId" = per.id
           LEFT JOIN "User" u ON d."ownerId" = u.id
           WHERE d.status = 'open'
           ORDER BY 
             CASE 
               WHEN s.name IN ('DDI Review Proposed', 'RR Opportunities', 'RR Contracting') THEN 1
               WHEN s.name = 'Discovery & Qualification' THEN 2
               ELSE 3
             END,
             d."lastActivityDate" DESC NULLS LAST,
             d.value DESC
           LIMIT $1`,
          [limit]
        );
        results.deals = dealsResult.rows;
      }

      // Search contacts
      if (type === 'all' || type === 'contacts') {
        const contactsResult = await dbPool.query(
          `SELECT p.id, p.name, p."firstName", p."lastName", p.email, p.title,
                  o.name as organization_name,
                  (SELECT COUNT(*) FROM "Deal" WHERE "personId" = p.id AND status = 'open') as open_deals
           FROM "Person" p
           LEFT JOIN "Organization" o ON p."organizationId" = o.id
           WHERE p.email IS NOT NULL
           ORDER BY p."createdAt" DESC
           LIMIT $1`,
          [Math.ceil(limit / 2)]
        );
        results.contacts = contactsResult.rows;
      }

      const totalResults = results.deals.length + results.contacts.length + results.organizations.length;

      return {
        success: true,
        data: results,
        confidence: totalResults > 0 ? 0.9 : 0.5,
        source_type: 'crm_search',
        data_points: [
          ...results.deals.map((d: any) => ({ type: 'deal', title: d.title, value: d.value })),
          ...results.contacts.map((c: any) => ({ type: 'contact', name: c.name, email: c.email })),
        ],
      };
    } catch (error) {
      console.error('[search_crm] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
      };
    }
  },
};
