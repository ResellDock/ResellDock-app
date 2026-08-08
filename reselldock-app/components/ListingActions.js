"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ListingActions({ listingId, businessId, initialPartnered }) {
  const router = useRouter();
  const [partnered, setPartnered] = useState(initialPartnered);
  const [loading, setLoading] = useState(false);

  async function handlePartner() {
    const res = await fetch("/api/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    });
    if (res.ok) {
      const data = await res.json();
      setPartnered(data.partnered);
    }
  }

  async function handleInterest() {
    setLoading(true);
    const res = await fetch("/api/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/messages?thread=${data.threadId}`);
    }
  }

  return (
    <div className="flex gap-2.5">
      <button
        onClick={handlePartner}
        className={`flex-1 py-2.5 rounded-lg text-sm font-bold border ${
          partnered ? "bg-brand-soft border-brand text-brand-dark" : "bg-white border-brand text-brand-dark"
        }`}
      >
        {partnered ? "🤝 Partnered ✓" : "🤝 Business Partner"}
      </button>
      <button
        onClick={handleInterest}
        disabled={loading}
        className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-brand text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? "..." : "I'm Interested"}
      </button>
    </div>
  );
}
