import Header from "@/components/Header";
import { createServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    title: "1. Who we are",
    body: [
      "Reselldock (reselldock.com) is an online marketplace for wholesale and surplus stock. We are the controller of the personal data described in this policy. You can contact us at hello@reselldock.com.",
    ],
  },
  {
    title: "2. What we collect",
    body: [
      "Account data: your name, email address, account type (business or reseller) and, for businesses, a business name, phone number and shipping address.",
      "Marketplace activity: the listings, photos, messages, offers, interests, partnerships and orders you create, and the shipping documents and receipts we generate for sales.",
      "Payment data: payments are handled by Stripe. We receive payment status, amounts and the identifiers needed to match payments to orders. We do not see or store your full card number.",
      "Reports: if you report a listing, we store the reason, any details you add, your email address if you give it, and your account ID if you are signed in.",
      "Analytics (only if you accept cookies): a random visitor ID, the pages you view, the website or campaign that referred you, and a timestamp. See our Cookie Notice.",
      "Technical data: standard server logs such as IP address and browser type, which our hosting provider keeps for security and troubleshooting.",
    ],
  },
  {
    title: "3. Why we use it and our legal basis",
    body: [
      "To provide the marketplace, sign you in, show your listings and messages, process orders and send you notifications about your account, orders and the businesses you follow. Legal basis: performing our contract with you.",
      "To keep the platform safe, handle reports, prevent fraud and meet legal obligations such as tax and accounting records. Legal bases: legitimate interests and legal obligation.",
      "To understand how the site is used and improve it, using analytics. Legal basis: your consent, which you can decline.",
      "To email businesses about Reselldock for business-to-business marketing. Legal basis: legitimate interests, and you can ask us to stop at any time by replying to the email.",
      "We do not sell your personal information.",
    ],
  },
  {
    title: "4. Who we share it with",
    body: [
      "Other users: when you message or trade with another user, they can see the details you choose to share and the information needed to complete the order, such as a delivery address. We are not responsible for how another user handles information you share with them.",
      "Service providers who process data for us: Supabase (database and sign-in, hosted in the EU), Stripe (payments), Resend (emails) and Vercel (website hosting). They may only use data to provide their services to us.",
      "Authorities and rights holders: where the law requires, or where needed to deal with illegal content, fraud or a legal claim.",
    ],
  },
  {
    title: "5. International transfers",
    body: [
      "Some of our providers may process data outside the UK, for example in the United States. Where they do, we rely on safeguards recognised by UK law such as the UK International Data Transfer Agreement or addendum and adequacy arrangements.",
    ],
  },
  {
    title: "6. How long we keep it",
    body: [
      "We keep account data while your account is open. If you ask us to delete your account we will remove or anonymise your personal data, except records we must keep by law, such as order and payment records, which are generally kept for six years for tax and accounting purposes.",
      "Reports are kept for as long as needed to handle them and to show how we responded. Analytics data is kept only as long as needed for site statistics.",
    ],
  },
  {
    title: "7. Your rights",
    body: [
      "Under UK data protection law you have the right to access your personal data, correct it, delete it, restrict or object to how we use it, move it to another service, and withdraw consent at any time where we rely on consent. To use any of these rights, email hello@reselldock.com. We will normally reply within one month.",
      "You can update your profile from your account page. If you are unhappy with how we handle your data you can complain to the Information Commissioner's Office at ico.org.uk.",
    ],
  },
  {
    title: "8. Security",
    body: [
      "We use industry-standard measures to protect your data, including encrypted connections and access controls. No online service can guarantee absolute security.",
    ],
  },
  {
    title: "9. Cookies",
    body: [
      "We use essential storage to keep you signed in. We only use analytics storage if you accept it. We do not use advertising cookies. Full details are in our Cookie Notice.",
    ],
  },
  {
    title: "10. Changes",
    body: [
      "We may update this policy from time to time. The date at the top shows when it was last changed.",
    ],
  },
];

export default async function PrivacyPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  return (
    <div>
      <Header profile={profile} />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Privacy Policy</h1>
        <p className="text-muted text-sm mb-8">Last updated 19 October 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-ink">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-bold mb-2">{s.title}</h2>
              {s.body.map((p, i) => (
                <p key={i} className={i > 0 ? "mt-2" : ""}>
                  {p}
                </p>
              ))}
            </section>
          ))}

          <section>
            <h2 className="font-bold mb-2">11. Contact</h2>
            <p>
              Questions about this policy? Email us at{" "}
              <a href="mailto:hello@reselldock.com" className="text-brand-dark underline">
                hello@reselldock.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
