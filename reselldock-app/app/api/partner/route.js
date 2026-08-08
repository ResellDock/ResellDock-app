import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

export async function POST(req) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { businessId } = await req.json();
  const { data: existing } = await supabase
    .from("partnerships")
    .select("id")
    .eq("reseller_id", user.id)
    .eq("business_id", businessId)
    .single();

  if (existing) {
    await supabase.from("partnerships").delete().eq("id", existing.id);
    return NextResponse.json({ partnered: false });
  }

  await supabase.from("partnerships").insert({ reseller_id: user.id, business_id: businessId });
  return NextResponse.json({ partnered: true });
}
