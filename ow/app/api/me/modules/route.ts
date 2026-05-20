import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserModules } from "@/lib/access-control";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const modules = await getUserModules(session.userId);
  return NextResponse.json({ modules });
}
