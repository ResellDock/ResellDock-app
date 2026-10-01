import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabaseServer";
import Header from "@/components/Header";
import ListingCard from "@/components/ListingCard";
import { CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }) {
      const supabase = createServerSupabase();
      const {
              data: { user },
      } = await supabase.auth.getUser();

  let profile = null;
      if (user) {
              const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
              profile = data;
              if (profile?.role === "admin") redirect("/admin");
      }

  const selectedCategory = searchParams?.category || "All";

  let query = supabase
        .from("listings")
        .select("*, business:profiles(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

  if (selectedCategory !== "All") {
          query = query.eq("category", selectedCategory);
  }

  const { data: listings } = await query;

  let partneredIds = new Set();
      if (user) {
              const { data: partnerships } = await supabase
                .from("partnerships")
                .select("business_id")
                .eq("reseller_id", user.id);
              partneredIds = new Set((partnerships || []).map((p) => p.business_id));
      }

  const tabs = ["All", ...CATEGORIES];

  return (
          <div>
            <Header profile={profile} />
            <main className="max-w-5xl mx-auto px-5 py-7">
              <h1 className="text-2xl font-extrabold tracking-tight mb-1">Stock Feed</h1>
            <p className="text-muted text-sm mb-6">
                Fresh listings from businesses on Reselldock. No prices shown — click Interested to start a conversation.
      </p>
    {!user && (
                  <div className="bg-brand-soft border border-brand rounded-xl2 px-4 py-3 mb-6 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm text-brand-dark font-semibold">
                      Sign up free to message businesses, express interest, and list stock.
        </span>
                 <Link
                   href="/login"
                   className="bg-brand text-white text-xs font-bold px-3.5 py-2 rounded-full whitespace-nowrap"
                 >
                                     Sign up
                       </Link>
                       </div>
             )}
            <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((c) => (
                            <a
                                    key={c}
                  href={c === "All" ? "/" : `/?category=${encodeURIComponent(c)}`}
                                    className={
                                      c === selectedCategory
                                        ? "bg-brand text-white text-xs font-bold px-3.5 py-2 rounded-full whitespace-nowrap"
                                        : "bg-brand-soft text-brand-dark text-xs font-bold px-3.5 py-2 rounded-full whitespace-nowrap"
                  }
                                  >
                  {c}
                      </a>
              ))}
</div>
        <div className="space-y-4">
{(listings || []).map((l) => (
                <ListingCard key={l.id} listing={l} partnered={partneredIds.has(l.business_id)} />
          ))}
{(!listings || listings.length === 0) && (
                <p className="text-muted text-sm">No listings yet — check back soon.</p>
           )}
</div>
    </main>
    </div>
  );
}
