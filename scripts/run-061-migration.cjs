/**
 * Apply 061 migration SQL via postgres (SUPABASE_DB_URL / DATABASE_URL required).
 * Usage: npm run apply:061-migration
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  createServiceClient,
  promoSlotHistoriesTableReady,
} = require("./lib/promo-slots-061.cjs");

async function main() {
  const env = { ...require("./lib/promo-slots-061.cjs").loadEnvLocal(), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl =
    env.SUPABASE_DB_URL ||
    env.DATABASE_URL ||
    env.POSTGRES_URL ||
    env.SUPABASE_DATABASE_URL;

  if (!url || !key) {
    console.error("FAIL: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createServiceClient();
  if (await promoSlotHistoriesTableReady(supabase)) {
    console.log("promo_slot_histories already exists — running cleanup script.");
    const result = spawnSync(process.execPath, ["scripts/apply-061-promo-slots-cleanup.cjs"], {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    process.exit(result.status ?? 1);
  }

  if (!dbUrl) {
    console.error("FAIL: promo_slot_histories table missing and no postgres URL found.");
    console.error("Set SUPABASE_DB_URL in .env.local, then rerun: npm run apply:061-migration");
    console.error("Or paste supabase/migrations/061_promo_slot_histories.sql into Supabase SQL Editor.");
    process.exit(1);
  }

  let pg;
  try {
    pg = require("pg");
  } catch {
    console.error("FAIL: install pg first — npm install --save-dev pg");
    process.exit(1);
  }

  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/061_promo_slot_histories.sql",
  );
  const sql = fs.readFileSync(migrationPath, "utf8");
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Applying 061 migration via postgres...");
    await client.connect();
    await client.query(sql);
    console.log("OK: migration applied");
  } catch (error) {
    console.error("FAIL:", error.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }

  const result = spawnSync(process.execPath, ["scripts/qa-promo-slot-history.cjs"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  process.exit(result.status ?? 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
