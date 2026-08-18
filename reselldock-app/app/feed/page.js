import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import Header from "@/components/Header";
import ListingCard from "@/components/ListingCard";
import { CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function FeedPage({ searchParams }) {
    const supabase = createServerSupabase();
    const {
          data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

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

  const { data: partnerships } = await supabase
      .from("partnerships")
      .select("business_id")
      .eq("reseller_id", user.id);
    const partneredIds = new Set((partnerships || []).map((p) => p.business_id));

  const tabs = ["All", ...CATEGORIES];

  return (
        <div>
          <Header profile={profile} />
          <main className="max-w-5xl mx-auto px-5 py-7">
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">Stock Feed</h1>
          <p className="text-muted text-sm mb-6">
              Fresh listings from businesses on Reselldock. No prices shown — click Interested to start a conversation.
    </p>
          <div className="flex flex-wrap gap-2 mb-6">
  {tabs.map((c) => (
                <a
                          key={c}
                href={c === "All" ? "/feed" : `/feed?category=${encodeURIComponent(c)}`}
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
