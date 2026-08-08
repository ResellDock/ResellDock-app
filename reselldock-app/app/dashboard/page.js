import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import Header from "@/components/Header";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile.role !== "business") redirect("/feed");

  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("business_id", user.id)
    .order("created_at", { ascending: false });

  const listingIds = (listings || []).map((l) => l.id);

  const { data: interestRows } = listingIds.length
    ? await supabase
        .from("interests")
        .select("created_at, listing:listings(title), reseller:profiles(name)")
        .in("listing_id", listingIds)
    : { data: [] };

  const { data: partnerRows } = await supabase
    .from("partnerships")
    .select("created_at, reseller:profiles!partnerships_reseller_id_fkey(name)")
    .eq("business_id", user.id);

  return (
    <div>
      <Header profile={profile} />
      <main className="max-w-5xl mx-auto px-5 py-7">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Business Dashboard</h1>
        <p className="text-muted text-sm mb-6">Manage your listings, track interest, and access your Reselldock wallet.</p>
        <DashboardClient
          listings={listings || []}
          interestRows={interestRows || []}
          partnerRows={partnerRows || []}
          stripeConnected={!!profile.stripe_account_id}
          initialTab={searchParams?.tab || "listings"}
        />
      </main>
    </div>
  );
}
