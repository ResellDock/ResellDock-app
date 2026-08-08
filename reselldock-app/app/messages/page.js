import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import Header from "@/components/Header";
import MessagesClient from "@/components/MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage({ searchParams }) {
    const supabase = createServerSupabase();
    const {
          data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profile) redirect("/?error=profile");

  const { data: threads } = await supabase
      .from("threads")
      .select(
              `id, created_at, listing_id,
                     business:profiles!threads_business_id_fkey(id, name, stripe_account_id),
                            reseller:profiles!threads_reseller_id_fkey(id, name)`
            )
      .or(`business_id.eq.${user.id},reseller_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

  return (
        <div>
          <Header profile={profile} msgBadge={false} />
          <main className="max-w-5xl mx-auto px-5 py-7">
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">Messages</h1>
          <p className="text-muted text-sm mb-6">Direct messages between you and businesses on Reselldock.</p>
          <MessagesClient
            currentUserId={user.id}
          isBusiness={profile.role === "business"}
          threads={threads || []}
                      initialThreadId={searchParams?.thread}
        />
          </main>
          </div>
  );
}
