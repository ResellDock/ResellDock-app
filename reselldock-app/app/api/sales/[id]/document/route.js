import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createServerSupabase } from "@/lib/supabaseServer";

// Generates the 2-page "Sale Documents" PDF for a completed transaction:
// page 1 is a shipping document (who ships what, to whom), page 2 is the
// receipt / proof of sale (confirmation number, amounts, verification link).
// Only the business and reseller who were party to this sale can download it.
export async function GET(req, { params }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

const { data: payment } = await supabase
  .from("payments")
  .select(
    `*,
    business:profiles!payments_business_id_fkey(name,business_name,email,address,phone),
    reseller:profiles!payments_reseller_id_fkey(name,email),
    listing:listings(title,category,quantity,condition)`
    )
  .eq("id", params.id)
  .single();

if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payment.business_id !== user.id && payment.reseller_id !== user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (payment.status !== "paid" || !payment.confirmation_number) {
    return NextResponse.json({ error: "This sale isn't confirmed yet." }, { status: 400 });
  }

const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

const INK = rgb(0.106, 0.106, 0.114);
  const MUTED = rgb(0.42, 0.42, 0.44);
  const BRAND = rgb(0.055, 0.486, 0.4);
  const LINE = rgb(0.906, 0.894, 0.871);

const dateStr = new Date(payment.created_at).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function newPage() {
  const page = pdf.addPage([612, 792]);
  let y = 740;

  function text(str, opts = {}) {
    const { x = 56, size = 11, f = font, color = INK, gap = 18 } = opts;
    page.drawText(str, { x, y, size, font: f, color });
    y -= gap;
  }

  function rule() {
    page.drawLine({ start: { x: 56, y }, end: { x: 556, y }, thickness: 1, color: LINE });
    y -= 16;
  }

  function label(str) {
    page.drawText(str.toUpperCase(), { x: 56, y, size: 9, font: bold, color: MUTED });
    y -= 14;
  }

  return {
    page,
    text,
    rule,
    label,
    get y() {
      return y;
    },
    set y(v) {
      y = v;
    },
  };
}

// ---- Page 1: Shipping Documentation ----
  {
    const p = newPage();
    p.page.drawText("Reselldock", { x: 56, y: 760, size: 22, font: bold, color: INK });
    p.page.drawText("Shipping Documentation", { x: 56, y: 736, size: 13, font, color: MUTED });
    p.page.drawText(`Confirmation #${payment.confirmation_number}`, {
      x: 380,
      y: 760,
      size: 11,
      font: bold,
      color: BRAND,
    });
    p.page.drawText(dateStr, { x: 380, y: 744, size: 10, font, color: MUTED });

  p.y = 700;
    p.rule();

  p.label("Ship From (Business)");
    p.text(payment.business?.business_name || payment.business?.name || "—", { size: 12, f: bold });
    (payment.business?.address || "Address on file with Reselldock — contact via Reselldock Messages")
    .split("\n")
    .forEach((line) => p.text(line, { size: 10.5, color: MUTED }));
    if (payment.business?.phone) p.text(payment.business.phone, { size: 10.5, color: MUTED });
    if (payment.business?.email) p.text(payment.business.email, { size: 10.5, color: MUTED });

  p.y -= 10;
    p.rule();

  p.label("Ship To (Reseller)");
    p.text(payment.shipping_name || payment.reseller?.name || "—", { size: 12, f: bold });
    const shipLines = [
      payment.shipping_address_line1,
      payment.shipping_address_line2,
      [payment.shipping_city, payment.shipping_state, payment.shipping_postal_code].filter(Boolean).join(", "),
      payment.shipping_country,
      ].filter(Boolean);
    if (shipLines.length) {
      shipLines.forEach((line) => p.text(line, { size: 10.5, color: MUTED }));
    } else {
      p.text("No shipping address on file — contact the reseller via Reselldock Messages.", {
        size: 10.5,
        color: MUTED,
      });
    }
    if (payment.shipping_phone) p.text(payment.shipping_phone, { size: 10.5, color: MUTED });

  p.y -= 10;
    p.rule();

  p.label("Shipment Contents");
    p.text(payment.listing?.title || "Stock lot", { size: 12, f: bold });
    const details = [payment.listing?.category, payment.listing?.quantity, payment.listing?.condition]
    .filter(Boolean)
    .join("  ·  ");
    if (details) p.text(details, { size: 10.5, color: MUTED });

  p.y -= 24;
    p.text("Signatures", { size: 9, color: MUTED, gap: 40 });
    p.page.drawLine({ start: { x: 56, y: p.y + 20 }, end: { x: 260, y: p.y + 20 }, thickness: 1, color: LINE });
    p.page.drawText("Shipped by (business)", { x: 56, y: p.y + 4, size: 8, font, color: MUTED });
    p.page.drawLine({ start: { x: 320, y: p.y + 20 }, end: { x: 524, y: p.y + 20 }, thickness: 1, color: LINE });
    p.page.drawText("Received by (reseller)", { x: 320, y: p.y + 4, size: 8, font, color: MUTED });

  p.page.drawText("Generated automatically by Reselldock — reselldock.com", {
    x: 56,
    y: 40,
    size: 8,
    font,
    color: MUTED,
  });
  }

// ---- Page 2: Receipt / Proof of Sale ----
  {
    const p = newPage();
    p.page.drawText("Reselldock", { x: 56, y: 760, size: 22, font: bold, color: INK });
    p.page.drawText("Receipt & Proof of Sale", { x: 56, y: 736, size: 13, font, color: MUTED });
    p.page.drawText(`Confirmation #${payment.confirmation_number}`, {
      x: 380,
      y: 760,
      size: 11,
      font: bold,
      color: BRAND,
    });
    p.page.drawText(dateStr, { x: 380, y: 744, size: 10, font, color: MUTED });

  p.y = 700;
    p.rule();

  p.label("Business (Seller)");
    p.text(payment.business?.business_name || payment.business?.name || "—", { size: 12, f: bold });
    if (payment.business?.email) p.text(payment.business.email, { size: 10.5, color: MUTED });

  p.y -= 6;
    p.label("Reseller (Buyer)");
    p.text(payment.reseller?.name || "—", { size: 12, f: bold });
    if (payment.reseller?.email) p.text(payment.reseller.email, { size: 10.5, color: MUTED });

  p.y -= 10;
    p.rule();

  p.label("Item");
    p.text(payment.listing?.title || "Stock lot", { size: 12, f: bold });

  p.y -= 10;
    p.rule();

  p.label("Payment Summary");
    p.text(`Sale amount:          $${Number(payment.amount).toFixed(2)}`, { size: 11 });
    p.text(`Reselldock fee (2%):  $${Number(payment.fee_amount).toFixed(2)}`, { size: 11, color: MUTED });
    p.text(`Net to business:      $${Number(payment.net_amount).toFixed(2)}`, { size: 11 });
    p.text("Payment status: PAID via Stripe", { size: 11, f: bold, color: BRAND });

  p.y -= 20;
    p.rule();

  p.label("Verification");
    p.text(`Verify this sale at: reselldock.com/verify/${payment.confirmation_number}`, {
      size: 10.5,
      color: MUTED,
    });
    p.text("This document is Reselldock's independent record of this transaction and is generated", {
      size: 9,
      color: MUTED,
      gap: 12,
    });
    p.text("automatically when payment clears — it cannot be edited by either party.", {
      size: 9,
      color: MUTED,
    });

  p.page.drawText("Generated automatically by Reselldock — reselldock.com", {
    x: 56,
    y: 40,
    size: 8,
    font,
    color: MUTED,
  });
  }

const bytes = await pdf.save();

return new Response(bytes, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="Reselldock-${payment.confirmation_number}.pdf"`,
  },
});
}
