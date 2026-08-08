import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

export async function POST(req) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "business") {
    return NextResponse.json({ error: "Only businesses can post listings" }, { status: 403 });
  }

  const body = await req.json();
  const { title, category, description, quantity, condition, tags } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("listings")
    .insert({
      business_id: user.id,
      title,
      category: category || "General",
      description: description || "",
      quantity: quantity || "",
      condition: condition || "",
      tags: Array.isArray(tags) ? tags : [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget: email every reseller who has this business as a Business
  // Partner. Requires RESEND_API_KEY to be set — silently does nothing without it,
  // so posting a listing never fails just because email isn't configured yet.
  notifyPartners(supabase, user.id, data).catch((err) => console.error("Partner email notify failed:", err));

  return NextResponse.json({ listing: data });
}

async function notifyPartners(supabase, businessId, listing) {
  if (!process.env.RESEND_API_KEY) return;

  const { data: partners } = await supabase
    .from("partnerships")
    .select("profiles!partnerships_reseller_id_fkey(email, name)")
    .eq("business_id", businessId);

  const { data: bizProfile } = await supabase
    .from("profiles")
    .select("business_name, name")
    .eq("id", businessId)
    .single();

  const bizName = bizProfile?.business_name || bizProfile?.name || "A business you follow";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const recipients = (partners || []).map((p) => p.profiles?.email).filter(Boolean);
  if (recipients.length === 0) return;

  await Promise.all(
    recipients.map((email) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Reselldock <notifications@reselldock.com>",
          to: email,
          subject: `${bizName} just posted new stock on Reselldock`,
          html: `<p><b>${bizName}</b> just listed <b>${listing.title}</b> on Reselldock.</p><p><a href="${siteUrl}/listings/${listing.id}">View the listing →</a></p>`,
        }),
      })
    )
  );
}
