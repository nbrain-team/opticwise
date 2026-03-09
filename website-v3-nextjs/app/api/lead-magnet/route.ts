import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, company, portfolioSize } = data;

    if (!name || !email || !company) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Log the lead for now - integrate with CRM/email service later
    console.log("[Lead Magnet]", { name, email, company, portfolioSize, timestamp: new Date().toISOString() });

    // TODO: Send to CRM API, email service, or Ghost members API
    // TODO: Trigger email with PPP Starter Kit PDF attachment

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
