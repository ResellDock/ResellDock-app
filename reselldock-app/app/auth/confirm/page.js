"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default function ConfirmPage() {
      return (
              <Suspense fallback={null}>
                <ConfirmForm />
          </Suspense>
      );
}

function ConfirmForm() {
      const router = useRouter();
      const params = useSearchParams();
      const [status, setStatus] = useState("idle");
      const [message, setMessage] = useState("");

  async function handleClick() {
          setStatus("loading");
          const tokenHash = params.get("token_hash");
          const type = params.get("type") || "magiclink";

        if (!tokenHash) {
                  setStatus("error");
                  setMessage("This link is missing information and can't be used. Please request a new sign-in link.");
                  return;
        }

        const supabase = createClient();
          const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

        if (error || !data?.user) {
                  setStatus("error");
                  setMessage(
                              error?.message === "Token has expired or is invalid"
                                ? "This link has already been used or has expired. Please request a new sign-in link."
                                : error?.message || "Something went wrong. Please request a new sign-in link."
                            );
                  return;
        }

        router.replace("/");
          router.refresh();
  }

  return (
          <div className="min-h-screen flex items-center justify-center px-5">
            <div className="max-w-sm w-full bg-surface border border-line rounded-xl2 p-6 text-center">
              <h1 className="text-xl font-extrabold tracking-tight mb-2">Reselldock</h1>
    {status === "error" ? (
                  <div>
                    <p className="text-sm text-muted mb-4">{message}</p>
                    <a href="/" className="text-sm font-bold text-brand">
                      Back to sign in
        </a>
        </div>
             ) : (
                           <div>
                             <p className="text-sm text-muted mb-4">Click below to finish signing in to Reselldock.</p>
                 <button
                   onClick={handleClick}
                   disabled={status === "loading"}
                                     className="bg-brand text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-dark disabled:opacity-60 w-full"
                 >
                   {status === "loading" ? "Signing you in..." : "Click to sign in"}
                       </button>
                       </div>
             )}
    </div>
        </div>
      );
}
