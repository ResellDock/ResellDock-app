import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function sendEmail(to, subject, text) {
  if (!process.env.RESEND_API_KEY || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Reselldock <notifications@reselldock.com>",
        to,
        subject,
        text,
      }),
    });
  } catch {}
}

// PATCH /api/orders/:id  { action: "ship" | "received" | "dispute", carrier, tracking_number, reason }
export async function PATCH(request, { params }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const service = createServiceSupabase();
  const { data: order } = await service
    .from("payments")
    .select(
      "*, business:profiles!payments_business_id_fkey(name,email), reseller:profiles!payments_reseller_id_fkey(name,email)"
    )
    .eq("id", params.id)
    .single();
  if (!order || order.status !== "paid") {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reselldock.com";
  const ref = order.confirmation_number || order.id;
  const now = new Date().toISOString();

  if (body.action === "ship") {
    if (user.id !== order.business_id) {
      return NextResponse.json({ error: "Only the seller can mark an order as shipped" }, { status: 403 });
    }
    const carrier = String(body.carrier || "").trim().slice(0, 60);
    const tracking = String(body.tracking_number || "").trim().slice(0, 80);
    if (!carrier) return NextResponse.json({ error: "Carrier is required" }, { status: 400 });

    await service
      .from("payments")
      .update({ carrier, tracking_number: tracking || null, shipped_at: now })
      .eq("id", order.id);

    await sendEmail(
      order.reseller?.email,
      `Your order ${ref} has been dispatched`,
      `Good news: the seller has dispatched your order ${ref}.\n\nCarrier: ${carrier}\nTracking number: ${tracking || "not provided"}\n\nWhen it arrives, please confirm receipt here: ${siteUrl}/orders\nIf something is wrong, you can report a problem from the same page.`
    );
    return NextResponse.json({ ok: true });
  }

  if (body.action === "received") {
    if (user.id !== order.reseller_id) {
      return NextResponse.json({ error: "Only the buyer can confirm receipt" }, { status: 403 });
    }
    await service.from("payments").update({ delivered_at: now }).eq("id", order.id);
    await sendEmail(
      order.business?.email,
      `Order ${ref} confirmed as received`,
      `The buyer has confirmed they received order ${ref}. Thank you for selling on Reselldock.`
    );
    return NextResponse.json({ ok: true });
  }

  if (body.action === "dispute") {
    if (user.id !== order.reseller_id) {
      return NextResponse.json({ error: "Only the buyer can report a problem" }, { status: 403 });
    }
    const reason = String(body.reason || "").trim().slice(0, 1000);
    if (!reason) return NextResponse.json({ error: "Please describe the problem" }, { status: 400 });

    await service.from("payments").update({ disputed_at: now, dispute_reason: reason }).eq("id", order.id);

    const msg = `Order ${ref}\nBuyer: ${order.reseller?.name || ""} (${order.reseller?.email || ""})\nSeller: ${order.business?.name || ""} (${order.business?.email || ""})\n\nProblem reported:\n${reason}\n\nReview in admin: ${siteUrl}/admin`;
    await sendEmail("hello@reselldock.com", `Order problem reported: ${ref}`, msg);
    await sendEmail(
      order.business?.email,
      `A problem was reported on order ${ref}`,
      `The buyer has reported a problem with order ${ref}:\n\n${reason}\n\nPlease reply to the buyer through Reselldock messages to resolve it. You can also email hello@reselldock.com.`
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
