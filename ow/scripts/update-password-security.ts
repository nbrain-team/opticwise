import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Updating password for security...");
  
  // Get password from command line argument or environment variable
  const newPassword = process.argv[2] || process.env.NEW_PASSWORD;
  
  if (!newPassword) {
    console.error("❌ Error: Password not provided");
    console.log("\nUsage:");
    console.log("  npx tsx scripts/update-password-security.ts <new-password>");
    console.log("  or");
    console.log("  NEW_PASSWORD=<password> npx tsx scripts/update-password-security.ts");
    process.exit(1);
  }
  
  // Generate password hash
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  // Update the user's password
  const user = await prisma.user.update({
    where: { email: "bill@opticwise.com" },
    data: { passwordHash },
  });
  
  console.log("✅ Password updated successfully for:", user.email);
  console.log("🔐 Password has been updated securely.\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error updating password:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

