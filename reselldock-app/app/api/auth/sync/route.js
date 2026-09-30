import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST() {
    const supabase = createServerSupabase();
    const {
          data: { user },
    } = await supabase.auth.getUser();

  if (!user) {
        return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const service = createServiceSupabase();
    const { data: existing } = await service
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

  const meta = user.user_metadata || {};
    const selectedRole = meta.role === "business" ? "business" : "reseller";
    let role = selectedRole;

  if (!existing) {
        const { error: insertError } = await service.from("profiles").insert({
                id: user.id,
                name: meta.name || (user.email ? user.email.split("@")[0] : "New user"),
                email: user.email,
                role,
        });

      if (insertError) {
              console.error("Failed to create profile for", user.id, insertError);
              return NextResponse.json({ error: "profile_failed" }, { status: 500 });
      }
  } else if (existing.role === "admin") {
        role = "admin";
  } else if (existing.role !== selectedRole) {
        const { error: updateError } = await service
          .from("profiles")
          .update({ role: selectedRole })
          .eq("id", user.id);

      if (updateError) {
              console.error("Failed to update role for", user.id, updateError);
              role = existing.role;
      }
  } else {
        role = existing.role;
  }

  const destination = role === "admin" ? "/admin" : role === "business" ? "/dashboard" : "/feed";
    return NextResponse.json({ destination });
}
