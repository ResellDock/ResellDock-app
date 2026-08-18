import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

// Lets a signed-in user update their own address/phone. Used by businesses to
// set the "ship from" address that appears on the shipping documentation PDF
// generated once a sale completes (see /api/sales/[id]/document).
export async function POST(req) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

const { address, phone } = await req.json();

const { error } = await supabase
  .from("profiles")
  .update({ address: address ?? null, phone: phone ?? null })
  .eq("id", user.id);

if (error) return NextResponse.json({ error: error.message }, { status: 400 });

return NextResponse.json({ ok: true });
}
