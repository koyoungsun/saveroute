/**
 * 로컬 QA: MVNO 상품(021) + 검색 개인화 QA 브랜드·할인(022) 시드
 * 사용: 프로젝트 루트에서 node scripts/seed-personalization-qa.cjs
 * 필요: .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const QA_PREFIX = "QA_SEED|";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("Missing .env.local — cannot seed.");
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

async function seedMvnoProducts(sb) {
  const { data: telecom, error: e1 } = await sb
    .from("benefit_categories")
    .select("id")
    .eq("code", "telecom")
    .maybeSingle();
  if (e1 || !telecom) throw new Error(`telecom category: ${e1?.message}`);

  const { data: p7 } = await sb.from("providers").select("id").eq("code", "sk_7mobile").maybeSingle();
  const { data: pu } = await sb.from("providers").select("id").eq("code", "uplus_mvno").maybeSingle();
  if (!p7?.id || !pu?.id) throw new Error("MVNO providers sk_7mobile / uplus_mvno missing — run migration 017 seed.");

  const rows = [
    {
      benefit_category_id: telecom.id,
      provider_id: p7.id,
      name: "SK 7mobile 요금제",
      code: "sk_7mobile_plan",
      product_type: "telecom_mvno_plan",
      grade: null,
      card_type: null,
      is_mvno: true,
      mvno_notice_required: true,
      is_active: true,
    },
    {
      benefit_category_id: telecom.id,
      provider_id: pu.id,
      name: "U+ 알뜰모바일 요금제",
      code: "uplus_mvno_plan",
      product_type: "telecom_mvno_plan",
      grade: null,
      card_type: null,
      is_mvno: true,
      mvno_notice_required: true,
      is_active: true,
    },
  ];

  const { error } = await sb.from("benefit_products").upsert(rows, { onConflict: "code" });
  if (error) throw new Error(`MVNO products upsert: ${error.message}`);
  console.log("OK benefit_products: sk_7mobile_plan, uplus_mvno_plan");
}

async function clearQaRows(sb) {
  const { error: e1 } = await sb.from("discounts").delete().like("admin_memo", `${QA_PREFIX}%`);
  if (e1) throw new Error(`delete discounts: ${e1.message}`);
  const { error: e2 } = await sb.from("brands").delete().like("admin_memo", `${QA_PREFIX}%`);
  if (e2) throw new Error(`delete brands: ${e2.message}`);
  console.log("OK cleared QA-tagged brands & discounts");
}

async function seedQaBrandsAndDiscounts(sb) {
  const [{ data: food }, { data: leisure }] = await Promise.all([
    sb.from("brand_categories").select("id").eq("code", "food").maybeSingle(),
    sb.from("brand_categories").select("id").eq("code", "leisure").maybeSingle(),
  ]);
  if (!food?.id || !leisure?.id) throw new Error("brand_categories food/leisure missing");

  const brandRows = [
    {
      name: "스타벅스",
      slug: "qa-starbucks",
      category_id: food.id,
      aliases: ["starbucks", "스타벅스코리아", "STARBUCKS"],
      official_url: "https://www.starbucks.co.kr",
      is_active: true,
      admin_memo: `${QA_PREFIX} 브랜드 · 검색/혜택 개인화 QA`,
    },
    {
      name: "CGV",
      slug: "qa-cgv",
      category_id: leisure.id,
      aliases: ["씨지브이", "cgv"],
      official_url: "https://www.cgv.co.kr",
      is_active: true,
      admin_memo: `${QA_PREFIX} 브랜드 · 검색/혜택 개인화 QA`,
    },
    {
      name: "메가커피",
      slug: "qa-megacoffee",
      category_id: food.id,
      aliases: ["메가 커피", "megacoffee"],
      official_url: "https://www.mega-mgcc.co.kr",
      is_active: true,
      admin_memo: `${QA_PREFIX} 브랜드 · 검색/혜택 개인화 QA`,
    },
    {
      name: "배스킨라빈스",
      slug: "qa-baskinrobbins",
      category_id: food.id,
      aliases: ["베라", "baskin", "BR"],
      official_url: "https://www.baskinrobbins.co.kr",
      is_active: true,
      admin_memo: `${QA_PREFIX} 브랜드 · 검색/혜택 개인화 QA`,
    },
    {
      name: "파리바게뜨",
      slug: "qa-parisbaguette",
      category_id: food.id,
      aliases: ["파리바게트", "paris baguette", "파바"],
      official_url: "https://www.paris.co.kr",
      is_active: true,
      admin_memo: `${QA_PREFIX} 브랜드 · 검색/혜택 개인화 QA`,
    },
  ];

  const { error: be } = await sb.from("brands").upsert(brandRows, { onConflict: "slug" });
  if (be) throw new Error(`brands upsert: ${be.message}`);
  console.log("OK brands upsert (5)");

  const { data: telecomCat } = await sb.from("benefit_categories").select("id").eq("code", "telecom").maybeSingle();
  const { data: cardCat } = await sb.from("benefit_categories").select("id").eq("code", "card").maybeSingle();
  if (!telecomCat?.id || !cardCat?.id) throw new Error("benefit_categories telecom/card missing");

  async function pid(code) {
    const { data } = await sb.from("providers").select("id").eq("code", code).maybeSingle();
    return data?.id;
  }
  async function prodId(code) {
    const { data } = await sb.from("benefit_products").select("id").eq("code", code).maybeSingle();
    return data?.id;
  }
  async function bid(slug) {
    const { data } = await sb.from("brands").select("id").eq("slug", slug).maybeSingle();
    return data?.id;
  }

  const kt = await pid("kt");
  const skt = await pid("skt");
  const lgu = await pid("lguplus");
  const shinhan = await pid("shinhan_card");
  const kb = await pid("kb_card");
  const ktVip = await prodId("kt_vip");
  const sktMem = await prodId("skt_tmembership");
  const lguVip = await prodId("lguplus_vip");
  const shinhanDream = await prodId("shinhan_deep_dream");
  const kbNori = await prodId("kb_nori_check");

  const ids = { kt, skt, lgu, shinhan, kb, ktVip, sktMem, lguVip, shinhanDream, kbNori };
  for (const [k, v] of Object.entries(ids)) {
    if (v == null) throw new Error(`Missing FK id for ${k} — apply migration 017 seed first.`);
  }

  const today = new Date().toISOString().slice(0, 10);

  const discountRows = [
    {
      brand_id: await bid("qa-starbucks"),
      benefit_category_id: telecomCat.id,
      provider_id: kt,
      benefit_product_id: ktVip,
      title: "KT 멤버십 스타벅스 할인",
      summary: `${QA_PREFIX} KT VIP 멤버십 스타벅스 음료 할인(임시율)`,
      condition_text: "멤버십 앱에서 결제 시 적용된다고 가정한 QA 문구입니다.",
      discount_value: 30,
      discount_unit: "percent",
      usage_type: "membership_app",
      is_stackable: false,
      valid_until: null,
      has_no_expiry: true,
      source_url: "https://example.com/qa/kt-starbucks",
      last_checked_at: today,
      data_confidence: "medium",
      status: "active",
      admin_memo: `${QA_PREFIX} KT 멤버십 스타벅스 · personalization QA`,
    },
    {
      brand_id: await bid("qa-cgv"),
      benefit_category_id: telecomCat.id,
      provider_id: skt,
      benefit_product_id: sktMem,
      title: "SKT 멤버십 CGV 할인",
      summary: `${QA_PREFIX} SKT T멤버십 CGV 관람 할인(임시율)`,
      condition_text: "T멤버십 앱 예매 시 적용된다고 가정한 QA 문구입니다.",
      discount_value: 2000,
      discount_unit: "won",
      usage_type: "app_booking",
      is_stackable: false,
      valid_until: null,
      has_no_expiry: true,
      source_url: "https://example.com/qa/skt-cgv",
      last_checked_at: today,
      data_confidence: "medium",
      status: "active",
      admin_memo: `${QA_PREFIX} SKT 멤버십 CGV · personalization QA`,
    },
    {
      brand_id: await bid("qa-baskinrobbins"),
      benefit_category_id: telecomCat.id,
      provider_id: lgu,
      benefit_product_id: lguVip,
      title: "LG U+ 배스킨라빈스 할인",
      summary: `${QA_PREFIX} U+ VIP 배스킨라빈스 할인(임시율)`,
      condition_text: "U+ 멤버십 제휴 결제 시 적용된다고 가정한 QA 문구입니다.",
      discount_value: 15,
      discount_unit: "percent",
      usage_type: "membership_app",
      is_stackable: false,
      valid_until: null,
      has_no_expiry: true,
      source_url: "https://example.com/qa/lgu-baskin",
      last_checked_at: today,
      data_confidence: "medium",
      status: "active",
      admin_memo: `${QA_PREFIX} LG U+ 배스킨라빈스 · personalization QA`,
    },
    {
      brand_id: await bid("qa-megacoffee"),
      benefit_category_id: cardCat.id,
      provider_id: shinhan,
      benefit_product_id: shinhanDream,
      title: "신한카드 메가커피 할인",
      summary: `${QA_PREFIX} 신한 Deep Dream 메가커피 할인(임시율)`,
      condition_text: "신한카드 현장 결제 시 적용된다고 가정한 QA 문구입니다.",
      discount_value: 10,
      discount_unit: "percent",
      usage_type: "onsite_payment",
      is_stackable: false,
      valid_until: null,
      has_no_expiry: true,
      source_url: "https://example.com/qa/shinhan-mega",
      last_checked_at: today,
      data_confidence: "medium",
      status: "active",
      admin_memo: `${QA_PREFIX} 신한카드 메가커피 · personalization QA`,
    },
    {
      brand_id: await bid("qa-parisbaguette"),
      benefit_category_id: cardCat.id,
      provider_id: kb,
      benefit_product_id: kbNori,
      title: "KB국민카드 파리바게뜨 할인",
      summary: `${QA_PREFIX} KB국민 노리 체크 파리바게뜨 할인(임시율)`,
      condition_text: "KB국민 체크카드 결제 시 적용된다고 가정한 QA 문구입니다.",
      discount_value: 5,
      discount_unit: "percent",
      usage_type: "onsite_payment",
      is_stackable: false,
      valid_until: null,
      has_no_expiry: true,
      source_url: "https://example.com/qa/kb-paris",
      last_checked_at: today,
      data_confidence: "medium",
      status: "active",
      admin_memo: `${QA_PREFIX} KB국민카드 파리바게뜨 · personalization QA`,
    },
  ];

  const { error: de } = await sb.from("discounts").insert(discountRows);
  if (de) throw new Error(`discounts insert: ${de.message}`);
  console.log("OK discounts insert (5)");
}

async function verifySearchLogs(sb) {
  const base = sb.from("search_logs").select("keyword,created_at").order("created_at", { ascending: false }).limit(3);
  const { data, error } = await base;
  if (error) {
    console.warn("search_logs verify:", error.message);
    return;
  }
  const withCount = await sb
    .from("search_logs")
    .select("keyword,result_count,created_at")
    .order("created_at", { ascending: false })
    .limit(3);
  if (withCount.error) {
    console.log("Latest search_logs (no result_count column):", JSON.stringify(data, null, 2));
    console.warn("hint: apply migration 017 or 023 for search_logs.result_count");
    return;
  }
  console.log("Latest search_logs:", JSON.stringify(withCount.data, null, 2));
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local");
  }

  const sb = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await seedMvnoProducts(sb);
  await clearQaRows(sb);
  await seedQaBrandsAndDiscounts(sb);
  await verifySearchLogs(sb);

  console.log("\nDone. Run API checks: curl/node against http://localhost:3000/api/search?keyword=스타벅스");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
