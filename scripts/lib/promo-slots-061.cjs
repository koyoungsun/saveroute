/**
 * Shared helpers for 061 promo slot scripts.
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i <= 0 || line.trim().startsWith("#")) continue;
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = val;
  }
  return env;
}

function createServiceClient() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function promoSlotHistoriesTableReady(supabase) {
  const { error } = await supabase.from("promo_slot_histories").select("id").limit(1);
  if (!error) {
    return true;
  }
  return error.code !== "PGRST205";
}

function buildSnapshot(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    badge: row.badge,
    image_url: row.image_url,
    href: row.href,
    priority: row.priority,
    is_active: row.is_active,
    is_sponsored: row.is_sponsored,
    sponsor_name: row.sponsor_name,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    link_type: row.link_type,
    hashtags: row.hashtags,
    click_count: row.click_count,
    impression_count: row.impression_count,
  };
}

module.exports = {
  loadEnvLocal,
  createServiceClient,
  promoSlotHistoriesTableReady,
  buildSnapshot,
};
