import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";
import { getEligibleOrders, RELEASE_DAYS } from "@/lib/payoutEligibility";

// Powers the "Available balance" card in the business wallet tab.
// `available` is what the seller can withdraw right now: the Stripe balance, capped to
// earnings from orders that have been delivered (or shipped more than RELEASE_DAYS ago)
// and have no open problem. `held` is the rest of the Stripe balance.
export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("stripe_account_id").eq("id", user.id).single();
  if (!profile?.stripe_account_id) {
    return NextResponse.json({ connected: false, available: 0, pending: 0, held: 0 });
  }

  try {
    const balance = await stripe.balance.retrieve({ stripeAccount: profile.stripe_account_id });
    const stripeAvailableCents = balance.available.reduce((s, b) => s + b.amount, 0);
    const pending = balance.pending.reduce((s, b) => s + b.amount, 0) / 100;

    const service = createServiceSupabase();
    const { eligibleCents } = await getEligibleOrders(service, user.id);
    const withdrawableCents = Math.min(stripeAvailableCents, eligibleCents);
    const heldCents = Math.max(0, stripeAvailableCents - withdrawableCents);

    return NextResponse.json({
      connected: true,
      available: withdrawableCents / 100,
      pending,
      held: heldCents / 100,
      releaseDays: RELEASE_DAYS,
    });
  } catch (err) {
    return NextResponse.json({ connected: true, available: 0, pending: 0, held: 0, error: err.message });
  }
}
