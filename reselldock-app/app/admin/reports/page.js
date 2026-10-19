import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const service = createServiceSupabase();
  const { data: me } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/");
  return service;
}

async function setStatus(formData) {
  "use server";
  const service = await requireAdmin();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!["open", "actioned", "dismissed"].includes(status)) return;
  await service.from("listing_reports").update({ status }).eq("id", id);
  revalidatePath("/admin/reports");
}

export default async function AdminReportsPage({ searchParams }) {
  const service = await requireAdmin();
  const filter = ["open", "actioned", "dismissed", "all"].includes(searchParams?.status)
    ? searchParams.status
    : "open";

  let query = service
    .from("listing_reports")
    .select("*, listing:listings(id, title, business_id)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter !== "all") query = query.eq("status", filter);
  const { data: reports } = await query;

  const fmt = (dt) => (dt ? new Date(dt).toLocaleString("en-GB") : "—");

  return (
    <div className="max-w-5xl mx-auto px-5 py-7">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Listing reports</h1>
          <p className="text-muted text-sm">Review reports from users and record what you did.</p>
        </div>
        <Link href="/admin" className="text-sm text-muted underline">
          ← Back to admin
        </Link>
      </div>

      <div className="flex gap-2 mb-5 text-sm">
        {["open", "actioned", "dismissed", "all"].map((s) => (
          <Link
            key={s}
            href={`/admin/reports?status=${s}`}
            className={`px-3 py-1.5 rounded-lg border ${
              filter === s ? "bg-brand-soft border-brand text-brand-dark font-semibold" : "border-line text-muted"
            }`}
          >
            {s[0].toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {(reports || []).map((r) => (
          <div key={r.id} className="bg-surface border border-line rounded-xl2 p-4 text-sm">
            <div className="flex justify-between gap-3 flex-wrap mb-1">
              <div className="font-bold">{r.reason}</div>
              <div className="text-xs text-muted">
                {fmt(r.created_at)} · {r.status}
              </div>
            </div>
            <div className="mb-1">
              Listing:{" "}
              {r.listing ? (
                <Link href={`/listings/${r.listing.id}`} className="underline text-brand-dark">
                  {r.listing.title}
                </Link>
              ) : (
                <span className="text-muted">removed</span>
              )}
            </div>
            {r.details && <div className="mb-1 text-muted">&ldquo;{r.details}&rdquo;</div>}
            <div className="text-xs text-muted mb-3">
              Reporter: {r.reporter_email || (r.reporter_id ? "signed-in user" : "anonymous")}
            </div>
            <div className="flex gap-2">
              {["actioned", "dismissed", "open"]
                .filter((s) => s !== r.status)
                .map((s) => (
                  <form key={s} action={setStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value={s} />
                    <button className="px-3 py-1.5 rounded-lg border border-line text-xs font-semibold hover:bg-[#F1F0EC]">
                      {s === "actioned" ? "Mark actioned" : s === "dismissed" ? "Dismiss" : "Reopen"}
                    </button>
                  </form>
                ))}
            </div>
          </div>
        ))}
        {(reports || []).length === 0 && <p className="text-sm text-muted">No reports here.</p>}
      </div>
    </div>
  );
}
