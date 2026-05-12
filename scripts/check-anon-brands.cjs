const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = {};
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

/** https://<project-ref>.supabase.co → project-ref */
function projectRefFromSupabaseUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/);
    if (m) return m[1];
    return `(unexpected host: ${host})`;
  } catch {
    return null;
  }
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = loadEnvLocal();

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ref = projectRefFromSupabaseUrl(url);

  console.log("env file:", envPath);
  console.log(
    "NEXT_PUBLIC_SUPABASE_URL:",
    url ? `${url.replace(/\/+$/, "")}` : "(missing)",
  );
  console.log(
    "Supabase project ref (parsed from URL; compare with Dashboard URL):",
    ref ?? "(could not parse — check URL format)",
  );
  console.log(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    anonKey ? `set (${anonKey.length} chars)` : "(missing)",
  );

  if (!url || !anonKey) {
    console.error("Abort: need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    process.exitCode = 1;
    return;
  }

  const anon = createClient(url, anonKey);
  const { data, error } = await anon.from("brands").select("id,name,slug").limit(5);
  console.log("anon brands:", JSON.stringify(data), "error:", error?.message ?? null);

  const { data: one, error: e2 } = await anon
    .from("brands")
    .select("id,name")
    .eq("slug", "qa-starbucks")
    .maybeSingle();
  console.log("anon qa-starbucks:", one, "error:", e2?.message ?? null);
}

main();
