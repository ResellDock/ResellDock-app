import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import OrderActions from "@/components/OrderActions";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function fmt(dt) {
  return dt ? new Date(dt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;
}

function statusOf(o) {
  if (o.delivered_at) return { label: "Delivered", cls: "bg-brand-soft text-brand-dark" };
  if (o.disputed_at) return { label: "Problem reported", cls: "bg-[#FDECEA] text-red-700" };
  if (o.shipped_at) return { label: "Shipped", cls: "bg-[#EAF1FB] text-blue-700" };
  return { label: "Awaiting dispatch", cls: "bg-[#F1F0EC] text-muted" };
}

export default async function OrdersPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceSupabase();
  const { data: profile } = await service.from("profiles").select("*").eq("id", user.id).single();

  const { data: orders } = await service
    .from("payments")
    .select(
      "*, listing:listings(id, title), business:profiles!payments_business_id_fkey(name, business_name), reseller:profiles!payments_reseller_id_fkey(name)"
    )
    .eq("status", "paid")
    .or(`business_id.eq.${user.id},reseller_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Header profile={profile} />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Your orders</h1>
        <p className="text-muted text-sm mb-6">Track shipments, confirm delivery and report problems.</p>

        <div className="space-y-4">
          {(orders || []).map((o) => {
            const isSeller = o.business_id === user.id;
            const st = statusOf(o);
            return (
              <div key={o.id} className="bg-surface border border-line rounded-xl2 p-5 text-sm">
                <div className="flex justify-between gap-3 flex-wrap mb-1">
                  <div className="font-bold">
                    {o.listing ? (
                      <Link href={`/listings/${o.listing.id}`} className="hover:underline">
                        {o.listing.title}
                      </Link>
                    ) : (
                      "Order"
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                </div>
                <div className="text-muted text-xs mb-2">
                  {o.confirmation_number || ""} · £{o.amount} · {fmt(o.created_at)} ·{" "}
                  {isSeller
                    ? `Buyer: ${o.reseller?.name || "—"}`
                    : `Seller: ${o.business?.business_name || o.business?.name || "—"}`}
                </div>

                {isSeller && !o.shipped_at && o.shipping_name && (
                  <div className="text-xs text-muted mb-1">
                    Ship to: {[o.shipping_name, o.shipping_address_line1, o.shipping_address_line2, o.shipping_city, o.shipping_postal_code, o.shipping_country]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}

                {o.shipped_at && (
                  <div className="text-xs mb-1">
                    Shipped {fmt(o.shipped_at)} via {o.carrier}
                    {o.tracking_number ? ` · Tracking: ${o.tracking_number}` : ""}
                  </div>
                )}
                {o.delivered_at && <div className="text-xs mb-1">Delivered and confirmed {fmt(o.delivered_at)}</div>}
                {o.disputed_at && (
                  <div className="text-xs text-red-700 mb-1">
                    Problem reported {fmt(o.disputed_at)}: {o.dispute_reason}
                  </div>
                )}

                <div className="mt-1 flex gap-3 text-xs">
                  <a href={`/api/sales/${o.id}/document`} className="underline text-brand-dark">
                    Shipping document and receipt
                  </a>
                </div>

                <OrderActions
                  orderId={o.id}
                  role={isSeller ? "seller" : "buyer"}
                  shipped={!!o.shipped_at}
                  delivered={!!o.delivered_at}
                  disputed={!!o.disputed_at}
                />
              </div>
            );
          })}
          {(orders || []).length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
        </div>
      </main>
    </div>
  );
}
