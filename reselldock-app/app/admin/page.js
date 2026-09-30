import { redirect } from "next/navigation";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const supabase = createServerSupabase();
    const {
          data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/");

  const service = createServiceSupabase();
    const { data: me } = await service.from("profiles").select("role, name").eq("id", user.id).single();
    if (me?.role !== "admin") redirect("/");

  const [
    { data: profiles },
    { data: listings },
    { data: threads },
    { data: messages },
    { data: payments },
      ] = await Promise.all([
        service.from("profiles").select("*").order("created_at", { ascending: false }),
        service.from("listings").select("*").order("created_at", { ascending: false }),
        service.from("threads").select("*").order("created_at", { ascending: false }),
        service.from("messages").select("*").order("created_at", { ascending: true }),
        service.from("payments").select("*").order("created_at", { ascending: false }),
      ]);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const listingMap = new Map((listings || []).map((l) => [l.id, l]));
    const messagesByThread = new Map();
    (messages || []).forEach((m) => {
          const list = messagesByThread.get(m.thread_id) || [];
          list.push(m);
          messagesByThread.set(m.thread_id, list);
    });

  const businesses = (profiles || []).filter((p) => p.role === "business");
    const resellers = (profiles || []).filter((p) => p.role === "reseller");

  function nameFor(id) {
        const p = profileMap.get(id);
        return p ? `${p.name || p.email} (${p.role})` : "Unknown user";
  }

  function fmt(dt) {
        return dt ? new Date(dt).toLocaleString() : "—";
  }

  return (
        <div className="max-w-6xl mx-auto px-5 py-7">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Admin Overview</h1>
            <p className="text-muted text-sm">
                Signed in as {me?.name || user.email} — full oversight of businesses, resellers, listings, and conversations.
    </p>
    </div>
          <form action="/auth/signout" method="post">
              <button className="text-xs text-muted hover:text-ink" type="submit">
                Sign out
    </button>
    </form>
    </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
            <Stat label="Businesses" value={businesses.length} />
        <Stat label="Resellers" value={resellers.length} />
        <Stat label="Listings" value={(listings || []).length} />
        <Stat label="Conversations" value={(threads || []).length} />
        <Stat label="Payments" value={(payments || []).length} />
  </div>

      <Section title="Businesses">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Business name</th>
              <th className="py-2 pr-3">Stripe onboarded</th>
              <th className="py-2 pr-3">Joined</th>
  </tr>
  </thead>
          <tbody>
{businesses.map((b) => (
                <tr key={b.id} className="border-b border-line">
                  <td className="py-2 pr-3">{b.name}</td>
                                <td className="py-2 pr-3">{b.email}</td>
                                <td className="py-2 pr-3">{b.business_name || "—"}</td>
                                <td className="py-2 pr-3">{b.stripe_onboarded ? "Yes" : "No"}</td>
                                <td className="py-2 pr-3">{fmt(b.created_at)}</td>
                </tr>
                            ))}
{businesses.length === 0 && (
                <tr>
                  <td className="py-2 text-muted" colSpan={5}>
                    No businesses yet.
  </td>
  </tr>
             )}
</tbody>
  </table>
  </Section>

      <Section title="Resellers">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Joined</th>
  </tr>
  </thead>
          <tbody>
{resellers.map((r) => (
                <tr key={r.id} className="border-b border-line">
                  <td className="py-2 pr-3">{r.name}</td>
                               <td className="py-2 pr-3">{r.email}</td>
                               <td className="py-2 pr-3">{fmt(r.created_at)}</td>
  </tr>
                           ))}
{resellers.length === 0 && (
                <tr>
                  <td className="py-2 text-muted" colSpan={3}>
                    No resellers yet.
  </td>
  </tr>
             )}
</tbody>
  </table>
  </Section>

      <Section title="Listings">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="py-2 pr-3">Title</th>
              <th className="py-2 pr-3">Business</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Posted</th>
  </tr>
  </thead>
          <tbody>
{(listings || []).map((l) => (
                <tr key={l.id} className="border-b border-line">
                  <td className="py-2 pr-3">{l.title}</td>
                                      <td className="py-2 pr-3">{nameFor(l.business_id)}</td>
                                      <td className="py-2 pr-3">{l.category}</td>
                                      <td className="py-2 pr-3">{l.status}</td>
                                      <td className="py-2 pr-3">{fmt(l.created_at)}</td>
  </tr>
                                  ))}
{(listings || []).length === 0 && (
                <tr>
                  <td className="py-2 text-muted" colSpan={5}>
                    No listings yet.
  </td>
  </tr>
             )}
</tbody>
  </table>
  </Section>

      <Section title="Conversations (business to reseller messages)">
          <div className="space-y-5">
{(threads || []).map((t) => {
              const msgs = messagesByThread.get(t.id) || [];
              const listing = listingMap.get(t.listing_id);
              return (
                              <div key={t.id} className="bg-surface border border-line rounded-xl2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="font-bold text-sm">
{nameFor(t.business_id)} with {nameFor(t.reseller_id)}
</div>
                  <div className="text-xs text-muted">
{listing ? `Re: ${listing.title}` : "Listing deleted"} — started {fmt(t.created_at)}
</div>
  </div>
{msgs.length === 0 ? (
                    <p className="text-xs text-muted">No messages yet.</p>
                 ) : (
                                     <div className="space-y-2">
                   {msgs.map((m) => (
                                         <div key={m.id} className="text-sm">
                                           <span className="font-semibold">{nameFor(m.sender_id)}:</span>{" "}
                 {m.type === "offer" ? (
                                             <span>Offer — ${m.offer_amount}</span>
                                          ) : (
                                                                      <span>{m.body}</span>
                                          )}
                        <span className="text-xs text-muted ml-2">{fmt(m.created_at)}</span>
                   </div>
                     ))}
</div>
                )}
</div>
            );
})}
{(threads || []).length === 0 && <p className="text-sm text-muted">No conversations yet.</p>}
  </div>
  </Section>

      <Section title="Payments">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="py-2 pr-3">Business</th>
               <th className="py-2 pr-3">Reseller</th>
               <th className="py-2 pr-3">Amount</th>
               <th className="py-2 pr-3">Status</th>
               <th className="py-2 pr-3">Date</th>
  </tr>
  </thead>
           <tbody>
{(payments || []).map((p) => (
                <tr key={p.id} className="border-b border-line">
                  <td className="py-2 pr-3">{nameFor(p.business_id)}</td>
                <td className="py-2 pr-3">{nameFor(p.reseller_id)}</td>
                <td className="py-2 pr-3">${p.amount}</td>
                <td className="py-2 pr-3">{p.status}</td>
                <td className="py-2 pr-3">{fmt(p.created_at)}</td>
  </tr>
            ))}
{(payments || []).length === 0 && (
                <tr>
                  <td className="py-2 text-muted" colSpan={5}>
                    No payments yet.
  </td>
  </tr>
             )}
</tbody>
  </table>
  </Section>
  </div>
  );
}

function Stat({ label, value }) {
    return (
          <div className="bg-surface border border-line rounded-xl2 p-4 text-center">
            <div className="text-2xl font-extrabold">{value}</div>
        <div className="text-xs text-muted">{label}</div>
      </div>
    );
}

function Section({ title, children }) {
    return (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3">{title}</h2>
  {children}
  </div>
    );
}
