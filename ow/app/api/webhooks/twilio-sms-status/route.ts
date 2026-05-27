import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateTwilioSignature } from "@/lib/sms";

/**
 * POST /api/webhooks/twilio-sms-status
 *
 * Receives SMS status callbacks from Twilio, including opt-out (STOP) events.
 * When a recipient replies STOP, Twilio sends an "OptOutType" param.
 * We mark the Person as smsOptedOut so we never text them again.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = String(value);
    }

    const signature = request.headers.get("x-twilio-signature") ?? "";
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio-sms-status`;

    if (!validateTwilioSignature(url, params, signature)) {
      console.error("[twilio-sms] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const messageStatus = params.MessageStatus ?? params.SmsStatus;
    const from = params.From;
    const optOutType = params.OptOutType;

    console.log(`[twilio-sms] Status callback: ${messageStatus} from=${from} optOut=${optOutType ?? "none"}`);

    // Handle opt-out (STOP replies)
    if (optOutType || messageStatus === "undelivered") {
      if (from) {
        const digits = from.replace(/\D/g, "");
        const phoneVariants = [from, `+${digits}`];
        if (digits.length === 11 && digits.startsWith("1")) {
          phoneVariants.push(digits.slice(1));
        }

        const person = await prisma.person.findFirst({
          where: {
            OR: phoneVariants.flatMap((p) => [
              { phone: p },
              { phoneMobile: p },
              { phoneWork: p },
            ]),
          },
        });

        if (person && !person.smsOptedOut) {
          await prisma.person.update({
            where: { id: person.id },
            data: { smsOptedOut: true },
          });
          console.log(`[twilio-sms] Marked person ${person.id} as smsOptedOut`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[twilio-sms] Webhook error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

/**
 * GET /api/webhooks/twilio-sms-status
 *
 * Health check endpoint.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "twilio-sms-status-webhook",
    timestamp: new Date().toISOString(),
  });
}
