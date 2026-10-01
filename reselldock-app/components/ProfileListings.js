"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileListings({ listings }) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState(null);

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

  return (
        <div className="bg-surface border border-line rounded-xl2 p-5 mt-6">
          <h2 className="font-bold mb-1">Your Listings</h2>
        <p className="text-muted text-sm mb-4">Manage the stock you've posted. Deleting a listing removes it permanently.</p>
  {listings.length === 0 ? (
            <p className="text-muted text-sm">No live listings yet.</p>
         ) : (
                   <div className="space-y-3">
           {listings.map((l) => {
                       const isSold = l.status === "sold";
                       const thumb = Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : null;
                       return (
                                       <div
                           key={l.id}
                                         className={`border border-line rounded-xl p-3.5 flex items-center gap-3.5 ${isSold ? "opacity-70" : ""}`}
                 >
   {thumb ? (
                       <img src={thumb} alt="" className="w-12 h-12 rounded-lg object-cover border border-line flex-shrink-0" />
                     ) : (
                                         <div className="w-12 h-12 rounded-lg bg-[#F1F0EC] flex items-center justify-center text-base flex-shrink-0">
                                           PKG
     </div>
                    )}
                   <div className="flex-1">
                                       <div className="flex items-center gap-2 mb-0.5">
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
</div>
      )}
</div>
  );
}
