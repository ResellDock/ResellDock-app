import { stripe } from "@/lib/stripe";
import { createServiceSupabase } from "@/lib/supabaseServer";

// Stripe calls this URL directly (not the browser), so it uses the raw request
// body + signature header to verify the event really came from Stripe, and uses
// the service-role Supabase client since there's no logged-in user in this request.
//
// In the Stripe Dashboard, add this endpoint as:  https://YOUR-DOMAIN/api/stripe/webhook
// and subscribe it to the "checkout.session.completed" event.
export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const supabase = createServiceSupabase();

    await supabase
      .from("payments")
      .update({ status: "paid", stripe_payment_intent_id: session.payment_intent })
      .eq("stripe_checkout_session_id", session.id);

    if (session.metadata?.thread_id) {
      await supabase.from("messages").insert({
        thread_id: session.metadata.thread_id,
        sender_id: null,
        type: "system",
        body: "✅ Payment completed via Stripe. Funds sent to the business's connected Stripe account (minus the 2% Reselldock fee).",
      });
    }
  }

  return new Response("ok", { status: 200 });
}
