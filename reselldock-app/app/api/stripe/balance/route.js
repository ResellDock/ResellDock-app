import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabaseServer";

// Powers the "Available balance" card in the business wallet tab.
// We don't keep our own ledger of held funds — Stripe already tracks this per
// connected account, so we just read it live.
export async function GET() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("stripe_account_id").eq("id", user.id).single();
  if (!profile?.stripe_account_id) {
    return NextResponse.json({ connected: false, available: 0, pending: 0 });
  }

  try {
    const balance = await stripe.balance.retrieve({ stripeAccount: profile.stripe_account_id });
    const available = balance.available.reduce((s, b) => s + b.amount, 0) / 100;
    const pending = balance.pending.reduce((s, b) => s + b.amount, 0) / 100;
    return NextResponse.json({ connected: true, available, pending });
  } catch (err) {
    return NextResponse.json({ connected: true, available: 0, pending: 0, error: err.message });
  }
}
