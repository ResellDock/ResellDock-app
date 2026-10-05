import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|facebookexternalhit|curl|wget|python-requests/i;
const SKIP_PREFIXES = ["/admin", "/api", "/auth"];

function cleanReferrer(referrer, utm, host) {
  const u = String(utm || "").trim().slice(0, 60);
  if (u) return `${u} (campaign link)`;
  const r = String(referrer || "").trim();
  if (!r) return null;
  try {
    const hostname = new URL(r).hostname.replace(/^www\./, "");
    if (!hostname || hostname === String(host || "").replace(/^www\./, "")) return null;
    return hostname.slice(0, 100);
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const ua = request.headers.get("user-agent") || "";
    if (BOT.test(ua)) return NextResponse.json({ ok: true });

    const body = await request.json();
    const visitorId = String(body.visitor_id || "");
    if (!/^[A-Za-z0-9-]{8,64}$/.test(visitorId)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    let path = String(body.path || "/").split("?")[0].slice(0, 300);
    if (!path.startsWith("/")) path = "/";
    if (SKIP_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
      return NextResponse.json({ ok: true });
    }

    const service = createServiceSupabase();
    const now = new Date().toISOString();

    if (body.type === "view") {
      const referrer = cleanReferrer(body.referrer, body.utm_source, request.headers.get("host"));
      await service.from("page_views").insert({ visitor_id: visitorId, path, referrer });
    }

    // Both views and heartbeats keep the visitor "live"
    await service
      .from("live_visitors")
      .upsert({ visitor_id: visitorId, path, last_seen: now }, { onConflict: "visitor_id" });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
