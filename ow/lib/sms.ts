import twilio from "twilio";

let _client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  if (!_client) {
    _client = twilio(sid, token);
  }
  return _client;
}

/**
 * Normalize a US phone number to E.164 format (+1XXXXXXXXXX).
 * Returns null if the input can't be parsed as a 10-digit US number.
 */
export function formatPhoneE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/**
 * Send an SMS via Twilio. Returns gracefully if Twilio is not configured
 * (10DLC not yet approved) — logs a warning but never throws.
 */
export async function sendSms(
  to: string,
  body: string
): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const from = process.env.TWILIO_SMS_NUMBER;
  if (!from) {
    console.warn("[sms] TWILIO_SMS_NUMBER not set — SMS not sent (10DLC pending?)");
    return { ok: false, error: "TWILIO_SMS_NUMBER not configured" };
  }

  const client = getClient();
  if (!client) {
    console.warn("[sms] TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set — SMS not sent");
    return { ok: false, error: "Twilio credentials not configured" };
  }

  const e164 = formatPhoneE164(to);
  if (!e164) {
    console.warn(`[sms] Could not normalize phone "${to}" to E.164 — SMS not sent`);
    return { ok: false, error: `Invalid phone: ${to}` };
  }

  try {
    const message = await client.messages.create({
      to: e164,
      from,
      body,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio-sms-status`,
    });
    console.log(`[sms] Sent to ${e164} — SID: ${message.sid}`);
    return { ok: true, sid: message.sid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[sms] Failed to send to ${e164}:`, msg);
    return { ok: false, error: msg };
  }
}

/**
 * Validate a Twilio webhook request signature.
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return false;
  return twilio.validateRequest(token, signature, url, params);
}
