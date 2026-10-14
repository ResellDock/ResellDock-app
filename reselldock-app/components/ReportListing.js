"use client";

import { useState } from "react";

const REASONS = [
  "Illegal or unsafe product",
  "Counterfeit or fake goods",
  "Restricted item (alcohol, tobacco, vapes, knives, medicines, age-restricted)",
  "Misleading or fraudulent listing",
  "Other",
];

export default function ReportListing({ listingId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  async function submit(e) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, reason, details, reporter_email: email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="text-xs text-muted mt-3">
        Thanks. We have received your report and will review it.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted underline hover:text-ink mt-3"
      >
        Report this listing
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-surface border border-line rounded-xl2 p-4 mt-3 space-y-2.5 text-sm"
    >
      <div className="font-bold">Report this listing</div>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full border border-line rounded-lg px-3 py-2 bg-white"
      >
        {REASONS.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Tell us what is wrong (optional)"
        className="w-full border border-line rounded-lg px-3 py-2"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email (optional, if you want a reply)"
        className="w-full border border-line rounded-lg px-3 py-2"
      />
      {status === "error" && (
        <p className="text-xs text-red-600">Something went wrong. Please email hello@reselldock.com.</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="px-4 py-2 rounded-lg bg-brand text-white font-semibold disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg border border-line font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
