/**
 * Script to set bill@opticwise.com as admin
 * Run with: npx tsx scripts/set-bill-as-admin.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Setting bill@opticwise.com as admin...");

  const user = await prisma.user.update({
    where: {
      email: "bill@opticwise.com",
    },
    data: {
      role: "admin",
      isActive: true,
    },
  });

  console.log("✓ Updated user:", {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
  });

  console.log("\nBill is now an admin!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
