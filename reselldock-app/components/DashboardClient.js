"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabaseClient";

const MAX_IMAGES = 6;
const MAX_IMAGE_MB = 5;

export default function DashboardClient({
  listings,
  interestRows,
  partnerRows,
  stripeConnected,
  initialTab,
  businessAddress,
  businessPhone,
}) {
  const [tab, setTab] = useState(initialTab || "listings");
  return (
    <div>
      <div className="flex gap-0 border-b border-line mb-5">
        {[
          ["listings", "My Listings"],
          ["buyers", "Interested Buyers"],
          ["analytics", "Analytics"],
          ["wallet", "Wallet"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-2.5 mr-6 text-sm font-bold border-b-2 ${
              tab === key ? "border-brand text-ink" : "border-transparent text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "listings" && <ListingsTab listings={listings} />}
      {tab === "buyers" && <BuyersTab interestRows={interestRows} partnerRows={partnerRows} />}
      {tab === "analytics" && (
        <AnalyticsTab listings={listings} interestRows={interestRows} partnerRows={partnerRows} />
      )}
      {tab === "wallet" && (
        <WalletTab stripeConnected={stripeConnected} businessAddress={businessAddress} businessPhone={businessPhone} />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// Minimal CSV parser — handles quoted fields containing commas.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function ListingsTab({ listings }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Clothing", quantity: "", condition: "", description: "" });
  const [photos, setPhotos] = useState([]); // [{ file, preview }]
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const csvInputRef = useRef(null);
  const [csvStatus, setCsvStatus] = useState("");
  const [csvError, setCsvError] = useState("");
  const [csvBusy, setCsvBusy] = useState(false);

  function addPhotos(fileList) {
    setError("");
    const incoming = Array.from(fileList || []);
    const room = MAX_IMAGES - photos.length;
    if (room <= 0) {
      setError(`You can attach up to ${MAX_IMAGES} photos.`);
      return;
    }
    const accepted = [];
    for (const file of incoming.slice(0, room)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        setError(`"${file.name}" is over ${MAX_IMAGE_MB}MB and was skipped.`);
        continue;
      }
      accepted.push({ file, preview: URL.createObjectURL(file) });
    }
    setPhotos((prev) => [...prev, ...accepted]);
  }

  function removePhoto(index) {
    setPhotos((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  }

  async function uploadPhotos() {
    if (photos.length === 0) return [];
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in.");

    const urls = [];
    for (let i = 0; i < photos.length; i++) {
      setUploadStatus(`Uploading photo ${i + 1} of ${photos.length}...`);
      const { file } = photos[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}-${i}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("listing-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setUploadStatus("");
    return urls;
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const images = await uploadPhotos();
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags: [form.category], images }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not post listing.");
      }
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setForm({ title: "", category: "Clothing", quantity: "", condition: "", description: "" });
      setPhotos([]);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err.message || "Something went wrong posting your listing.");
    } finally {
      setSaving(false);
      setUploadStatus("");
    }
  }

  async function deleteListing(id, title) {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not delete listing.");
      }
      router.refresh();
    } catch (err) {
      alert(err.message || "Something went wrong deleting this listing.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCsvFile(file) {
    setCsvError("");
    setCsvStatus("");
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        setCsvError("CSV needs a header row plus at least one listing row.");
        return;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const titleIdx = header.indexOf("title");
      if (titleIdx === -1) {
        setCsvError('CSV must include a "title" column. Expected headers: title, category, quantity, condition, description.');
        return;
      }
      const categoryIdx = header.indexOf("category");
      const quantityIdx = header.indexOf("quantity");
      const conditionIdx = header.indexOf("condition");
      const descriptionIdx = header.indexOf("description");

      const dataRows = rows.slice(1).filter((r) => (r[titleIdx] || "").trim());
      if (dataRows.length === 0) {
        setCsvError("No listing rows found below the header.");
        return;
      }

      setCsvBusy(true);
      let success = 0;
      let failed = 0;
      for (let i = 0; i < dataRows.length; i++) {
        const r = dataRows[i];
        setCsvStatus(`Uploading ${i + 1} of ${dataRows.length}...`);
        const title = (r[titleIdx] || "").trim();
        const category = categoryIdx !== -1 ? (r[categoryIdx] || "").trim() : "";
        const quantity = quantityIdx !== -1 ? (r[quantityIdx] || "").trim() : "";
        const condition = conditionIdx !== -1 ? (r[conditionIdx] || "").trim() : "";
        const description = descriptionIdx !== -1 ? (r[descriptionIdx] || "").trim() : "";
        try {
          const res = await fetch("/api/listings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              category: CATEGORIES.includes(category) ? category : "General",
              quantity,
              condition,
              description,
              tags: category ? [category] : [],
            }),
          });
          if (res.ok) success++;
          else failed++;
        } catch {
          failed++;
        }
      }
      setCsvStatus(`Done — ${success} listing${success === 1 ? "" : "s"} added${failed ? `, ${failed} failed` : ""}.`);
      router.refresh();
    } catch (err) {
      setCsvError(err.message || "Could not read that CSV file.");
    } finally {
      setCsvBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold">My Listings</h3>
        <div className="flex gap-2.5">
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={csvBusy}
            className="bg-white border border-line text-ink font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-[#F7F6F2] disabled:opacity-60"
          >
            {csvBusy ? "Uploading..." : "Bulk Upload CSV"}
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              handleCsvFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-brand text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-dark"
          >
            {showForm ? "Cancel" : "+ List New Stock"}
          </button>
        </div>
      </div>

      {(csvStatus || csvError) && (
        <div className="mb-5 bg-surface border border-line rounded-xl2 p-3.5 text-sm">
          {csvError ? <p className="text-red-600">{csvError}</p> : <p>{csvStatus}</p>}
          <p className="text-[11.5px] text-muted mt-1.5">
            Expected columns: title (required), category, quantity, condition, description.
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="bg-surface border border-line rounded-xl2 p-5 mb-5">
          <h3 className="font-bold mb-3.5">Post New Stock</h3>
          {error && <p className="text-red-600 text-xs mb-3">{error}</p>}
          <div className="grid sm:grid-cols-2 gap-3.5 mb-1">
            <Field label="Title">
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Overstock Denim Jackets, 300 units"
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm"
              />
            </Field>
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="e.g. 300 units"
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm"
              />
            </Field>
            <Field label="Condition">
              <input
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                placeholder="e.g. New with tags"
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the stock lot..."
                  className="w-full border border-line rounded-lg px-3 py-2.5 text-sm"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label={`Photos (optional, up to ${MAX_IMAGES})`}>
                <div className="flex flex-wrap gap-2.5 mb-2.5">
                  {photos.map((p, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-line">
                      <img src={p.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-5 text-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_IMAGES && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-line flex items-center justify-center text-muted text-xs cursor-pointer hover:border-brand hover:text-brand-dark">
                      + Add
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          addPhotos(e.target.files);
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-[11px] text-muted">JPG or PNG, up to {MAX_IMAGE_MB}MB each.</p>
              </Field>
            </div>
          </div>
          <button
            disabled={saving}
            className="mt-2 bg-brand text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-dark disabled:opacity-60"
          >
            {uploadStatus || (saving ? "Posting..." : "Post Listing")}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {listings.map((l) => {
          const isSold = l.status === "sold";
          const thumb = Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : null;
          return (
            <div
              key={l.id}
              className={`bg-surface border border-line rounded-xl2 p-4 flex items-center gap-3.5 ${isSold ? "opacity-70" : ""}`}
            >
              {thumb ? (
                <img src={thumb} alt="" className="w-14 h-14 rounded-lg object-cover border border-line flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-[#F1F0EC] flex items-center justify-center text-lg flex-shrink-0">
                  📦
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-bold text-sm">{l.title}</div>
                  {isSold && (
                    <span className="bg-ink text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Sold
                    </span>
                  )}
                </div>
                <div className="text-muted text-xs">
                  {l.category} {l.quantity ? `· ${l.quantity}` : ""}
                </div>
              </div>
              <button
                onClick={() => deleteListing(l.id, l.title)}
                disabled={deletingId === l.id}
                className="text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 flex-shrink-0"
              >
                {deletingId === l.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          );
        })}
        {listings.length === 0 && <p className="text-muted text-sm">No live listings yet.</p>}
      </div>
    </div>
  );
}

function BuyersTab({ interestRows, partnerRows }) {
  const items = [
    ...interestRows.map((r) => ({
      text: `${r.reseller?.name || "Someone"} clicked Interested on "${r.listing?.title || "a listing"}"`,
      time: r.created_at,
    })),
    ...partnerRows.map((r) => ({
      text: `${r.reseller?.name || "Someone"} became a Business Partner`,
      time: r.created_at,
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  if (items.length === 0) return <p className="text-muted text-sm">No activity yet.</p>;

  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-3 bg-surface border border-line rounded-xl px-4 py-3.5">
          <div className="text-sm flex-1">{it.text}</div>
          <div className="text-[11.5px] text-muted">{new Date(it.time).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-surface border border-line rounded-xl2 p-4.5">
      <div className="text-muted text-xs font-semibold mb-1.5">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function AnalyticsTab({ listings, interestRows, partnerRows }) {
  const activeListings = listings.filter((l) => l.status !== "sold");
  const soldListings = listings.filter((l) => l.status === "sold");
  const totalInterest = interestRows.length;
  const totalPartners = partnerRows.length;

  const byCategory = {};
  for (const l of listings) {
    const cat = l.category || "General";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  const categoryRows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  const interestByListing = {};
  for (const r of interestRows) {
    const title = r.listing?.title || "Untitled listing";
    interestByListing[title] = (interestByListing[title] || 0) + 1;
  }
  const topListings = Object.entries(interestByListing)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const avgInterest = activeListings.length > 0 ? (totalInterest / listings.length || 0).toFixed(1) : "0";

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard label="Active listings" value={activeListings.length} />
        <StatCard label="Sold listings" value={soldListings.length} />
        <StatCard label="Total interest clicks" value={totalInterest} />
        <StatCard label="Business partners" value={totalPartners} />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="bg-surface border border-line rounded-xl2 p-4.5">
          <h3 className="font-bold text-sm mb-3.5">Listings by category</h3>
          {categoryRows.length === 0 ? (
            <p className="text-muted text-sm">No listings yet.</p>
          ) : (
            <div className="space-y-2">
              {categoryRows.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <div className="text-sm flex-1">{cat}</div>
                  <div className="h-2 bg-brand-soft rounded-full flex-1 overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full"
                      style={{ width: `${(count / listings.length) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted w-6 text-right">{count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-line rounded-xl2 p-4.5">
          <h3 className="font-bold text-sm mb-3.5">Most interest</h3>
          {topListings.length === 0 ? (
            <p className="text-muted text-sm">No interest yet — share your listings to get started.</p>
          ) : (
            <div className="space-y-2.5">
              {topListings.map(([title, count]) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="text-sm flex-1 truncate">{title}</div>
                  <div className="text-xs font-bold text-brand-dark bg-brand-soft px-2 py-0.5 rounded-full">
                    {count} {count === 1 ? "click" : "clicks"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11.5px] text-muted mt-5">
        Average of {avgInterest} interest click{avgInterest === "1" ? "" : "s"} per listing.
      </p>
    </div>
  );
}

function WalletTab({ stripeConnected, businessAddress, businessPhone }) {
  const [balance, setBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [msg, setMsg] = useState("");
  const [address, setAddress] = useState(businessAddress || "");
  const [phone, setPhone] = useState(businessPhone || "");
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/balance")
      .then((r) => r.json())
      .then(setBalance);
  }, []);

  async function connectStripe() {
    setConnecting(true);
    const res = await fetch("/api/stripe/onboard", { method: "POST" });
    const data = await res.json();
    setConnecting(false);
    if (data.url) window.location.href = data.url;
    else setMsg(data.error || "Could not start Stripe onboarding.");
  }

  async function withdraw() {
    setWithdrawing(true);
    const res = await fetch("/api/stripe/payout", { method: "POST" });
    const data = await res.json();
    setWithdrawing(false);
    if (res.ok) {
      setMsg("Payout initiated — funds are on their way to your bank (1-2 business days).");
      fetch("/api/stripe/balance")
        .then((r) => r.json())
        .then(setBalance);
    } else {
      setMsg(data.error || "Could not start payout.");
    }
  }

  async function saveAddress() {
    setSavingAddress(true);
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, phone }),
    });
    setSavingAddress(false);
    setMsg(res.ok ? "Shipping address saved." : "Could not save address.");
  }

  const addressCard = (
    <div className="bg-surface border border-line rounded-xl2 p-4.5 mb-5">
      <h3 className="font-bold text-sm mb-1">Ship-From Address</h3>
      <p className="text-muted text-xs mb-3">
        This appears on the shipping documentation generated automatically once a sale completes.
      </p>
      <textarea
        rows={2}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Street, city, state, ZIP, country"
        className="w-full border border-line rounded-lg px-3 py-2.5 text-sm mb-2.5"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Contact phone"
        className="w-full border border-line rounded-lg px-3 py-2.5 text-sm mb-3"
      />
      <button
        onClick={saveAddress}
        disabled={savingAddress}
        className="bg-ink text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-60"
      >
        {savingAddress ? "Saving..." : "Save Address"}
      </button>
    </div>
  );

  if (!stripeConnected) {
    return (
      <div>
        {addressCard}
        <div className="bg-surface border border-line rounded-xl2 p-6 text-center">
          <p className="text-sm text-muted mb-4">Connect Stripe to receive payments from resellers and access your wallet.</p>
          <button
            onClick={connectStripe}
            disabled={connecting}
            className="bg-brand text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-brand-dark disabled:opacity-60"
          >
            {connecting ? "Redirecting..." : "Connect Stripe"}
          </button>
          {msg && <p className="text-sm mt-4">{msg}</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      {addressCard}
      <div className="grid sm:grid-cols-3 gap-3.5 mb-6">
        <div className="bg-ink text-white rounded-xl2 p-4.5">
          <div className="text-[#B8B8B8] text-xs font-semibold mb-1.5">Available balance</div>
          <div className="text-2xl font-extrabold">${balance ? balance.available.toFixed(2) : "—"}</div>
          <button
            onClick={withdraw}
            disabled={withdrawing}
            className="mt-3.5 bg-white text-ink text-sm font-bold px-3.5 py-2 rounded-lg disabled:opacity-60"
          >
            {withdrawing ? "Processing..." : "Withdraw to Bank"}
          </button>
        </div>
        <div className="bg-surface border border-line rounded-xl2 p-4.5">
          <div className="text-muted text-xs font-semibold mb-1.5">Pending</div>
          <div className="text-2xl font-extrabold">${balance ? balance.pending.toFixed(2) : "—"}</div>
        </div>
        <div className="bg-surface border border-line rounded-xl2 p-4.5">
          <div className="text-muted text-xs font-semibold mb-1.5">Platform fee rate</div>
          <div className="text-2xl font-extrabold">2%</div>
        </div>
      </div>
      {msg && <p className="text-sm mb-4">{msg}</p>}
      <p className="text-xs text-muted">
        Balances and payouts are managed directly by Stripe on your connected account — Reselldock never holds your funds itself.
      </p>
    </div>
  );
}
