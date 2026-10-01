"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function GateForm() {
        const router = useRouter();
        const [step, setStep] = useState("form");
        const [role, setRole] = useState("reseller");
        const [name, setName] = useState("");
        const [email, setEmail] = useState("");
        const [code, setCode] = useState("");
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
                                      shouldCreateUser: true,
                                      data: { name, role },
                        },
            });
            setLoading(false);
            if (otpError) {
                        setError(otpError.message);
                        return;
            }
            setStep("code");
  }

  async function handleVerify(e) {
            e.preventDefault();
            setError("");
            if (!code.trim() || code.trim().length < 4) {
                        setError("Please enter the verification code from your email.");
                        return;
            }
            setLoading(true);
            const supabase = createClient();
            const { error: verifyError } = await supabase.auth.verifyOtp({
                        email,
                        token: code.trim(),
                        type: "email",
            });

          if (verifyError) {
                      setLoading(false);
                      setError(
                                    verifyError.message === "Token has expired or is invalid"
                                      ? "That code is incorrect or has expired. Please check your email or request a new one."
                                      : verifyError.message
                                  );
                      return;
          }

          const res = await fetch("/api/auth/sync", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ role, name }),
          });
            const result = await res.json().catch(() => ({}));
            setLoading(false);

          if (!res.ok || !result.destination) {
                      setError("Signed in, but something went wrong finishing setup. Please try refreshing the page.");
                      return;
          }

          router.push(result.destination);
            router.refresh();
  }

  async function handleResend() {
            setError("");
            setLoading(true);
            const supabase = createClient();
            const { error: otpError } = await supabase.auth.signInWithOtp({
                        email,
                        options: {
                                      shouldCreateUser: true,
                                      data: { name, role },
                        },
            });
            setLoading(false);
            if (otpError) {
                        setError(otpError.message);
            }
  }

  if (step === "code") {
            return (
                        <div className="min-h-screen flex items-center justify-center bg-bg px-4">
                          <form onSubmit={handleVerify} className="bg-surface border border-line rounded-xl2 p-8 max-w-sm w-full shadow-sm">
                            <div className="text-center mb-1">
                              <span className="text-xl font-extrabold tracking-tight">
                                Resell<span className="text-brand">dock</span>
                  </span>
                  </div>
                  <p className="text-center text-muted text-sm mb-6">
                              We sent a verification code to <b>{email}</b>. Enter it below to finish signing in as a{" "}
                    <b>{role === "business" ? "business" : "reseller"}</b>.
                  </p>

                <label className="block text-xs font-semibold text-muted mb-2">Verification code</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 12))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter code"
                    className="w-full mb-4 px-3 py-2.5 rounded-lg border border-line text-center text-lg tracking-[0.3em] font-bold focus:outline-none focus:border-brand"
                  />

                    {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

                  <button
                                 disabled={loading}
                                 type="submit"
                                 className="w-full py-3 rounded-lg bg-brand text-white font-bold text-sm hover:bg-brand-dark disabled:opacity-60"
                               >
                                 {loading ? "Verifying..." : "Verify & sign in"}
        </button>

                <div className="flex justify-between mt-4">
                          <button
                      type="button"
                      onClick={() => {
                                            setStep("form");
                                            setCode("");
                                            setError("");
                      }}
                      className="text-[11px] text-muted underline"
                    >
                                          Use a different email
                            </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="text-[11px] text-brand font-semibold underline disabled:opacity-60"
                    >
                                          Resend code
                            </button>
                            </div>
                            </form>
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
                     {loading ? "Sending code..." : "Enter Reselldock"}
</button>
        <p className="text-[11px] text-muted mt-4 leading-relaxed text-center">
                We'll only use your email to send your sign-in code and to notify you when businesses you follow post new stock.
      </p>
      </form>
      </div>
  );
}
