import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
    const supabase = createServerSupabase();
    const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

    if (!user) {
          return NextResponse.json({ user: null, userError: userError?.message || null });
        }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
          userId: user.id,
          userEmail: user.email,
          profile,
          profileError: profileError?.message || null,
        });
  }
