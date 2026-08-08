import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

export async function POST(req) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { threadId, body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });

  const { data: thread } = await supabase.from("threads").select("*").eq("id", threadId).single();
  if (!thread || (thread.business_id !== user.id && thread.reseller_id !== user.id)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { error } = await supabase
    .from("messages")
    .insert({ thread_id: threadId, sender_id: user.id, type: "text", body });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
