import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

export async function DELETE(req, { params }) {
    const supabase = createServerSupabase();
    const {
          data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: listing } = await supabase
      .from("listings")
      .select("id, business_id")
      .eq("id", params.id)
      .single();

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (listing.business_id !== user.id) {
          return NextResponse.json({ error: "Not authorized to delete this listing" }, { status: 403 });
    }

  const { error } = await supabase.from("listings").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
