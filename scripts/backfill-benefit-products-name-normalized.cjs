#!/usr/bin/env node
/**
 * benefit_products.name_normalized 재생성 (name 원본은 변경하지 않음).
 * Supabase SQL Editor 또는 service_role 연결에서 migration 066과 동일한 UPDATE를 실행합니다.
 *
 * Usage:
 *   node scripts/backfill-benefit-products-name-normalized.cjs
 *
 * Requires DATABASE_URL or SUPABASE_DB_URL in environment (optional — prints SQL if missing).
 */

const SQL = `
UPDATE public.benefit_products
SET name_normalized = public.bp_normalize_name(name)
WHERE name_normalized IS DISTINCT FROM public.bp_normalize_name(name);
`;

const dbUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.log("-- name_normalized backfill (run after migration 066 bp_normalize_name update)");
  console.log(SQL.trim());
  console.log("\nSet DATABASE_URL to execute automatically.");
  process.exit(0);
}

async function main() {
  const { Client } = require("pg");
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    const result = await client.query(SQL);
    console.log(`name_normalized backfill complete. rows updated: ${result.rowCount ?? 0}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
