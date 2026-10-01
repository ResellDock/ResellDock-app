import Header from "@/components/Header";
import { createServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

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
          <p className="text-muted text-sm mb-8">Last updated {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="space-y-6 text-sm leading-relaxed text-ink">
              <section>
                <h2 className="font-bold mb-2">1. Information we collect</h2>
              <p>
                  When you create an account we collect your name, email address, and account type (business
                                                                                                                  or reseller). Businesses may additionally provide a business name, phone number, and
                shipping address. We also store the listings, messages, and interest/partnership actions
                you create while using Reselldock.
                  </p>
                  </section>

          <section>
                              <h2 className="font-bold mb-2">2. How we use it</h2>
              <p>
                                We use your information to operate the marketplace: to sign you in, to show your listings
                and messages, to notify you when a business you follow posts new stock, and to improve the
                service. We do not sell your personal information to third parties.
                  </p>
                  </section>

          <section>
                              <h2 className="font-bold mb-2">3. Sharing between users</h2>
              <p>
                                When you message a business or reseller through Reselldock, that user can see the name and
                details you choose to share in the conversation. We are not responsible for how another
                user handles information you share with them directly.
                  </p>
                  </section>

          <section>
                              <h2 className="font-bold mb-2">4. Storage and security</h2>
              <p>
                                Your data is stored with Supabase, our database and authentication provider, using
                industry-standard security practices. We take reasonable steps to protect your information
                but cannot guarantee absolute security of data transmitted online.
                  </p>
                  </section>

          <section>
                              <h2 className="font-bold mb-2">5. Cookies and sign-in</h2>
              <p>
                                We use essential cookies to keep you signed in and to remember your session. We don't use
                                third-party advertising or tracking cookies.
                  </p>
                  </section>

          <section>
                              <h2 className="font-bold mb-2">6. Your rights</h2>
              <p>
                                You can update your profile information at any time from your account page. To request
                deletion of your account and associated data, email us and we will action your request.
                  </p>
                  </section>

          <section>
                              <h2 className="font-bold mb-2">7. Contact</h2>
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
