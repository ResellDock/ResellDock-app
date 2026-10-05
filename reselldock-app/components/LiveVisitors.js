"use client";

import { useEffect, useState } from "react";

export default function LiveVisitors() {
  const [data, setData] = useState({ count: null, pages: [] });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/live", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (active) setData(json);
      } catch {}
    }
    load();
    const id = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="bg-surface border border-line rounded-xl2 p-4 mb-4">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand" />
        </span>
        <div className="text-3xl font-extrabold">{data.count === null ? "…" : data.count}</div>
        <div className="text-sm text-muted">
          visitor{data.count === 1 ? "" : "s"} on the site right now
          <span className="block text-xs">Updates every 10 seconds</span>
        </div>
      </div>
      {data.pages.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {data.pages.map((p) => (
            <span key={p.path} className="text-xs bg-brand-soft text-brand-dark rounded-full px-3 py-1">
              {p.path} · {p.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
