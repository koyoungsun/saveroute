import { NextResponse } from "next/server";

import { loadAdminOpsPanelData } from "@/lib/admin/ops-panel-data";
import { resolveAdminGate } from "@/lib/admin/auth";

export async function GET() {
  const gate = await resolveAdminGate();

  if (gate.type === "login") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (gate.type === "denied") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (gate.type === "schema") {
    return NextResponse.json({ error: gate.detail }, { status: 503 });
  }

  try {
    const payload = await loadAdminOpsPanelData();
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load ops panel data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
