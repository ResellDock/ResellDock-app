"use client";
import { useState } from "react";

export default function ProfileForm({ profile }) {
    const [name, setName] = useState(profile.name || "");
    const [businessName, setBusinessName] = useState(profile.business_name || "");
    const [phone, setPhone] = useState(profile.phone || "");
    const [address, setAddress] = useState(profile.address || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);

  const isBusiness = profile.role === "business";

  async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSaved(false);
        if (!name.trim()) {
                setError("Name is required.");
                return;
        }
        setLoading(true);
        const body = { name: name.trim(), phone, address };
        if (isBusiness) body.business_name = businessName.trim();

      const res = await fetch("/api/profile/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
      });
        setLoading(false);
        if (res.ok) {
                setSaved(true);
        } else {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "Something went wrong. Please try again.");
        }
  }

  return (
        <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-xl2 p-5 space-y-4">
  {error && <div className="text-red-600 text-sm">{error}</div>}
  {saved && <div className="text-green-600 text-sm">Profile saved.</div>}

        <div>
            <label className="block text-xs font-bold text-muted mb-1">Name</label>
           <input
             type="text"
             value={name}
             onChange={(e) => setName(e.target.value)}
             className="w-full border border-line rounded-lg px-3 py-2 text-sm"
           />
               </div>

   {isBusiness && (
             <div>
               <label className="block text-xs font-bold text-muted mb-1">Business name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              />
                  </div>
          )}

        <div>
                  <label className="block text-xs font-bold text-muted mb-1">Email</label>
           <input
             type="text"
             value={profile.email || ""}
            readOnly
            className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-[#F1F0EC] text-muted"
          />
              </div>

      <div>
                      <label className="block text-xs font-bold text-muted mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
              </div>

      <div>
                      <label className="block text-xs font-bold text-muted mb-1">
            {isBusiness ? "Ship-from address" : "Address"}
</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm"
        />
            </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-brand text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save changes"}
</button>
  </form>
  );
}
