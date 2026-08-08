"use client";
import { useState } from "react";
import Link from "next/link";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ListingCard({ listing, partnered: initialPartnered }) {
  const [partnered, setPartnered] = useState(initialPartnered);
  const [interestSent, setInterestSent] = useState(false);

  async function handleInterest() {
    const res = await fetch("/api/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listing.id }),
    });
    if (res.ok) setInterestSent(true);
  }

  async function handlePartner() {
    const res = await fetch("/api/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: listing.business_id }),
    });
    if (res.ok) {
      const data = await res.json();
      setPartnered(data.partnered);
    }
  }

  return (
    <div className="bg-surface border border-line rounded-xl2 p-5">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand-dark flex items-center justify-center font-extrabold text-xs">
          {listing.business?.name?.[0]?.toUpperCase() || "B"}
        </div>
        <div>
          <div className="font-bold text-sm">{listing.business?.name || "Business"}</div>
          <div className="text-muted text-xs">
            {timeAgo(listing.created_at)} {listing.quantity ? `· ${listing.quantity}` : ""}
          </div>
        </div>
        <div className="ml-auto text-xs font-bold text-brand-dark bg-brand-soft px-2.5 py-1 rounded-full">
          {listing.category}
        </div>
      </div>
      <Link href={`/listings/${listing.id}`} className="block font-bold text-[16.5px] mb-1.5 hover:text-brand-dark">
        {listing.title}
      </Link>
      <p className="text-muted text-sm mb-3 leading-relaxed">{listing.description}</p>
      <div className="flex gap-1.5 flex-wrap mb-3.5">
        {(listing.tags || []).map((t) => (
          <span key={t} className="text-[11.5px] bg-[#F1F0EC] text-muted px-2.5 py-1 rounded-md font-semibold">
            {t}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex-1" />
        <button
          onClick={handlePartner}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
            partnered ? "bg-brand-soft border-brand text-brand-dark" : "bg-white border-brand text-brand-dark"
          }`}
        >
          {partnered ? "🤝 Partnered ✓" : "🤝 Business Partner"}
        </button>
        <button
          onClick={handleInterest}
          disabled={interestSent}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {interestSent ? "✓ Notified" : "Interested"}
        </button>
      </div>
    </div>
  );
}
