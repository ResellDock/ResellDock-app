import Header from "@/components/Header";
import { createServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

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
          <p className="text-muted text-sm mb-8">Last updated {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="space-y-6 text-sm leading-relaxed text-ink">
              <section>
                <h2 className="font-bold mb-2">1. What Reselldock is</h2>
              <p>
                  Reselldock is a marketplace that connects businesses with wholesale or surplus stock to
                resellers looking to buy it. We provide the platform for listing stock and messaging
                between parties; we are not a party to any sale, and we do not hold, ship, or guarantee
                                any stock listed on the site.
                                  </p>
                                  </section>

          <section>
                                              <h2 className="font-bold mb-2">2. Accounts</h2>
              <p>
                                                You must provide accurate information when creating an account and keep your login secure.
                                                You are responsible for all activity under your account. We may suspend or remove accounts
                that violate these terms or misuse the platform.
                  </p>
                  </section>

          <section>
                              <h2 className="font-bold mb-2">3. Listings</h2>
              <p>
                                Businesses are responsible for the accuracy of their listings, including stock descriptions,
                                quantities, and condition. Reselldock does not verify listings and is not liable for
                                inaccurate, misleading, or fraudulent listings.
                                  </p>
                                  </section>

          <section>
                                              <h2 className="font-bold mb-2">4. Transactions</h2>
              <p>
                                                Any agreement to buy or sell stock is made directly between the business and the reseller.
                                                Reselldock is not responsible for payment, delivery, quality, or any dispute arising from a
                transaction conducted off-platform or facilitated through our messaging tools.
                  </p>
                  </section>

          <section>
                              <h2 className="font-bold mb-2">5. Acceptable use</h2>
              <p>
                                You agree not to use Reselldock to post unlawful, fraudulent, or misleading content, to
                harass other users, or to attempt to circumvent the platform's security or messaging
                                systems.
                  </p>
                  </section>

          <section>
                              <h2 className="font-bold mb-2">6. Changes</h2>
              <p>
                                We may update these terms from time to time. Continued use of Reselldock after changes are
                posted means you accept the updated terms.
                  </p>
                  </section>

          <section>
                              <h2 className="font-bold mb-2">7. Contact</h2>
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
