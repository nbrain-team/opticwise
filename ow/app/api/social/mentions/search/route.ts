import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  ensureFreshToken,
  searchMentionableMembers,
  resolveVanityUrl,
} from "@/lib/linkedin-api";

interface MentionResult {
  name: string;
  urn: string;
  type: "person" | "organization";
  headline?: string;
  avatarUrl?: string;
  source: "linkedin" | "crm";
  resolved: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();
    const accountId = searchParams.get("accountId");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: MentionResult[] = [];
    const seenUrns = new Set<string>();

    // Source A: CRM lookup — People with LinkedIn profiles
    const crmPeople = await prisma.person.findMany({
      where: {
        linkedInProfile: { not: null },
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        firstName: true,
        lastName: true,
        title: true,
        linkedInProfile: true,
      },
      take: 8,
    });

    for (const person of crmPeople) {
      const vanity = extractVanityName(person.linkedInProfile || "");
      if (vanity) {
        results.push({
          name: `${person.firstName} ${person.lastName}`,
          urn: `vanity:${vanity}`,
          type: "person",
          headline: person.title || undefined,
          source: "crm",
          resolved: false,
        });
      }
    }

    // Source A (cont): CRM Organizations with LinkedIn profiles
    const crmOrgs = await prisma.organization.findMany({
      where: {
        linkedInProfile: { not: null },
        name: { contains: query, mode: "insensitive" },
      },
      select: {
        name: true,
        linkedInProfile: true,
        profilePicture: true,
      },
      take: 5,
    });

    for (const org of crmOrgs) {
      const vanity = extractOrgVanityName(org.linkedInProfile || "");
      if (vanity) {
        results.push({
          name: org.name,
          urn: `urn:li:organization:${vanity}`,
          type: "organization",
          avatarUrl: org.profilePicture || undefined,
          source: "crm",
          resolved: true, // Org mentions use vanity-based URN format directly
        });
      }
    }

    // Source B: LinkedIn API resolution
    // Find ANY connected company page account for Typeahead + vanity resolution
    const companyPageAccount = await findCompanyPageAccount(accountId);

    if (companyPageAccount) {
      try {
        const accessToken = await ensureFreshToken(companyPageAccount.id);
        const orgUrn = companyPageAccount.platformAccountId;

        // Typeahead: search org followers
        const liResults = await searchMentionableMembers(
          accessToken,
          orgUrn,
          query
        );

        for (const r of liResults) {
          if (r.personUrn && !seenUrns.has(r.personUrn)) {
            seenUrns.add(r.personUrn);
            results.push({
              name: `${r.firstName} ${r.lastName}`.trim(),
              urn: r.personUrn,
              type: "person",
              headline: r.headline,
              source: "linkedin",
              resolved: true,
            });
          }
        }

        // Resolve CRM vanity URLs to real URNs
        for (const result of results) {
          if (result.urn.startsWith("vanity:") && result.type === "person") {
            const vanity = result.urn.replace("vanity:", "");
            const resolved = await resolveVanityUrl(accessToken, orgUrn, vanity);
            if (resolved) {
              result.urn = resolved.personUrn;
              result.resolved = true;
            }
          }
        }
      } catch (err) {
        console.error("LinkedIn mention resolution error:", err);
      }
    }

    // Return all results — unresolved CRM contacts still shown
    // For unresolved person results, format URN as linkedin profile URL reference
    for (const result of results) {
      if (result.urn.startsWith("vanity:")) {
        const vanity = result.urn.replace("vanity:", "");
        result.urn = `urn:li:person:${vanity}`;
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Mention search error:", error);
    return NextResponse.json(
      { error: "Failed to search mentions" },
      { status: 500 }
    );
  }
}

/**
 * Find a connected company page account to use for LinkedIn API calls.
 * Prefers the specified accountId if it's a company page, otherwise
 * finds any connected company page with org scopes.
 */
async function findCompanyPageAccount(
  preferredAccountId: string | null
): Promise<{ id: string; platformAccountId: string } | null> {
  // First check if the specified account is a company page
  if (preferredAccountId) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: preferredAccountId },
      select: { id: true, accountType: true, platformAccountId: true, tokenScope: true, isConnected: true },
    });
    if (
      account?.isConnected &&
      account.accountType === "company_page" &&
      account.platformAccountId &&
      account.tokenScope?.includes("r_organization_social")
    ) {
      return { id: account.id, platformAccountId: account.platformAccountId };
    }
  }

  // Fallback: find any connected company page account with org scopes
  const companyPage = await prisma.socialAccount.findFirst({
    where: {
      isConnected: true,
      accountType: "company_page",
      platform: "linkedin",
      tokenScope: { contains: "r_organization_social" },
    },
    select: { id: true, platformAccountId: true },
  });

  if (companyPage?.platformAccountId) {
    return { id: companyPage.id, platformAccountId: companyPage.platformAccountId };
  }

  return null;
}

function extractVanityName(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([^/?]+)/i);
  return match?.[1] || null;
}

function extractOrgVanityName(url: string): string | null {
  const match = url.match(/linkedin\.com\/company\/([^/?]+)/i);
  return match?.[1] || null;
}
