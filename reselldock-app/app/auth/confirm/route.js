import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function destinationFor(role) {
          if (role === "admin") return "/admin";
          if (role === "business") return "/dashboard";
          return "/feed";
        }

export async function GET(request) {
          const { searchParams, origin } = new URL(request.url);
          const token_hash = searchParams.get("token_hash");
          const type = searchParams.get("type") || "email";

          if (token_hash) {
                      const supabase = createServerSupabase();
                      const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

                      if (!error && data?.user) {
                                    const user = data.user;
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
                                                                      return NextResponse.redirect(`${origin}/?error=profile`);
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

                                    return NextResponse.redirect(`${origin}${destinationFor(role)}`);
                                  }

                      console.error("Magic link verification failed:", error);
                      return NextResponse.redirect(`${origin}/?error=auth&reason=${encodeURIComponent(error?.message || "unknown")}`);
                    }

          return NextResponse.redirect(`${origin}/?error=auth&reason=missing_token`);
        }
