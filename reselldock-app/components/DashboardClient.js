"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardClient({ listings, interestRows, partnerRows, stripeConnected, initialTab }) {
  const [tab, setTab] = useState(initialTab || "listings");
  return (
    <div>
    <div className="flex gap-0 border-b border-line mb-5">
  {[
    ["listings", "My Listings"],
    ["buyers", "Interested Buyers"],
    ["wallet", "Wallet"],
    ].map(([key, label]) => (
      <button
          key={key}
          onClick={() => setTab(key)}
    className={`pb-2.5 mr-6 text-sm font-bold border-b-2 ${
      tab === key ? "border-brand text-ink" : "border-transparent text-muted"
    }`}
>
{label}
</button>
))}
  </div>
{tab === "listings" && <ListingsTab listings={listings} />}
{tab === "buyers" && <BuyersTab interestRows={interestRows} partnerRows={partnerRows} />}
{tab === "wallet" && <WalletTab stripeConnected={stripeConnected} />}
</div>
 );
}

function Field({ label, children }) {
  return (
    <div>
    <label className="block text-xs font-semibold text-muted mb-1.5">{label}</label>
  {children}
  </div>
  );
}

function ListingsTab({ listings }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", category: "Apparel", quantity: "", condition: "", description: "" });
  const [saving, setSaving] = useState(false);

async function submit(e) {
  e.preventDefault();
  setSaving(true);
  const res = await fetch("/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...form, tags: [form.category] }),
  });
  setSaving(false);
  if (res.ok) {
    setForm({ title: "", category: "Apparel", quantity: "", condition: "", description: "" });
    router.refresh();
  }
}

return (
  <div>
  <form onSubmit={submit} className="bg-surface border border-line rounded-xl2 p-5 mb-5">
  <h3 className="font-bold mb-3.5">Post New Stock</h3>
  <div className="grid sm:grid-cols-2 gap-3.5 mb-1">
  <Field label="Title">
  <input
  required
  value={form.title}
onChange={(e) => setForm({ ...form, title: e.target.value })}
placeholder="e.g. Overstock Denim Jackets, 300 units"
className="w-full border border-line rounded-lg px-3 py-2.5 text-sm"
/>
  </Field>
<Field label="Category">
  <select
value={form.category}
onChange={(e) => setForm({ ...form, category: e.target.value })}
className="w-full border border-line rounded-lg px-3 py-2.5 text-sm"
>
{["Apparel", "Electronics", "Homeware", "Footwear", "General"].map((c) => (
  <option key={c}>{c}</option>
                                                                   ))}
</select>
  </Field>
<Field label="Quantity">
  <input
value={form.quantity}
onChange={(e) => setForm({ ...form, quantity: e.target.value })}
placeholder="e.g. 300 units"
className="w-full border border-line rounded-lg px-3 py-2.5 text-sm"
/>
  </Field>
<Field label="Condition">
  <input
value={form.condition}
onChange={(e) => setForm({ ...form, condition: e.target.value })}
placeholder="e.g. New with tags"
className="w-full border border-line rounded-lg px-3 py-2.5 text-sm"
/>
  </Field>
<div className="sm:col-span-2">
  <Field label="Description">
  <textarea
rows={3}
value={form.description}
onChange={(e) => setForm({ ...form, description: e.target.value })}
placeholder="Describe the stock lot..."
className="w-full border border-line rounded-lg px-3 py-2.5 text-sm"
/>
  </Field>
  </div>
  </div>
<button
disabled={saving}
className="mt-2 bg-brand text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-dark disabled:opacity-60"
>
{saving ? "Posting..." : "Post Listing"}
</button>
  </form>

<h3 className="font-bold mb-3">My Listings</h3>
<div className="space-y-3">
{listings.map((l) => {
  const isSold = l.status === "sold";
  return (
    <div key={l.id} className={`bg-surface border border-line rounded-xl2 p-4 ${isSold ? "opacity-70" : ""}`}>
<div className="flex items-center gap-2 mb-1">
  <div className="font-bold text-sm">{l.title}</div>
{isSold && (
  <span className="bg-ink text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
  Sold
  </span>
 )}
</div>
<div className="text-muted text-xs">
{l.category} {l.quantity ? `· ${l.quantity}` : ""}
</div>
  </div>
);
})}
{listings.length === 0 && <p className="text-muted text-sm">No live listings yet.</p>}
  </div>
  </div>
 );
}

function BuyersTab({ interestRows, partnerRows }) {
  const items = [
    ...interestRows.map((r) => ({
      text: `${r.reseller?.name || "Someone"} clicked Interested on "${r.listing?.title || "a listing"}"`,
      time: r.created_at,
    })),
    ...partnerRows.map((r) => ({
      text: `${r.reseller?.name || "Someone"} became a Business Partner`,
      time: r.created_at,
    })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time));

if (items.length === 0) return <p className="text-muted text-sm">No activity yet.</p>;

return (
  <div className="space-y-2.5">
{items.map((it, i) => (
  <div key={i} className="flex items-center gap-3 bg-surface border border-line rounded-xl px-4 py-3.5">
  <div className="text-sm flex-1">{it.text}</div>
           <div className="text-[11.5px] text-muted">{new Date(it.time).toLocaleDateString()}</div>
  </div>
))}
</div>
);
}

function WalletTab({ stripeConnected }) {
  const [balance, setBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [msg, setMsg] = useState("");

useEffect(() => {
  fetch("/api/stripe/balance")
  .then((r) => r.json())
  .then(setBalance);
}, []);

async function connectStripe() {
  setConnecting(true);
  const res = await fetch("/api/stripe/onboard", { method: "POST" });
  const data = await res.json();
  setConnecting(false);
  if (data.url) window.location.href = data.url;
  else setMsg(data.error || "Could not start Stripe onboarding.");
}

async function withdraw() {
  setWithdrawing(true);
  const res = await fetch("/api/stripe/payout", { method: "POST" });
  const data = await res.json();
  setWithdrawing(false);
  if (res.ok) {
    setMsg("Payout initiated — funds are on their way to your bank (1-2 business days).");
    fetch("/api/stripe/balance")
    .then((r) => r.json())
    .then(setBalance);
  } else {
    setMsg(data.error || "Could not start payout.");
  }
}

if (!stripeConnected) {
  return (
    <div className="bg-surface border border-line rounded-xl2 p-6 text-center">
    <p className="text-sm text-muted mb-4">Connect Stripe to receive payments from resellers and access your wallet.</p>
  <button
  onClick={connectStripe}
  disabled={connecting}
  className="bg-brand text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-brand-dark disabled:opacity-60"
  >
  {connecting ? "Redirecting..." : "Connect Stripe"}
  </button>
  </div>
  );
}

return (
  <div>
  <div className="grid sm:grid-cols-3 gap-3.5 mb-6">
  <div className="bg-ink text-white rounded-xl2 p-4.5">
  <div className="text-[#B8B8B8] text-xs font-semibold mb-1.5">Available balance</div>
<div className="text-2xl font-extrabold">${balance ? balance.available.toFixed(2) : "—"}</div>
<button
onClick={withdraw}
disabled={withdrawing}
className="mt-3.5 bg-white text-ink text-sm font-bold px-3.5 py-2 rounded-lg disabled:opacity-60"
>
{withdrawing ? "Processing..." : "Withdraw to Bank"}
</button>
  </div>
<div className="bg-surface border border-line rounded-xl2 p-4.5">
  <div className="text-muted text-xs font-semibold mb-1.5">Pending</div>
<div className="text-2xl font-extrabold">${balance ? balance.pending.toFixed(2) : "—"}</div>
  </div>
<div className="bg-surface border border-line rounded-xl2 p-4.5">
  <div className="text-muted text-xs font-semibold mb-1.5">Platform fee rate</div>
<div className="text-2xl font-extrabold">2%</div>
  </div>
  </div>
{msg && <p className="text-sm mb-4">{msg}</p>}
 <p className="text-xs text-muted">
  Balances and payouts are managed directly by Stripe on your connected account — Reselldock never holds your funds itself.
  </p>
  </div>
 );
}
