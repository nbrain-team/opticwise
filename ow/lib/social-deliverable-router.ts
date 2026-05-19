/**
 * lib/social-deliverable-router.ts — Routes Content Engine output to SocialPost records.
 *
 * Called after the weekly content engine batch. Matches each deliverable
 * to DeliverableSchedule rows, creates SocialPost drafts, runs risk
 * classification, and advances low-risk posts to "scheduled".
 */

import { prisma } from "@/lib/db";
import { classifyRisk } from "@/lib/social-risk-classifier";
import type { BlogPackage } from "@/lib/content-engine";

interface RoutingResult {
  created: number;
  scheduled: number;
  pendingApproval: number;
  unmatched: string[];
}

/**
 * Compute the next occurrence of a scheduled day/time from today.
 */
function nextScheduledDate(
  days: string[],
  time: string,
  timezone: string
): Date | null {
  if (!days.length || !time) return null;

  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };

  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();

  const currentDay = now.getDay();
  let minDelta = Infinity;
  let targetDayNum = -1;

  for (const d of days) {
    const dn = dayMap[d.toLowerCase()];
    if (dn === undefined) continue;
    let delta = dn - currentDay;
    if (delta <= 0) delta += 7;
    if (delta < minDelta) {
      minDelta = delta;
      targetDayNum = dn;
    }
  }

  if (targetDayNum === -1) return null;

  const target = new Date(now);
  target.setDate(target.getDate() + minDelta);
  target.setHours(hours || 8, minutes || 0, 0, 0);

  return target;
}

/**
 * Main entry point: route a batch of Content Engine packages to social posts.
 */
export async function routeDeliverablesToSocial(
  packages: BlogPackage[],
  authorMap: Record<string, string> // author name -> SocialAccount.userId or identifier
): Promise<RoutingResult> {
  const result: RoutingResult = {
    created: 0,
    scheduled: 0,
    pendingApproval: 0,
    unmatched: [],
  };

  const schedules = await prisma.deliverableSchedule.findMany({
    where: { isActive: true },
    include: { targetAccount: true },
  });

  for (const pkg of packages) {
    const deliverables = [
      { type: "linkedinArticle", content: pkg.linkedinArticle.body, title: pkg.linkedinArticle.title },
      { type: "linkedinPost", content: pkg.linkedinPost.body, title: pkg.linkedinPost.title },
    ];

    for (const del of deliverables) {
      const matchingSchedules = schedules.filter(
        (s) => s.deliverableType === del.type
      );

      if (matchingSchedules.length === 0) {
        result.unmatched.push(`${del.type}: ${del.title || "(untitled)"}`);
        continue;
      }

      for (const schedule of matchingSchedules) {
        const account = schedule.targetAccount;
        const cadence = schedule.cadence as { days?: string[]; frequency?: string };
        const scheduledFor = nextScheduledDate(
          cadence.days || [],
          schedule.defaultPostTime,
          schedule.timezone
        );

        const risk = await classifyRisk({
          content: del.content,
          platform: account.platform,
          accountType: account.accountType,
          accountDisplayName: account.displayName || undefined,
          useLlmFallback: true,
        });

        const shouldAutoSchedule =
          risk.tier === "low" && account.autoPublishEnabled;

        const post = await prisma.socialPost.create({
          data: {
            socialAccountId: account.id,
            platform: account.platform,
            content: del.content,
            status: shouldAutoSchedule ? "scheduled" : "pending_approval",
            scheduledFor: scheduledFor || undefined,
            timezone: schedule.timezone,
            aiGenerated: true,
            aiTopicCategory: del.type,
            riskTier: risk.tier,
            riskReason: risk.reasons.length > 0 ? risk.reasons.join("; ") : null,
          },
        });

        result.created++;
        if (post.status === "scheduled") {
          result.scheduled++;
        } else {
          result.pendingApproval++;
        }
      }
    }
  }

  return result;
}
