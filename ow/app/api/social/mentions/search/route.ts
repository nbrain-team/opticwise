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
      take: 5,
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
        });
      }
    }

    // Source B: LinkedIn People Typeahead (company page accounts only)
    if (accountId) {
      try {
        const account = await prisma.socialAccount.findUnique({
          where: { id: accountId },
          select: {
            accountType: true,
            platformAccountId: true,
            accessToken: true,
          },
        });

        if (account?.accountType === "company_page" && account.platformAccountId) {
          const accessToken = await ensureFreshToken(accountId);
          const orgUrn = account.platformAccountId;

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
              });
            }
          }

          // Resolve CRM vanity URLs to real URNs using LinkedIn API
          for (const result of results) {
            if (result.urn.startsWith("vanity:") && result.type === "person") {
              const vanity = result.urn.replace("vanity:", "");
              const resolved = await resolveVanityUrl(accessToken, orgUrn, vanity);
              if (resolved) {
                result.urn = resolved.personUrn;
              }
            }
          }
        }
      } catch (err) {
        console.error("LinkedIn mention search error:", err);
      }
    }

    // Filter out unresolved vanity URNs (couldn't resolve to a real URN)
    const finalResults = results.filter((r) => !r.urn.startsWith("vanity:"));

    return NextResponse.json({ results: finalResults });
  } catch (error) {
    console.error("Mention search error:", error);
    return NextResponse.json(
      { error: "Failed to search mentions" },
      { status: 500 }
    );
  }
}

function extractVanityName(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([^/?]+)/i);
  return match?.[1] || null;
}

function extractOrgVanityName(url: string): string | null {
  const match = url.match(/linkedin\.com\/company\/([^/?]+)/i);
  return match?.[1] || null;
}
