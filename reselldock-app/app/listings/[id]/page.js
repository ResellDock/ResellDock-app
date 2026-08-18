import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabaseServer";
import Header from "@/components/Header";
import ListingActions from "@/components/ListingActions";

export const dynamic = "force-dynamic";

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-line last:border-0 text-[13.5px]">
    <span className="text-muted">{label}</span>
  <span>{value || "—"}</span>
  </div>
);
}

export default async function ListingDetailPage({ params }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

const { data: listing } = await supabase
  .from("listings")
  .select("*, business:profiles(id, name)")
  .eq("id", params.id)
  .single();

if (!listing) {
  return (
    <div>
    <Header profile={profile} />
    <main className="max-w-5xl mx-auto px-5 py-7">
    <p className="text-muted text-sm">Listing not found.</p>
    </main>
    </div>
  );
}

const isSold = listing.status === "sold";

const { count: interestedCount } = await supabase
  .from("interests")
  .select("*", { count: "exact", head: true })
  .eq("listing_id", listing.id);

const { count: partnersCount } = await supabase
  .from("partnerships")
  .select("*", { count: "exact", head: true })
  .eq("business_id", listing.business_id);

const { data: partnership } = await supabase
  .from("partnerships")
  .select("id")
  .eq("reseller_id", user.id)
  .eq("business_id", listing.business_id)
  .single();

return (
  <div>
  <Header profile={profile} />
  <main className="max-w-5xl mx-auto px-5 py-7">
  <Link href="/feed" className="inline-flex items-center gap-1.5 text-muted text-sm font-semibold mb-4 hover:text-ink">
  ← Back to feed
  </Link>
  <div className="grid md:grid-cols-[1.4fr_1fr] gap-6">
  <div>
  <div className="h-72 rounded-xl2 bg-gradient-to-br from-[#EDEBE5] to-bg border border-line flex items-center justify-center text-muted text-sm mb-4">
  📦 Listing photos
  </div>
  <div className="bg-surface border border-line rounded-xl2 p-5">
{isSold && (
  <div className="bg-ink text-white inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3">
  SOLD
  </div>
  )}
<h2 className="text-xl font-extrabold mb-2">{listing.title}</h2>
<p className="text-muted text-sm leading-relaxed">{listing.description}</p>
<div className="flex gap-1.5 flex-wrap mt-3.5">
{(listing.tags || []).map((t) => (
  <span key={t} className="text-[11.5px] bg-[#F1F0EC] text-muted px-2.5 py-1 rounded-md font-semibold">
  {t}
  </span>
                          ))}
</div>
  </div>
  </div>
<div>
  <div className="bg-surface border border-line rounded-xl2 p-5">
  <Row label="Category" value={listing.category} />
<Row label="Quantity" value={listing.quantity} />
<Row label="Condition" value={listing.condition} />
  </div>
<div className="bg-surface border border-line rounded-xl2 p-4 mt-4">
  <div className="flex items-center gap-2.5 mb-3">
  <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand-dark flex items-center justify-center font-extrabold text-xs">
{listing.business?.name?.[0]?.toUpperCase() || "B"}
</div>
<div>
  <div className="font-bold text-sm">{listing.business?.name}</div>
<div className="text-muted text-xs">
{interestedCount || 0} interested · {partnersCount || 0} partners
  </div>
  </div>
  </div>
{isSold ? (
  <div className="bg-[#F1F0EC] border border-line rounded-lg px-3 py-2.5 text-[12.5px] text-muted mb-1 leading-relaxed">
  This item has already been sold and is no longer available.
  </div>
 ) : (
   <>
   <div className="bg-warn-soft border border-[#F2D9A6] rounded-lg px-3 py-2.5 text-[12.5px] text-[#8A5E10] mb-3.5 leading-relaxed">
   💬 No price is listed. Click <b>Interested</b> to notify {listing.business?.name} and start a direct conversation about pricing.
   </div>
 <ListingActions listingId={listing.id} businessId={listing.business_id} initialPartnered={!!partnership} />
  </>
)}
</div>
  </div>
  </div>
  </main>
  </div>
);
}
