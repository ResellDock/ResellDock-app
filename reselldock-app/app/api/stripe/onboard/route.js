import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabaseServer";

// Called when a business clicks "Connect Stripe" in their wallet tab.
// Creates a Stripe Express connected account (if they don't have one yet)
// and returns a one-time onboarding link for Stripe's hosted flow.
export async function POST() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "business") {
    return NextResponse.json({ error: "Only businesses can connect Stripe" }, { status: 403 });
  }

  let accountId = profile.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: profile.email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      // Manual payout schedule so the "Withdraw to Bank" button in the wallet
      // tab actually triggers the transfer, instead of Stripe auto-paying-out daily.
      settings: { payouts: { schedule: { interval: "manual" } } },
    });
    accountId = account.id;
    await supabase.from("profiles").update({ stripe_account_id: accountId }).eq("id", user.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/dashboard?tab=wallet`,
    return_url: `${siteUrl}/dashboard?tab=wallet&onboarded=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
