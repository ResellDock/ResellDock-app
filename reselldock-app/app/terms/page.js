import Header from "@/components/Header";
import { createServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    title: "1. What Reselldock is",
    body: [
      "Reselldock is an online marketplace that connects businesses with wholesale or surplus stock to resellers and trade buyers looking to buy it. We provide the platform for listing stock, messaging between parties and taking payment through our payment provider, Stripe. Unless a sale page says otherwise, we are not the seller or the buyer, and we do not hold, inspect, ship or guarantee any stock listed on the site.",
    ],
  },
  {
    title: "2. Trade use only",
    body: [
      "Reselldock is for businesses and trade buyers. By creating an account you confirm that you are acting for the purposes of a trade, business or profession and not as a consumer. Consumer rights such as the 14 day cancellation right do not apply to sales between business users on the platform.",
    ],
  },
  {
    title: "3. Accounts",
    body: [
      "You must provide accurate information when creating an account and keep your login secure. You are responsible for all activity under your account. We may suspend or remove accounts that break these terms or misuse the platform.",
    ],
  },
  {
    title: "4. Listings and seller responsibilities",
    body: [
      "Sellers are responsible for their listings, including stock descriptions, quantities, condition, photos and price. Reselldock does not verify listings and is not liable for inaccurate, misleading or fraudulent listings.",
      "By posting a listing you confirm and promise that: (a) you own the goods or have the right to sell them; (b) the goods are genuine, not counterfeit and do not infringe anyone's trade mark, copyright or other rights; (c) the goods comply with UK law, including product safety, labelling, marking and electrical, battery and waste rules that apply to them; (d) the description is accurate and not misleading; and (e) you are responsible for any VAT, duties and other taxes on your sales.",
      "Sellers must provide the information, safety warnings and documents that the law requires for the goods they sell.",
    ],
  },
  {
    title: "5. Restricted goods",
    body: [
      "You must not list, offer or arrange the sale of any of the following on Reselldock: alcohol, tobacco, vapes and e-cigarettes, knives and bladed items, medicines, and any other age-restricted item. We also do not allow weapons, illegal drugs, counterfeit or stolen goods, or anything else that is illegal to sell or advertise in the United Kingdom.",
      "We may use automated checks to detect restricted goods, and we may reject or remove any listing without notice if we think it is restricted.",
    ],
  },
  {
    title: "6. Transactions, payments and fees",
    body: [
      "Any agreement to buy or sell stock is made between the seller and the buyer. Payments made through the platform are processed by Stripe and are also subject to Stripe's terms. Reselldock charges a 2% fee on each completed sale made through the platform. Listing is free.",
      "Sellers are responsible for dispatching goods as described, and buyers are responsible for paying for them. Reselldock is not responsible for delivery, quality or any dispute arising from a transaction, whether it takes place through the platform or off it.",
    ],
  },
  {
    title: "7. Shipping, customs and taxes",
    body: [
      "Sellers arrange shipping and are responsible for packaging, delivery, and the accuracy of any shipping document. Where goods cross a border, the parties are responsible for import and export rules, customs declarations, duties and VAT. Reselldock does not act as importer, exporter or carrier.",
    ],
  },
  {
    title: "8. Acceptable use",
    body: [
      "You agree not to use Reselldock to post unlawful, fraudulent or misleading content, to harass other users, to scrape the site, or to attempt to circumvent the platform's security, payment or messaging systems.",
    ],
  },
  {
    title: "9. Illegal content and reporting",
    body: [
      "We do not allow illegal content on Reselldock, including illegal goods, fraud, threats, harassment, and content that infringes someone's rights. Every listing has a Report this listing link. You can also email hello@reselldock.com to report a listing, a message or an account.",
      "We review reports promptly, and we remove illegal content as soon as we become aware of it. We may remove listings, suspend or close accounts, and pass information to the police, regulators or rights holders where the law allows or requires us to. We will tell the affected user why action was taken unless the law prevents us from doing so.",
      "If you are a rights holder and believe a listing infringes your rights, send the listing link and details of your rights to hello@reselldock.com.",
    ],
  },
  {
    title: "10. Disputes between users",
    body: [
      "If you have a problem with a transaction, first contact the other party through Reselldock messages and try to resolve it. If that fails, email hello@reselldock.com with your order details. We may help the parties communicate and may, at our discretion, remove listings or accounts, but we are not required to decide the dispute. Nothing in this section limits your legal rights against the other party or your payment provider.",
    ],
  },
  {
    title: "11. Our right to remove content and suspend accounts",
    body: [
      "We may remove any listing, message or account, or refuse a payment, at any time if we reasonably believe it breaks these terms or the law, creates a risk of harm or fraud, or if we are asked to by a regulator, court or rights holder.",
    ],
  },
  {
    title: "12. Limits on our liability",
    body: [
      "Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot be limited by law.",
      "Subject to that, Reselldock is provided on an as available basis. We are not liable for the acts or omissions of sellers or buyers, for the quality, safety, legality or description of goods listed, or for loss of profit, revenue, business or goodwill, or any indirect loss. Our total liability to you for any claim connected with the platform is limited to the fees you paid to Reselldock in the 12 months before the claim arose.",
    ],
  },
  {
    title: "13. Your data and cookies",
    body: [
      "How we use personal data is set out in our Privacy Policy. How we use cookies and similar storage is set out in our Cookie Notice.",
    ],
  },
  {
    title: "14. Changes",
    body: [
      "We may update these terms from time to time. Continued use of Reselldock after changes are posted means you accept the updated terms.",
    ],
  },
  {
    title: "15. Governing law",
    body: [
      "These terms are governed by the law of England and Wales, and the courts of England and Wales have exclusive jurisdiction, except that nothing prevents either party from bringing a claim where it is required by law to do so elsewhere.",
    ],
  },
];

export default async function TermsPage() {
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
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Terms of Service</h1>
        <p className="text-muted text-sm mb-8">Last updated 14 October 2026</p>

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
            <h2 className="font-bold mb-2">16. Contact</h2>
            <p>
              Questions about these terms? Email us at{" "}
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
