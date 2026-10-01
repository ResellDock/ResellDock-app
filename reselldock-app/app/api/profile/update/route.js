import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

// Lets a signed-in user update their own profile. Also sets the "ship from"
// address that appears on the shipping documentation PDF generated once a
// sale completes (see /api/sales/[id]/document).
export async function POST(req) {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { name, business_name, address, phone } = await req.json();

  if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const update = { name: name.trim(), address: address ?? null, phone: phone ?? null };
    if (typeof business_name === "string") {
          update.business_name = business_name.trim() || null;
    }

  const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
