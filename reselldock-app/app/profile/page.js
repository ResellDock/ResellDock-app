import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import Header from "@/components/Header";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const supabase = createServerSupabase();
    const {
          data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profile) redirect("/login");

  return (
        <div>
          <Header profile={profile} />
          <main className="max-w-2xl mx-auto px-5 py-7">
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">Your Profile</h1>
          <p className="text-muted text-sm mb-6">Manage your account details.</p>
          <ProfileForm profile={profile} />
    </main>
    </div>
    );
}
