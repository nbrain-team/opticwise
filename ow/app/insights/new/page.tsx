import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function NewInsightPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/insights/new");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user || (user.role !== "admin" && user.role !== "editor")) {
    redirect("/dashboard");
  }

  const slug = `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const row = await prisma.insight.create({
    data: {
      slug,
      title: "Untitled",
      authorId: user.id,
    },
  });
  redirect(`/insights/${row.id}`);
}
