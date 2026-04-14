import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = process.env as Record<string, string | undefined>;
  const orig = env.NODE_ENV;
  env.NODE_ENV = "development";

  try {
    const payload = await getPayload({ config });
    env.NODE_ENV = orig || "production";

    const users = await payload.find({ collection: "users", limit: 1 });
    return NextResponse.json({
      success: true,
      message: "Database schema pushed. Tables created.",
      userCount: users.totalDocs,
    });
  } catch (err: any) {
    env.NODE_ENV = orig || "production";
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
