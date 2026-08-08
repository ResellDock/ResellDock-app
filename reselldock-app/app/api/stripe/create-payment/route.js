import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";
import { FEE_RATE } from "@/lib/constants";

// Called when a reseller clicks "Pay Now" on a price offer in a message thread.
// Creates a Stripe Checkout Session using the standard Connect "destination charge"
// pattern: the reseller pays the full price, Reselldock keeps `application_fee_amount`
// (2%), and the rest is transferred automatically to the business's connected account.
//
// Stripe Checkout automatically offers Apple Pay, Google Pay, and any other payment
// method you've enabled in the Stripe Dashboard (Settings > Payment methods) —
// no extra code is needed for those.
export async function POST(req) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { messageId } = await req.json();
  const { data: message } = await supabase.from("messages").select("*").eq("id", messageId).single();
  if (!message || message.type !== "offer") {
    return NextResponse.json({ error: "Invalid offer" }, { status: 400 });
  }

  const { data: thread } = await supabase.from("threads").select("*").eq("id", message.thread_id).single();
  if (!thread || thread.reseller_id !== user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { data: business } = await supabase.from("profiles").select("*").eq("id", thread.business_id).single();
  if (!business?.stripe_account_id) {
    return NextResponse.json({ error: "This business hasn't connected Stripe yet." }, { status: 400 });
  }

  const amountCents = Math.round(Number(message.offer_amount) * 100);
  const feeCents = Math.round(amountCents * FEE_RATE);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Reselldock order — ${message.body || "Stock purchase"}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: feeCents,
      transfer_data: { destination: business.stripe_account_id },
    },
    success_url: `${siteUrl}/messages?thread=${thread.id}&paid=1`,
    cancel_url: `${siteUrl}/messages?thread=${thread.id}`,
    metadata: {
      thread_id: thread.id,
      message_id: message.id,
      reseller_id: user.id,
      business_id: thread.business_id,
    },
  });

  // Written with the service-role client: there's intentionally no client-facing
  // INSERT policy on `payments` (see supabase/schema.sql), since payment records
  // should only ever be created by trusted server code — never directly by a user.
  // We've already verified above that this reseller owns this thread/offer.
  const service = createServiceSupabase();
  await service.from("payments").insert({
    thread_id: thread.id,
    message_id: message.id,
    business_id: thread.business_id,
    reseller_id: user.id,
    amount: message.offer_amount,
    fee_amount: feeCents / 100,
    net_amount: (amountCents - feeCents) / 100,
    stripe_checkout_session_id: session.id,
    status: "pending",
  });

  return NextResponse.json({ url: session.url });
}
