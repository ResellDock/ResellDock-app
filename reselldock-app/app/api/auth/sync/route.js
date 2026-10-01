import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(request) {
      const body = await request.json().catch(() => ({}));

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
      // Prefer the role/name the client just selected on this sign-in (sent in the
  // request body). Supabase does not reliably refresh user_metadata for an
  // already-existing user on repeat signInWithOtp calls, so falling back to
  // meta.role here would keep returning users stuck on whatever role they
  // picked the very first time they signed up.
  const requestedRole = body.role === "business" ? "business" : "reseller";
      const requestedName =
              typeof body.name === "string" && body.name.trim()
          ? body.name.trim()
                : meta.name || (user.email ? user.email.split("@")[0] : "New user");

  let role = requestedRole;

  if (!existing) {
          const { error: insertError } = await service.from("profiles").insert({
                    id: user.id,
                    name: requestedName,
                    email: user.email,
                    role,
          });

        if (insertError) {
                  console.error("Failed to create profile for", user.id, insertError);
                  return NextResponse.json({ error: "profile_failed" }, { status: 500 });
        }
  } else if (existing.role === "admin") {
          role = "admin";
  } else if (existing.role !== requestedRole) {
          const { error: updateError } = await service
            .from("profiles")
            .update({ role: requestedRole, name: requestedName })
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
