/**
 * scripts/migrate-linkedin-to-social.ts
 *
 * One-time migration: copies LinkedInAccount rows into SocialAccount,
 * updates SocialPost.socialAccountId FKs to point to the new rows,
 * and preserves all existing post history and analytics.
 *
 * Run from the Render shell:
 *   npx tsx scripts/migrate-linkedin-to-social.ts
 *
 * Safe to re-run — uses upsert on the (platform, platformAccountId) unique key.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== LinkedIn → SocialAccount Migration ===\n");

  // Step 1: Migrate LinkedInAccount rows → SocialAccount
  const linkedInAccounts = await prisma.linkedInAccount.findMany({
    include: { user: { select: { id: true, email: true } } },
  });

  console.log(`Found ${linkedInAccounts.length} LinkedInAccount(s) to migrate.\n`);

  const idMap = new Map<string, string>(); // old LinkedInAccount.id → new SocialAccount.id

  for (const la of linkedInAccounts) {
    const platformAccountId =
      la.zernioProfileId || la.zernioAccountId || la.id;

    const accountType =
      la.accountType === "company" || la.accountType === "company_page"
        ? "company_page"
        : "personal";

    const sa = await prisma.socialAccount.upsert({
      where: {
        platform_platformAccountId: {
          platform: "linkedin",
          platformAccountId,
        },
      },
      update: {
        displayName: la.displayName,
        username: la.username,
        avatarUrl: la.avatarUrl,
        profileUrl: la.profileUrl,
        accountType,
        isConnected: la.isConnected,
        connectedAt: la.connectedAt,
        disconnectedAt: la.disconnectedAt,
        userId: la.userId,
      },
      create: {
        platform: "linkedin",
        platformAccountId,
        accountType,
        displayName: la.displayName,
        username: la.username,
        avatarUrl: la.avatarUrl,
        profileUrl: la.profileUrl,
        isConnected: la.isConnected,
        connectedAt: la.connectedAt,
        disconnectedAt: la.disconnectedAt,
        userId: la.userId,
      },
    });

    idMap.set(la.id, sa.id);
    console.log(
      `  Migrated: ${la.displayName || la.username || la.id} → SocialAccount ${sa.id} (${accountType})`
    );
  }

  // Step 2: Update SocialPost.socialAccountId for posts linked to old LinkedInAccounts
  const postsToUpdate = await prisma.socialPost.findMany({
    where: {
      accountId: { not: null },
      socialAccountId: null,
    },
    select: { id: true, accountId: true },
  });

  console.log(
    `\nFound ${postsToUpdate.length} SocialPost(s) needing FK migration.\n`
  );

  let updated = 0;
  let skipped = 0;

  for (const post of postsToUpdate) {
    if (!post.accountId) {
      skipped++;
      continue;
    }

    const newAccountId = idMap.get(post.accountId);
    if (!newAccountId) {
      console.warn(
        `  WARN: No SocialAccount mapping for LinkedInAccount ${post.accountId} (post ${post.id})`
      );
      skipped++;
      continue;
    }

    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        socialAccountId: newAccountId,
        platform: "linkedin",
      },
    });
    updated++;
  }

  console.log(`  Updated: ${updated} posts`);
  console.log(`  Skipped: ${skipped} posts (no mapping found)`);

  // Step 3: Summary
  const totalSocialAccounts = await prisma.socialAccount.count();
  const totalPostsWithNewFK = await prisma.socialPost.count({
    where: { socialAccountId: { not: null } },
  });

  console.log("\n=== Migration Summary ===");
  console.log(`  SocialAccount records: ${totalSocialAccounts}`);
  console.log(`  SocialPosts with new FK: ${totalPostsWithNewFK}`);
  console.log(`  LinkedInAccount records preserved: ${linkedInAccounts.length}`);
  console.log("\nLinkedInAccount model is now deprecated. Do NOT delete it until");
  console.log("all dependent code paths have been verified to use SocialAccount.");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
