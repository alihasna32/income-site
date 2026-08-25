import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("conversion_settings")
      .select("id,coins_per_taka,is_active,updated_at")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ ok: true, conversion: null });
    return NextResponse.json({ ok: true, conversion: data });
  } catch (err) {
    console.error("/api/conversion-rate GET", err?.message || err);
    return NextResponse.json({ error: "Could not fetch conversion rate" }, { status: 500 });
  }
}
