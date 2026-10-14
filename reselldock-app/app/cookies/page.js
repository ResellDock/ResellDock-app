import Header from "@/components/Header";
import { createServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function CookiesPage() {
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
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Cookie Notice</h1>
        <p className="text-muted text-sm mb-8">Last updated 14 October 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-ink">
          <section>
            <h2 className="font-bold mb-2">Essential storage</h2>
            <p>
              We use cookies and browser storage that are needed to keep you signed in and keep the
              site secure. These are strictly necessary, so they are always on and do not need your
              consent.
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-2">Analytics (only if you accept)</h2>
            <p>
              If you click Accept, we store a random visitor ID (called rd_vid) in your browser. We
              use it to count visits, see which pages are viewed, see which site or campaign link
              brought you here, and show how many people are on the site right now. It is not linked
              to your name or email and is not shared with advertisers. If you click Decline, we do
              not set this ID and we do not record your visit.
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-2">Your choice</h2>
            <p>
              Your choice is remembered in your browser under the name rd_consent. To change it, clear
              this site's data in your browser settings and the banner will appear again.
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-2">Contact</h2>
            <p>
              Questions? Email{" "}
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
