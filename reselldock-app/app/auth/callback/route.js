import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const service = createServiceSupabase();
      const { data: existing } = await service
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      let role = existing?.role;

      if (!existing) {
        const meta = user.user_metadata || {};
        role = meta.role === "business" ? "business" : "reseller";
        await service.from("profiles").insert({
          id: user.id,
          name: meta.name || (user.email ? user.email.split("@")[0] : "New user"),
          email: user.email,
          role,
        });
      }

      return NextResponse.redirect(`${origin}${role === "business" ? "/dashboard" : "/feed"}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
