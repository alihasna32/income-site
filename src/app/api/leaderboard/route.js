import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { startOfPeriod } from "@/lib/utils/format";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all";
  const metric = searchParams.get("metric") || "xp";
  const me = searchParams.get("me") || null;
  const limit = Math.min(50, Math.max(5, Number(searchParams.get("limit") || 20)));

  if (!supabaseReady()) {
    return NextResponse.json({ entries: [] });
  }

  const admin = createAdminClient();
  const since = startOfPeriod(period);
  let entries = [];

  try {
    if (metric === "xp") {
      const { data, error } = await admin
        .from("profiles")
        .select("id, display_name, username, xp")
        .order("xp", { ascending: false })
        .limit(limit);
      if (!error && data) {
        entries = data.map((row, i) => ({
          userId: row.id,
          name: row.display_name || row.username,
          username: row.username,
          value: row.xp,
          rank: i + 1,
        }));
      }
    } else if (metric === "coins" && since) {
      const { data, error } = await admin
        .from("wallet_transactions")
        .select("user_id, amount")
        .gt("amount", 0)
        .gte("created_at", since);
      if (!error && data) {
        const totals = {};
        for (const row of data) {
          totals[row.user_id] = (totals[row.user_id] || 0) + row.amount;
        }
        const ids = Object.keys(totals);
        const { data: profiles } = ids.length
          ? await admin.from("profiles").select("id, display_name, username").in("id", ids)
          : { data: [] };
        const nameMap = new Map((profiles || []).map((p) => [p.id, p]));
        entries = Object.entries(totals)
          .map(([userId, value]) => ({
            userId,
            name: nameMap.get(userId)?.display_name || nameMap.get(userId)?.username || "Player",
            username: nameMap.get(userId)?.username || "",
            value,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, limit)
          .map((row, i) => ({ ...row, rank: i + 1 }));
      }
    } else if (metric === "games" && since) {
      const { data, error } = await admin
        .from("game_sessions")
        .select("user_id")
        .gte("created_at", since);
      if (!error && data) {
        const counts = {};
        for (const row of data) {
          counts[row.user_id] = (counts[row.user_id] || 0) + 1;
        }
        const ids = Object.keys(counts);
        const { data: profiles } = ids.length
          ? await admin.from("profiles").select("id, display_name, username").in("id", ids)
          : { data: [] };
        const nameMap = new Map((profiles || []).map((p) => [p.id, p]));
        entries = Object.entries(counts)
          .map(([userId, value]) => ({
            userId,
            name: nameMap.get(userId)?.display_name || nameMap.get(userId)?.username || "Player",
            username: nameMap.get(userId)?.username || "",
            value,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, limit)
          .map((row, i) => ({ ...row, rank: i + 1 }));
      }
    } else {
      // coins all-time
      const { data, error } = await admin
        .from("wallets")
        .select("user_id, total_earned")
        .order("total_earned", { ascending: false })
        .limit(limit);
      if (!error && data) {
        const ids = data.map((row) => row.user_id);
        const { data: profiles } = await admin
          .from("profiles")
          .select("id, display_name, username")
          .in("id", ids);
        const nameMap = new Map((profiles || []).map((p) => [p.id, p]));
        entries = data.map((row, i) => ({
          userId: row.user_id,
          name: nameMap.get(row.user_id)?.display_name || nameMap.get(row.user_id)?.username || "Player",
          username: nameMap.get(row.user_id)?.username || "",
          value: row.total_earned,
          rank: i + 1,
        }));
      }
    }
  } catch {
    return NextResponse.json({ entries: [] });
  }

  const myRank = me
    ? entries.find((entry) => entry.userId === me)?.rank || null
    : null;

  return NextResponse.json({ entries, period, metric, myRank });
}