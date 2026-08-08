import Stripe from "stripe";

// Server-only Stripe client. Requires STRIPE_SECRET_KEY in your environment.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2024-06-20",
});
