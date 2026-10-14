import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const listingId = String(body.listing_id || "");
    if (!/^[0-9a-fA-F-]{36}$/.test(listingId)) {
      return NextResponse.json({ error: "Invalid listing" }, { status: 400 });
    }

    const reason = String(body.reason || "").slice(0, 200);
    const details = String(body.details || "").slice(0, 1000);
    const reporterEmail = String(body.reporter_email || "").slice(0, 200) || null;
    if (!reason) return NextResponse.json({ error: "Reason required" }, { status: 400 });

    // Reporter may be logged out; record their id if they are logged in
    let reporterId = null;
    try {
      const supabase = createServerSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      reporterId = user?.id || null;
    } catch {}

    const service = createServiceSupabase();
    const { error } = await service.from("listing_reports").insert({
      listing_id: listingId,
      reporter_id: reporterId,
      reporter_email: reporterEmail,
      reason,
      details,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Email the admin inbox if Resend is configured; never fail the report because of it
    if (process.env.RESEND_API_KEY) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reselldock.com";
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Reselldock <notifications@reselldock.com>",
          to: "hello@reselldock.com",
          subject: `Listing reported: ${reason}`,
          text: `Reason: ${reason}\nDetails: ${details || "(none)"}\nReporter: ${reporterEmail || reporterId || "anonymous"}\nListing: ${siteUrl}/listings/${listingId}`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
