import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import GateForm from "@/components/GateForm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    redirect(profile?.role === "business" ? "/dashboard" : "/feed");
  }

  return <GateForm />;
}
