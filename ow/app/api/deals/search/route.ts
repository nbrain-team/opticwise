import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";

  const deals = await prisma.deal.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { organization: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {},
    select: {
      id: true,
      title: true,
      organization: { select: { name: true } },
    },
    orderBy: { updateTime: "desc" },
    take: 20,
  });

  return NextResponse.json({ deals });
}
