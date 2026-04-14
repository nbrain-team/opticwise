import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = body?.slug || body?.post?.current?.slug || body?.page?.current?.slug;

    if (slug) {
      revalidatePath(`/${slug}/`);
    }

    revalidatePath("/");
    revalidatePath("/insights/");

    return NextResponse.json({ revalidated: true, slug });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
