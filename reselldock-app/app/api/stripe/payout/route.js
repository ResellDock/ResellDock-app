import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabaseServer";

// Powers the "Withdraw to Bank" button. Since connected accounts are created
// with a manual payout schedule, this is the action that actually moves their
// available Stripe balance to their linked bank account.
export async function POST() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("stripe_account_id").eq("id", user.id).single();
  if (!profile?.stripe_account_id) {
    return NextResponse.json({ error: "Connect Stripe first." }, { status: 400 });
  }

  const balance = await stripe.balance.retrieve({ stripeAccount: profile.stripe_account_id });
  const usd = balance.available.find((b) => b.currency === "usd");

  if (!usd || usd.amount <= 0) {
    return NextResponse.json({ error: "No available balance to withdraw yet." }, { status: 400 });
  }

  const payout = await stripe.payouts.create(
    { amount: usd.amount, currency: "usd" },
    { stripeAccount: profile.stripe_account_id }
  );

  return NextResponse.json({ payout });
}
