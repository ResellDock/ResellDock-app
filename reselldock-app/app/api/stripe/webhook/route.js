import { stripe } from "@/lib/stripe";
import { createServiceSupabase } from "@/lib/supabaseServer";
import { sendSaleEmails } from "@/lib/email";

// Stripe calls this URL directly (not the browser), so it uses the raw request
// body + signature header to verify the event really came from Stripe, and uses
// the service-role Supabase client since there's no logged-in user in this request.
//
// In the Stripe Dashboard, add this endpoint as: https://YOUR-DOMAIN/api/stripe/webhook
// and subscribe it to the "checkout.session.completed" event.

function generateConfirmationNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RD-";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

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

  // Generate a unique, human-readable confirmation number for this sale. This is
  // what appears on the shipping/receipt PDF and the public /verify page, so both
  // sides have an independent record that the transaction really happened.
  let confirmationNumber = generateConfirmationNumber();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("confirmation_number", confirmationNumber)
    .maybeSingle();
    if (!existing) break;
    confirmationNumber = generateConfirmationNumber();
  }

  const shipping = session.shipping_details;
  const customer = session.customer_details;

  await supabase
  .from("payments")
  .update({
    status: "paid",
    stripe_payment_intent_id: session.payment_intent,
    confirmation_number: confirmationNumber,
    shipping_name: shipping?.name || customer?.name || null,
    shipping_phone: customer?.phone || null,
    shipping_address_line1: shipping?.address?.line1 || null,
    shipping_address_line2: shipping?.address?.line2 || null,
    shipping_city: shipping?.address?.city || null,
    shipping_state: shipping?.address?.state || null,
    shipping_postal_code: shipping?.address?.postal_code || null,
    shipping_country: shipping?.address?.country || null,
  })
  .eq("stripe_checkout_session_id", session.id);

  if (session.metadata?.thread_id) {
    await supabase.from("messages").insert({
      thread_id: session.metadata.thread_id,
      sender_id: null,
      type: "system",
      body: `Payment completed via Stripe. Confirmation #${confirmationNumber}. Funds sent to the business's connected Stripe account (minus the 2% Reselldock fee).`,
    });

  // The sale is complete — mark the listing this thread was about as sold
  // so it drops off the reseller feed and shows as sold in the business dashboard.
  const { data: thread } = await supabase
    .from("threads")
    .select("listing_id")
    .eq("id", session.metadata.thread_id)
    .single();

  if (thread?.listing_id) {
    await supabase
    .from("listings")
    .update({ status: "sold", sold_at: new Date().toISOString() })
    .eq("id", thread.listing_id);

    await supabase
    .from("payments")
    .update({ listing_id: thread.listing_id })
    .eq("stripe_checkout_session_id", session.id);

    await supabase.from("messages").insert({
      thread_id: session.metadata.thread_id,
      sender_id: null,
      type: "system",
      body: "This listing has been marked as sold and removed from the feed. Your shipping documentation and receipt are ready to download above.",
    });
  }

  // Email both parties an independent confirmation with the confirmation number,
  // a sale summary, a document download link, and a public verify link — this is
  // the anti-scam safeguard: a paper trail neither party can quietly alter.
  const { data: payment } = await supabase
    .from("payments")
    .select(
      "*, business:profiles!payments_business_id_fkey(name,email), reseller:profiles!payments_reseller_id_fkey(name,email)"
      )
    .eq("stripe_checkout_session_id", session.id)
    .single();

  if (payment) {
    await sendSaleEmails(payment);
    await supabase.from("payments").update({ documents_emailed: true }).eq("id", payment.id);
  }
  }
}

return new Response("ok", { status: 200 });
}
