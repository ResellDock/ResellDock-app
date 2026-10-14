"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "rd_consent";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {}
  }, []);

  function choose(value) {
    try {
      localStorage.setItem(KEY, value);
      if (value === "declined") localStorage.removeItem("rd_vid");
    } catch {}
    window.dispatchEvent(new Event("rd-consent-change"));
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4"
    >
      <div className="max-w-3xl mx-auto bg-surface border border-line rounded-xl2 shadow-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-[13px] leading-relaxed text-ink flex-1">
          We use essential storage to keep you logged in. With your permission we also use a
          random visitor ID to count visits and see which pages are used. See our{" "}
          <Link href="/cookies" className="underline text-brand-dark">
            cookie notice
          </Link>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => choose("declined")}
            className="px-4 py-2 rounded-lg border border-line text-sm font-semibold hover:bg-[#F1F0EC]"
          >
            Decline
          </button>
          <button
            onClick={() => choose("accepted")}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
