import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import Header from "@/components/Header";
import ListingCard from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

const { data: listings } = await supabase
  .from("listings")
  .select("*, business:profiles(name)")
  .eq("status", "active")
  .order("created_at", { ascending: false });

const { data: partnerships } = await supabase
  .from("partnerships")
  .select("business_id")
  .eq("reseller_id", user.id);
  const partneredIds = new Set((partnerships || []).map((p) => p.business_id));

return (
  <div>
  <Header profile={profile} />
  <main className="max-w-5xl mx-auto px-5 py-7">
  <h1 className="text-2xl font-extrabold tracking-tight mb-1">Stock Feed</h1>
  <p className="text-muted text-sm mb-6">
  Fresh listings from businesses on Reselldock. No prices shown — click Interested to start a conversation.
  </p>
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
