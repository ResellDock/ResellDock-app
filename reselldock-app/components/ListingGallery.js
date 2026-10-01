"use client";
import { useState } from "react";

export default function ListingGallery({ images = [], title }) {
    const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
        return (
                <div className="h-72 rounded-xl2 bg-gradient-to-br from-[#EDEBE5] to-bg border border-line flex items-center justify-center text-muted text-sm mb-4">
                  📦 No photos yet
          </div>
        );
  }

  return (
        <div className="mb-4">
          <div className="h-72 rounded-xl2 overflow-hidden border border-line bg-[#EDEBE5] mb-2.5">
            <img src={images[active]} alt={title} className="w-full h-full object-cover" />
  </div>
{images.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto">
{images.map((src, i) => (
              <button
                          key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                                active === i ? "border-brand" : "border-transparent"
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
          ))}
            </div>
      )}
</div>
  );
}
