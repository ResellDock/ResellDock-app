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

  const activeCategory = searchParams?.category || "";
  const q = searchParams?.q || "";

  let query = supabase
    .from("listings")
    .select("*, interests(count)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (activeCategory) {
    query = query.eq("category", activeCategory);
  }
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data: listings } = await query;

  const { count: activeListingCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: businessCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "business");

  return (
    <>
      <Header user={user} profile={profile} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">Stock Feed</h1>
          <p className="text-muted mt-1">
            {businessCount || 0} business{businessCount === 1 ? "" : "es"} · {activeListingCount || 0} active listing
            {activeListingCount === 1 ? "" : "s"}
          </p>
        </div>

        {!user && (
          <div id="how-it-works" className="bg-brand-soft border border-line rounded-xl2 p-6 mb-8">
            <h2 className="text-lg font-semibold text-ink mb-4">How it works</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-semibold mb-2">
                  1
                </div>
                <h3 className="font-medium text-ink mb-1">Businesses list stock</h3>
                <p className="text-sm text-muted">
                  Wholesalers and suppliers post surplus, returns or liquidation stock they need to move fast.
                </p>
              </div>
              <div>
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-semibold mb-2">
                  2
                </div>
                <h3 className="font-medium text-ink mb-1">Resellers browse &amp; connect</h3>
                <p className="text-sm text-muted">
                  Resellers search the feed, filter by category and message businesses directly about stock they want.
                </p>
              </div>
              <div>
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-semibold mb-2">
                  3
                </div>
                <h3 className="font-medium text-ink mb-1">Deal gets done</h3>
                <p className="text-sm text-muted">
                  Buyer and seller agree terms between themselves — Reselldock just makes the introduction.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/login"
                className="inline-block bg-brand text-white px-4 py-2 rounded-xl2 text-sm font-medium"
              >
                Sell on Reselldock
              </Link>
            </div>
          </div>
        )}

        <form action="/" method="get" className="mb-6 flex gap-2">
          <input type="hidden" name="category" value={activeCategory} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search listings..."
            className="flex-1 border border-line rounded-xl2 px-4 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-brand text-white px-4 py-2 rounded-xl2 text-sm font-medium"
          >
            Search
          </button>
          {q && (
            <Link
              href={activeCategory ? `/?category=${activeCategory}` : "/"}
              className="text-sm text-muted px-3 py-2"
            >
              Clear
            </Link>
          )}
        </form>

        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href={q ? `/?q=${q}` : "/"}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              !activeCategory ? "bg-brand text-white border-brand" : "border-line text-muted"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={q ? `/?category=${cat}&q=${q}` : `/?category=${cat}`}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                activeCategory === cat ? "bg-brand text-white border-brand" : "border-line text-muted"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {listings && listings.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                interestCount={listing.interests?.[0]?.count || 0}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted">No listings found.</p>
        )}
      </main>
    </>
  );
}
