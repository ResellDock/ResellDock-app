"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getVisitorId() {
  try {
    let id = localStorage.getItem("rd_vid");
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem("rd_vid", id);
    }
    return id;
  } catch {
    return null;
  }
}

function send(payload) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {}
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export default function Tracker() {
  const pathname = usePathname();
  const first = useRef(true);

  // One page view per route change
  useEffect(() => {
    const vid = getVisitorId();
    if (!vid) return;
    let utm = null;
    try {
      utm = new URLSearchParams(window.location.search).get("utm_source");
    } catch {}
    send({
      type: "view",
      visitor_id: vid,
      path: pathname,
      referrer: first.current ? document.referrer : "",
      utm_source: first.current ? utm : null,
    });
    first.current = false;
  }, [pathname]);

  // Heartbeat so the admin page can show who is on the site right now
  useEffect(() => {
    const vid = getVisitorId();
    if (!vid) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        send({ type: "ping", visitor_id: vid, path: window.location.pathname });
      }
    }, 30000);
    return () => clearInterval(id);
  }, []);

  return null;
}
