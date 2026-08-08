import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

export async function POST(req) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { threadId, amount } = await req.json();
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) return NextResponse.json({ error: "Enter a valid price" }, { status: 400 });

  const { data: thread } = await supabase.from("threads").select("*").eq("id", threadId).single();
  if (!thread || thread.business_id !== user.id) {
    return NextResponse.json({ error: "Only the business in this thread can send a price" }, { status: 403 });
  }

  const { error } = await supabase.from("messages").insert({
    thread_id: threadId,
    sender_id: user.id,
    type: "offer",
    offer_amount: numAmount,
    body: `Price offer: $${numAmount.toFixed(2)}`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
