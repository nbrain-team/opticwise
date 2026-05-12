import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/insights");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user || (user.role !== "admin" && user.role !== "editor")) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
