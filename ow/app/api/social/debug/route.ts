import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/**
 * Temporary diagnostic endpoint — remove after social connect is working.
 * Only accessible to logged-in users. Returns which social env vars are present
 * (names only, never values) plus process metadata.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const envNames = [
    "LINKEDIN_CLIENT_ID",
    "LINKEDIN_CLIENT_SECRET",
    "META_APP_ID",
    "META_APP_SECRET",
    "NEXT_PUBLIC_APP_URL",
    "SOCIAL_CRON_SECRET",
    "NODE_ENV",
  ];

  const envStatus: Record<string, string> = {};
  for (const name of envNames) {
    const val = process.env[name];
    if (!val) {
      envStatus[name] = "NOT SET";
    } else {
      envStatus[name] = `SET (${val.length} chars)`;
    }
  }

  const allEnvKeys = Object.keys(process.env).sort();

  return NextResponse.json({
    envStatus,
    allEnvKeys,
    totalEnvVars: allEnvKeys.length,
    nodeVersion: process.version,
    processUptime: `${Math.round(process.uptime())}s`,
    deployCommit: process.env["RENDER_GIT_COMMIT"]?.slice(0, 8) || "unknown",
    renderServiceName: process.env["RENDER_SERVICE_NAME"] || "unknown",
    timestamp: new Date().toISOString(),
  });
}
