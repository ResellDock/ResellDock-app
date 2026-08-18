import { createServiceSupabase } from "@/lib/supabaseServer";
import Link from "next/link";

export const dynamic = "force-dynamic";

function maskName(name) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-line last:border-0 text-[13.5px]">
    <span className="text-muted">{label}</span>
  <span className="font-semibold">{value}</span>
    </div>
  );
}

export default async function VerifyPage({ params }) {
  const supabase = createServiceSupabase();
  const { data: payment } = await supabase
  .from("payments")
  .select(
    `confirmation_number, amount, status, created_at,
    business:profiles!payments_business_id_fkey(name,business_name),
    reseller:profiles!payments_reseller_id_fkey(name),
    listing:listings(title)`
    )
  .eq("confirmation_number", params.code)
  .maybeSingle();

const verified = payment && payment.status === "paid";

return (
  <div className="min-h-screen bg-bg flex items-center justify-center px-5 py-10">
  <div className="max-w-md w-full bg-surface border border-line rounded-xl2 p-7">
  <div className="text-center mb-6">
  <div className="font-extrabold text-xl mb-1">
  <span className="text-ink">Resell</span>
  <span className="text-brand">dock</span>
  </div>
  <p className="text-muted text-xs">Sale Verification</p>
  </div>

  {verified ? (
    <div>
    <div className="flex items-center gap-2 mb-5 bg-brand-soft text-brand-dark rounded-lg px-3.5 py-2.5">
    <span className="font-bold text-sm">Verified — this sale is genuine</span>
    </div>
   <Row label="Confirmation #" value={payment.confirmation_number} />
    <Row label="Item" value={payment.listing?.title || "—"} />
  <Row label="Business" value={payment.business?.business_name || payment.business?.name || "—"} />
<Row label="Reseller" value={maskName(payment.reseller?.name)} />
  <Row label="Amount" value={`$${Number(payment.amount).toFixed(2)}`} />
<Row
label="Date"
value={new Date(payment.created_at).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
})}
/>
<p className="text-xs text-muted mt-5">
  This transaction was processed through Reselldock&apos;s secure payment system. This page confirms it is
real — it does not disclose contact or payment details.
  </p>
  </div>
) : (
  <div>
  <div className="bg-warn-soft text-[#8A5E10] rounded-lg px-3.5 py-2.5 font-bold text-sm mb-4">
  No verified sale found for this confirmation number.
  </div>
<p className="text-xs text-muted">
  Double-check the confirmation number. If you believe a business or reseller gave you an invalid
confirmation number, please contact support@reselldock.com — this may indicate a scam attempt.
  </p>
  </div>
)}

<div className="text-center mt-6">
  <Link href="/" className="text-xs text-brand font-bold">
  Go to Reselldock
  </Link>
  </div>
  </div>
  </div>
);
}
