import { getPayload } from "payload";
import config from "../src/payload.config";

async function initDB() {
  console.log("[init-db] Initializing database schema...");

  const origEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  try {
    const payload = await getPayload({ config });
    console.log("[init-db] Schema pushed successfully. Tables created.");

    if (payload.db && typeof (payload.db as any).pool?.end === "function") {
      await (payload.db as any).pool.end();
    }
  } catch (err) {
    console.error("[init-db] Error during initialization:", err);
    process.exit(1);
  }

  process.env.NODE_ENV = origEnv || "production";
  process.exit(0);
}

initDB();
