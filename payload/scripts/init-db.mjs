/**
 * Initialize Payload CMS database schema.
 * Runs Payload in development mode briefly to push the Drizzle schema,
 * creating all required tables in the Postgres database.
 */

const env = process.env;
const origNodeEnv = env.NODE_ENV;
env.NODE_ENV = "development";

async function initDB() {
  console.log("[init-db] Pushing database schema...");

  try {
    const { getPayload } = await import("payload");
    const mod = await import("../src/payload.config.ts");
    const config = mod.default;

    const payload = await getPayload({ config });
    console.log("[init-db] Database schema pushed successfully.");

    try {
      await payload.db.destroy();
    } catch (_) {
      // ignore cleanup errors
    }
  } catch (err) {
    console.error("[init-db] Failed to push schema:", err);
    process.exit(1);
  }

  env.NODE_ENV = origNodeEnv || "production";
  process.exit(0);
}

initDB();
