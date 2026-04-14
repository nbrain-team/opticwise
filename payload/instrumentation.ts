export async function register() {
  if (typeof (globalThis as any).__PAYLOAD_SCHEMA_PUSHED__ !== "undefined") return;

  try {
    const { getPayload } = await import("payload");
    const { default: config } = await import("./src/payload.config");

    const orig = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";

    await getPayload({ config });
    console.log("[instrumentation] Database schema ready.");

    (process.env as Record<string, string>).NODE_ENV = orig || "production";
    (globalThis as any).__PAYLOAD_SCHEMA_PUSHED__ = true;
  } catch (err) {
    console.error("[instrumentation] Schema push error:", err);
  }
}
