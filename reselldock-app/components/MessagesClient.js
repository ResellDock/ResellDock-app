"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function MessagesClient({ currentUserId, isBusiness, threads, initialThreadId }) {
  const [activeId, setActiveId] = useState(initialThreadId || threads[0]?.id || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const channel = supabase
      .channel(`thread-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${activeId}` },
        () => loadMessages(activeId)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  async function loadMessages(threadId) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  }

  async function sendMessage() {
    if (!input.trim()) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: activeId, body: input }),
    });
    setInput("");
    loadMessages(activeId);
  }

  async function sendOffer() {
    if (!offerAmount || Number(offerAmount) <= 0) return;
    await fetch("/api/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: activeId, amount: offerAmount }),
    });
    setOfferAmount("");
    loadMessages(activeId);
  }

  async function payNow(messageId) {
    setLoading(true);
    const res = await fetch("/api/stripe/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || "Could not start checkout.");
    }
  }

  if (threads.length === 0) {
    return <p className="text-muted text-sm">No conversations yet. Click &quot;Interested&quot; on a listing to start one.</p>;
  }

  const activeThread = threads.find((t) => t.id === activeId);
  const otherName = activeThread ? (isBusiness ? activeThread.reseller?.name : activeThread.business?.name) : "";

  return (
    <div className="grid grid-cols-[280px_1fr] h-[560px] bg-surface border border-line rounded-xl2 overflow-hidden">
      <div className="border-r border-line overflow-y-auto">
        {threads.map((t) => {
          const name = isBusiness ? t.reseller?.name : t.business?.name;
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`w-full text-left px-4 py-3.5 border-b border-line flex gap-2.5 items-center ${
                t.id === activeId ? "bg-brand-soft" : "hover:bg-[#FAF9F6]"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand-dark flex items-center justify-center font-extrabold text-xs">
                {name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="font-bold text-sm truncate">{name}</div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col">
        <div className="px-4 py-3.5 border-b border-line font-bold text-sm">{otherName}</div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {messages.map((m) => {
            if (m.type === "system") {
              return (
                <div key={m.id} className="self-center bg-warn-soft text-[#8A5E10] text-xs font-semibold rounded-full px-3.5 py-1.5">
                  {m.body}
                </div>
              );
            }
            if (m.type === "offer") {
              return (
                <div key={m.id} className="self-start bg-white border-[1.5px] border-brand rounded-xl2 p-3.5 max-w-[280px]">
                  <div className="text-[11px] font-bold text-brand-dark uppercase tracking-wide mb-1">Price Offer</div>
                  <div className="text-xl font-extrabold mb-2.5">${Number(m.offer_amount).toLocaleString()}</div>
                  {!isBusiness && (
                    <button
                      onClick={() => payNow(m.id)}
                      disabled={loading}
                      className="w-full py-2 rounded-lg bg-brand text-white text-sm font-bold disabled:opacity-60"
                    >
                      {loading ? "Redirecting..." : "Pay Now"}
                    </button>
                  )}
                </div>
              );
            }
            const mine = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm ${
                  mine ? "self-end bg-brand text-white" : "self-start bg-[#F1F0EC]"
                }`}
              >
                {m.body}
              </div>
            );
          })}
        </div>
        <div className="border-t border-line p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 border border-line rounded-full px-4 py-2.5 text-sm"
          />
          <button onClick={sendMessage} className="bg-brand text-white rounded-full px-4.5 py-2.5 text-sm font-bold">
            Send
          </button>
        </div>
        {isBusiness && (
          <div className="border-t border-line p-3 flex gap-2">
            <input
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              type="number"
              placeholder="Send a price, e.g. 450"
              className="flex-1 border border-line rounded-full px-4 py-2.5 text-sm"
            />
            <button onClick={sendOffer} className="bg-ink text-white rounded-full px-4.5 py-2.5 text-sm font-bold">
              Send Price
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
