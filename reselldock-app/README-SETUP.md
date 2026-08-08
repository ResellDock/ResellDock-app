# Reselldock — Setup & Launch Guide

This is a real, working version of Reselldock: Next.js app, Supabase for the
database/accounts, and Stripe Connect for payments (2% platform fee, businesses
get paid out to their own bank account).

A quick note on how this was built: it was written and reviewed carefully (every
file checked for correct imports, matching API routes, and matching database
policies), but this environment's sandbox blocks access to the npm package
registry, so `npm install` and `next build` could not actually be run here.
**Your first step below (Local setup) will surface any remaining issues** —
if `npm run build` errors out, paste the error back and it'll get fixed.

---

## 1. Create your Supabase project (database + accounts)

1. Go to [supabase.com](https://supabase.com) → New Project. Free tier is fine to start.
2. Once it's created, go to **SQL Editor → New query**, paste the entire contents
   of `supabase/schema.sql` from this project, and click **Run**. This creates all
   the tables (profiles, listings, messages, payments, etc.) and the security rules
   that keep users' data properly isolated.
3. Go to **Database → Replication** and turn on Realtime for the `messages` table
   (this is what makes the chat update live without refreshing).
4. Go to **Authentication → URL Configuration** and set:
   - Site URL: your deployed URL (or `http://localhost:3000` while testing locally)
   - Redirect URLs: add `.../auth/callback` for each URL you use (localhost and your real domain)
5. Go to **Project Settings → API** and copy three values — you'll need them in step 4 below:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this one secret — never expose it in the browser)

## 2. Set up Stripe Connect

You said you already have a Stripe account — a couple of things to turn on:

1. In the Stripe Dashboard, go to **Connect → Get started** (or **Settings → Connect**)
   and enable Connect if you haven't already. This lets businesses create their own
   sub-accounts to receive payouts.
2. Go to **Developers → API keys** and copy your **test mode** secret key
   (`sk_test_...`) → this is `STRIPE_SECRET_KEY`. Stay in test mode until you're
   ready to actually take real payments.
3. Webhook: go to **Developers → Webhooks → Add endpoint**.
   - Endpoint URL: `https://YOUR-DOMAIN/api/stripe/webhook` (you'll only have this
     URL once it's deployed — see step 5, then come back and add the webhook)
   - Event to send: `checkout.session.completed`
   - After creating it, copy the **Signing secret** (`whsec_...`) → this is `STRIPE_WEBHOOK_SECRET`
4. Optional but recommended: in **Settings → Payment methods**, make sure Apple Pay,
   Google Pay, and any others you want (PayPal, etc.) are switched on. Stripe
   Checkout automatically shows whichever ones are enabled here — no code changes needed.

## 3. (Optional) Email notifications for "new stock from businesses you follow"

This uses [Resend](https://resend.com) (free tier: 3,000 emails/month). If you skip
this, everything else still works — listings just won't trigger an email.

1. Sign up at resend.com, verify a sending domain (or use their test domain while developing).
2. Create an API key → this is `RESEND_API_KEY`.
3. Set `EMAIL_FROM` to something like `Reselldock <notifications@yourdomain.com>`.

## 4. Local setup (do this first, before deploying)

```bash
cd reselldock-app
npm install
cp .env.example .env.local
```

Open `.env.local` and fill in the values from steps 1–3 above (`NEXT_PUBLIC_SITE_URL`
can stay as `http://localhost:3000` for now).

```bash
npm run build   # confirms everything compiles — report any errors back
npm run dev     # runs it locally at http://localhost:3000
```

Test the flow: sign up as a Business (magic-link email), post a listing, sign up
as a Reseller in an incognito window, click Interested, send a price in Messages
as the business, click Pay Now as the reseller. Use Stripe's test card
`4242 4242 4242 4242`, any future expiry, any CVC.

## 5. Deploy to make it live

**Easiest path — Vercel:**

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → New Project → import that repo.
3. In the project's **Settings → Environment Variables**, add every variable from
   your `.env.local` file.
4. Set `NEXT_PUBLIC_SITE_URL` to whatever URL Vercel gives you (e.g.
   `https://reselldock.vercel.app`), redeploy once you know it.
5. Go back to Supabase (**Authentication → URL Configuration**) and Stripe
   (**Webhooks**) and update the URLs there to match your real deployed URL.

## 6. Connect the reselldock.com domain (once you've bought it)

1. Buy `reselldock.com` from any registrar (Namecheap is usually cheaper long-term
   than GoDaddy — roughly $9–11 for the first year, ~$15–19/year after).
2. In Vercel: **Project → Settings → Domains → Add** → enter `reselldock.com`.
3. Vercel will show you either an A record or nameservers to add at your registrar.
   Add exactly what it shows you — usually takes a few minutes to a few hours to go live.
4. Update `NEXT_PUBLIC_SITE_URL`, the Supabase redirect URL, and the Stripe webhook
   URL one more time to use `https://reselldock.com`, then redeploy.

## 7. Going from test mode to real money

Everything above uses Stripe **test mode** — no real cards are charged. When
you're ready to accept real payments:

1. In Stripe, finish **Activate your account** (business details, bank account for payouts).
2. Swap `STRIPE_SECRET_KEY` for your **live** secret key, and create a new live-mode
   webhook endpoint (same URL, new signing secret).
3. Every business will need to complete Stripe's onboarding again in live mode
   (the "Connect Stripe" button in their Wallet tab) before they can get paid.

---

## What's simplified in this version (worth knowing)

- **Sign-in is magic-link** (email only, no password) — matches the "just enter
  your name and email" requirement, but means each sign-in requires clicking an
  emailed link. Swap for password auth in `components/GateForm.js` if you'd rather not.
- **Account type is fixed at signup** (Reseller or Business) rather than freely
  toggle-able — a business and a reseller are different rows in the database.
  Supporting both from one account is a bigger change (worth doing later if needed).
- **No image uploads yet** — listings show a placeholder graphic. Supabase Storage
  is the natural place to add this.
- **The wallet balance is read live from Stripe**, not stored in your own database —
  this is intentional (Stripe is the source of truth for money), but means the
  "Total sales" figure reflects Stripe's numbers, not a custom ledger.
- **One currency (USD)** is hardcoded — fine for a US-first launch, but flag it if
  you need multi-currency later.

## Project structure

```
app/                  Pages and API routes (Next.js App Router)
  api/                Server endpoints (listings, interest, partner, messages,
                       offer, and all the /api/stripe/* payment endpoints)
  feed, listings,      The reseller-facing pages
  messages, dashboard/  Messages inbox + the business dashboard
components/           Client-side React components
lib/                  Supabase + Stripe helper clients, shared constants
supabase/schema.sql   Full database schema + security rules — run this once in Supabase
```
