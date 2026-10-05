import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const LIVE_WINDOW_MS = 2 * 60 * 1000; // a visitor counts as live if seen in the last 2 minutes

export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceSupabase();
  const { data: me } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const since = new Date(Date.now() - LIVE_WINDOW_MS).toISOString();
  const { data: rows } = await service
    .from("live_visitors")
    .select("path, last_seen")
    .gte("last_seen", since);

  // Tidy up old heartbeat rows (older than a day)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await service.from("live_visitors").delete().lt("last_seen", cutoff);

  const byPath = {};
  (rows || []).forEach((r) => {
    byPath[r.path] = (byPath[r.path] || 0) + 1;
  });
  const pages = Object.entries(byPath)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return NextResponse.json({ count: (rows || []).length, pages });
}
