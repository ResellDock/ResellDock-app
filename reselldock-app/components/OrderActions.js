"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CARRIERS = ["Royal Mail", "Parcelforce", "DPD", "DHL", "Evri", "UPS", "FedEx", "Pallet network", "Own delivery", "Other"];

export default function OrderActions({ orderId, role, shipped, delivered, disputed }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [tracking, setTracking] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [reason, setReason] = useState("");

  async function call(payload) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  }

  if (role === "seller" && !shipped) {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex gap-2 flex-wrap">
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm bg-white"
          >
            {CARRIERS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Tracking number (optional)"
            className="border border-line rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]"
          />
          <button
            disabled={busy}
            onClick={() => call({ action: "ship", carrier, tracking_number: tracking })}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Saving…" : "Mark as shipped"}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (role === "buyer" && shipped && !delivered) {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex gap-2 flex-wrap">
          <button
            disabled={busy}
            onClick={() => call({ action: "received" })}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Saving…" : "Confirm received"}
          </button>
          {!disputed && (
            <button
              onClick={() => setShowDispute((v) => !v)}
              className="px-4 py-2 rounded-lg border border-line text-sm font-semibold"
            >
              Report a problem
            </button>
          )}
        </div>
        {showDispute && !disputed && (
          <div className="space-y-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="What is wrong with the order?"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            />
            <button
              disabled={busy || !reason.trim()}
              onClick={() => call({ action: "dispute", reason })}
              className="px-4 py-2 rounded-lg bg-warn text-white text-sm font-semibold disabled:opacity-60"
            >
              Send report
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return null;
}
