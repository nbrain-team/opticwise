import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-ghost-webhook-secret");
  if (secret !== process.env.GHOST_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const slug = body?.post?.current?.slug || body?.page?.current?.slug;

    if (slug) {
      revalidatePath(`/${slug}/`);
    }

    revalidatePath("/");
    revalidatePath("/insights/");

    return NextResponse.json({ revalidated: true, slug });
  } catch {
    return NextResponse.json({ revalidated: true });
  }
}
