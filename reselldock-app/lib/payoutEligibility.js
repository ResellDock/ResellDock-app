// Seller funds are released for withdrawal when:
//  - the buyer has confirmed delivery, or
//  - 7 days have passed since the seller marked the order as shipped,
//  - and no problem has been reported on the order.
// Orders paid before this rule launched (LAUNCH_DATE) are released straight away so
// existing sellers are not locked out.
export const RELEASE_DAYS = 7;
const LAUNCH_DATE = "2026-10-19T00:00:00Z";

export async function getEligibleOrders(service, businessId) {
  const { data: orders } = await service
    .from("payments")
    .select("id, net_amount, created_at, shipped_at, delivered_at, disputed_at, paid_out_at, status")
    .eq("business_id", businessId)
    .eq("status", "paid")
    .is("paid_out_at", null)
    .order("created_at", { ascending: true });

  const cutoff = Date.now() - RELEASE_DAYS * 24 * 60 * 60 * 1000;
  const launch = new Date(LAUNCH_DATE).getTime();

  const eligible = (orders || []).filter((o) => {
    if (o.disputed_at) return false;
    if (new Date(o.created_at).getTime() < launch) return true;
    if (o.delivered_at) return true;
    if (o.shipped_at && new Date(o.shipped_at).getTime() < cutoff) return true;
    return false;
  });

  const eligibleCents = eligible.reduce((s, o) => s + Math.round(Number(o.net_amount || 0) * 100), 0);
  return { eligible, eligibleCents };
}
