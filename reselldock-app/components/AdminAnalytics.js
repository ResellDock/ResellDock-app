import Link from "next/link";
import { createServiceSupabase } from "@/lib/supabaseServer";
import LiveVisitors from "@/components/LiveVisitors";

const RANGES = [
  { key: "24h", label: "24 hours", bucket: "hour", since: () => new Date(Date.now() - 24 * 3600 * 1000) },
  { key: "3d", label: "3 days", bucket: "hour", since: () => new Date(Date.now() - 3 * 24 * 3600 * 1000) },
  { key: "7d", label: "7 days", bucket: "day", since: () => new Date(Date.now() - 7 * 24 * 3600 * 1000) },
  { key: "14d", label: "14 days", bucket: "day", since: () => new Date(Date.now() - 14 * 24 * 3600 * 1000) },
  { key: "1m", label: "1 month", bucket: "day", since: () => monthsAgo(1) },
  { key: "3m", label: "3 months", bucket: "day", since: () => monthsAgo(3) },
  { key: "6m", label: "6 months", bucket: "week", since: () => monthsAgo(6) },
  { key: "1y", label: "1 year", bucket: "week", since: () => monthsAgo(12) },
  { key: "all", label: "All time", bucket: "month", since: () => null },
];

function monthsAgo(n) {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - n);
  return d;
}

function truncate(date, bucket) {
  const d = new Date(date);
  if (bucket === "hour") {
    d.setUTCMinutes(0, 0, 0);
  } else {
    d.setUTCHours(0, 0, 0, 0);
    if (bucket === "week") d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // Monday, like Postgres
    if (bucket === "month") d.setUTCDate(1);
  }
  return d;
}

function step(date, bucket) {
  const d = new Date(date);
  if (bucket === "hour") d.setUTCHours(d.getUTCHours() + 1);
  else if (bucket === "day") d.setUTCDate(d.getUTCDate() + 1);
  else if (bucket === "week") d.setUTCDate(d.getUTCDate() + 7);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

function label(date, bucket) {
  const d = new Date(date);
  if (bucket === "hour")
    return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  if (bucket === "month") return d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

// Fill in empty buckets so the chart has a continuous time axis
function buildSeries(rows, since, bucket) {
  const byTime = new Map((rows || []).map((r) => [new Date(r.t).getTime(), r]));
  const start = since ? truncate(since, bucket) : rows && rows.length ? truncate(rows[0].t, bucket) : null;
  if (!start) return [];
  const out = [];
  const end = new Date();
  for (let t = start, i = 0; t <= end && i < 1000; t = step(t, bucket), i++) {
    const r = byTime.get(t.getTime());
    out.push({ t: new Date(t), views: r ? Number(r.views) : 0, uniques: r ? Number(r.uniques) : 0 });
  }
  return out;
}

export default async function AdminAnalytics({ range }) {
  const selected = RANGES.find((r) => r.key === range) || RANGES[2]; // default 7 days
  const since = selected.since();

  const service = createServiceSupabase();
  const [{ data: totals, error: totalsError }, { data: detail, error: detailError }] = await Promise.all([
    service.rpc("analytics_totals"),
    service.rpc("analytics_detail", { since: since ? since.toISOString() : null, bucket: selected.bucket }),
  ]);

  if (totalsError || detailError) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">Visitor analytics</h2>
        <div className="bg-surface border border-line rounded-xl2 p-4 text-sm">
          Analytics isn&apos;t set up yet. Run <code>analytics.sql</code> in the Supabase SQL editor, then refresh.
        </div>
      </div>
    );
  }

  const series = buildSeries(detail?.series, since, selected.bucket);
  const maxViews = Math.max(1, ...series.map((s) => s.views));
  const sel = totals?.[selected.key] || { views: 0, uniques: 0 };
  const perVisitor = sel.uniques ? (sel.views / sel.uniques).toFixed(1) : "0.0";

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-3">Visitor analytics</h2>

      <LiveVisitors />

      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-4">
        {RANGES.map((r) => {
          const t = totals?.[r.key] || { views: 0, uniques: 0 };
          const active = r.key === selected.key;
          return (
            <Link
              key={r.key}
              href={`/admin?range=${r.key}`}
              scroll={false}
              className={`rounded-xl2 border p-3 text-center transition ${
                active ? "bg-brand text-white border-brand" : "bg-surface border-line hover:border-brand"
              }`}
            >
              <div className={`text-xs ${active ? "text-white/80" : "text-muted"}`}>{r.label}</div>
              <div className="text-xl font-extrabold">{Number(t.uniques).toLocaleString()}</div>
              <div className={`text-[11px] ${active ? "text-white/80" : "text-muted"}`}>
                {Number(t.views).toLocaleString()} views
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface border border-line rounded-xl2 p-4 text-center">
          <div className="text-2xl font-extrabold">{Number(sel.uniques).toLocaleString()}</div>
          <div className="text-xs text-muted">Unique visitors ({selected.label})</div>
        </div>
        <div className="bg-surface border border-line rounded-xl2 p-4 text-center">
          <div className="text-2xl font-extrabold">{Number(sel.views).toLocaleString()}</div>
          <div className="text-xs text-muted">Total page views</div>
        </div>
        <div className="bg-surface border border-line rounded-xl2 p-4 text-center">
          <div className="text-2xl font-extrabold">{perVisitor}</div>
          <div className="text-xs text-muted">Views per visitor</div>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-xl2 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-sm">Page views over time ({selected.label})</div>
          <div className="text-xs text-muted">Per {selected.bucket} · times in UTC</div>
        </div>
        {series.length === 0 ? (
          <p className="text-sm text-muted">No visits recorded yet. Data starts from when tracking was switched on.</p>
        ) : (
          <>
            <div className="flex items-end gap-[2px] h-40">
              {series.map((s) => (
                <div
                  key={s.t.getTime()}
                  className="flex-1 bg-brand rounded-t-sm min-w-[2px]"
                  style={{ height: `${Math.max(2, (s.views / maxViews) * 100)}%`, opacity: s.views ? 1 : 0.2 }}
                  title={`${label(s.t, selected.bucket)} — ${s.views} views, ${s.uniques} visitors`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-muted mt-2">
              <span>{label(series[0].t, selected.bucket)}</span>
              <span>{label(series[Math.floor(series.length / 2)].t, selected.bucket)}</span>
              <span>{label(series[series.length - 1].t, selected.bucket)}</span>
            </div>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Breakdown title="Top referrers" rows={detail?.referrers} />
        <Breakdown title="Top pages" rows={detail?.pages} />
      </div>
    </div>
  );
}

function Breakdown({ title, rows }) {
  return (
    <div className="bg-surface border border-line rounded-xl2 p-4">
      <div className="font-bold text-sm mb-2">{title}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-line">
            <th className="py-1.5 pr-3 font-medium">Name</th>
            <th className="py-1.5 pr-3 font-medium text-right">Visitors</th>
            <th className="py-1.5 font-medium text-right">Views</th>
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((r) => (
            <tr key={r.name} className="border-b border-line last:border-0">
              <td className="py-1.5 pr-3 break-all">{r.name}</td>
              <td className="py-1.5 pr-3 text-right">{Number(r.uniques).toLocaleString()}</td>
              <td className="py-1.5 text-right">{Number(r.views).toLocaleString()}</td>
            </tr>
          ))}
          {(!rows || rows.length === 0) && (
            <tr>
              <td className="py-1.5 text-muted" colSpan={3}>
                No data yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
