"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function GateForm() {
  const [role, setRole] = useState("reseller");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !email.includes("@")) {
      setError("Please enter your name and a valid email.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { name, role },
      },
    });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="bg-surface border border-line rounded-xl2 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="text-xl font-extrabold mb-2">Check your email</div>
          <p className="text-muted text-sm">
            We sent a sign-in link to <b>{email}</b>. Click it to finish signing in to Reselldock.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-xl2 p-8 max-w-sm w-full shadow-sm">
        <div className="text-center mb-1">
          <span className="text-xl font-extrabold tracking-tight">
            Resell<span className="text-brand">dock</span>
          </span>
        </div>
        <p className="text-center text-muted text-sm mb-6">
          Where businesses dock their stock and resellers come to connect.
        </p>

        <label className="block text-xs font-semibold text-muted mb-2">I am a...</label>
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setRole("reseller")}
            className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${
              role === "reseller" ? "bg-brand-soft border-brand text-brand-dark" : "border-line text-muted"
            }`}
          >
            Reseller
          </button>
          <button
            type="button"
            onClick={() => setRole("business")}
            className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${
              role === "business" ? "bg-brand-soft border-brand text-brand-dark" : "border-line text-muted"
            }`}
          >
            Business
          </button>
        </div>

        <label className="block text-xs font-semibold text-muted mb-2">Full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jordan Blake"
          className="w-full mb-4 px-3 py-2.5 rounded-lg border border-line text-sm focus:outline-none focus:border-brand"
        />

        <label className="block text-xs font-semibold text-muted mb-2">Email address</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          className="w-full mb-4 px-3 py-2.5 rounded-lg border border-line text-sm focus:outline-none focus:border-brand"
        />

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <button
          disabled={loading}
          type="submit"
          className="w-full py-3 rounded-lg bg-brand text-white font-bold text-sm hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Sending link..." : "Enter Reselldock"}
        </button>
        <p className="text-[11px] text-muted mt-4 leading-relaxed text-center">
          We'll only use your email to send your sign-in link and to notify you when businesses you follow post new stock.
        </p>
      </form>
    </div>
  );
}
