import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Updating password for security...");
  
  // Generate a strong password hash
  const newPassword = "opt!c!3493";
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  // Update the user's password
  const user = await prisma.user.update({
    where: { email: "bill@opticwise.com" },
    data: { passwordHash },
  });
  
  console.log("✅ Password updated successfully for:", user.email);
  console.log("\n⚠️  NEW CREDENTIALS:");
  console.log("   Email: bill@opticwise.com");
  console.log("   Password: opt!c!3493");
  console.log("\n🔐 Password has been updated securely.\n");
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

