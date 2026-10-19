import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";
import { getEligibleOrders, RELEASE_DAYS } from "@/lib/payoutEligibility";

// Powers the "Withdraw to Bank" button. Connected accounts use a manual payout schedule,
// so this is the action that moves their available Stripe balance to their bank account.
// Only earnings from released orders can be withdrawn (see lib/payoutEligibility.js):
// the buyer confirmed delivery, or the order was shipped more than RELEASE_DAYS ago, and
// no problem has been reported.
export async function POST() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("stripe_account_id").eq("id", user.id).single();
  if (!profile?.stripe_account_id) {
    return NextResponse.json({ error: "Connect Stripe first." }, { status: 400 });
  }

  const balance = await stripe.balance.retrieve({ stripeAccount: profile.stripe_account_id });
  const gbp = balance.available.find((b) => b.currency === "gbp");
  const availableCents = gbp ? gbp.amount : 0;

  const service = createServiceSupabase();
  const { eligible, eligibleCents } = await getEligibleOrders(service, user.id);
  const amount = Math.min(availableCents, eligibleCents);

  if (amount <= 0) {
    return NextResponse.json(
      {
        error: `No funds are ready to withdraw yet. Earnings are released when the buyer confirms delivery, or ${RELEASE_DAYS} days after you mark the order as shipped.`,
      },
      { status: 400 }
    );
  }

  const payout = await stripe.payouts.create(
    { amount, currency: "gbp" },
    { stripeAccount: profile.stripe_account_id }
  );

  // Mark the oldest eligible orders as paid out until the payout amount is covered
  let remaining = amount;
  const ids = [];
  for (const o of eligible) {
    const cents = Math.round(Number(o.net_amount || 0) * 100);
    if (cents <= remaining) {
      ids.push(o.id);
      remaining -= cents;
    }
  }
  if (ids.length > 0) {
    await service.from("payments").update({ paid_out_at: new Date().toISOString() }).in("id", ids);
  }

  return NextResponse.json({ payout });
}
