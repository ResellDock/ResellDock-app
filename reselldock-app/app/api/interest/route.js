import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

export async function POST(req) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { listingId } = await req.json();
  const { data: listing } = await supabase.from("listings").select("*").eq("id", listingId).single();
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  await supabase
    .from("interests")
    .upsert({ listing_id: listingId, reseller_id: user.id }, { onConflict: "listing_id,reseller_id" });

  let { data: thread } = await supabase
    .from("threads")
    .select("*")
    .eq("business_id", listing.business_id)
    .eq("reseller_id", user.id)
    .eq("listing_id", listingId)
    .single();

  if (!thread) {
    const { data: newThread, error } = await supabase
      .from("threads")
      .insert({ business_id: listing.business_id, reseller_id: user.id, listing_id: listingId })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    thread = newThread;

    await supabase.from("messages").insert({
      thread_id: thread.id,
      sender_id: user.id,
      type: "system",
      body: `Expressed interest in "${listing.title}"`,
    });
  }

  return NextResponse.json({ threadId: thread.id });
}
