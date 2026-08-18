// Sends the two "sale confirmed" emails (business + reseller) once a Stripe
// checkout session completes. Uses the Resend REST API directly via fetch so
// this file needs no extra npm dependency.
const RESEND_API_URL = "https://api.resend.com/emails";
const FROM = process.env.RESEND_FROM || "Reselldock <sales@reselldock.com>";

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY || !to) return;
  try {
    await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
  } catch (err) {
    console.error("Resend email failed:", err);
  }
}

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

export async function sendSaleEmails(payment) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reselldock.com";
  const confirmation = payment.confirmation_number;
  const verifyUrl = `${siteUrl}/verify/${confirmation}`;
  const messagesUrl = `${siteUrl}/messages?thread=${payment.thread_id}`;
  const docUrl = `${siteUrl}/api/sales/${payment.id}/document`;

const sharedHtml = `
<p><strong>Confirmation #${confirmation}</strong></p>
<p>Amount: ${money(payment.amount)} &middot; Reselldock fee: ${money(payment.fee_amount)} &middot; Net to business: ${money(payment.net_amount)}</p>
<p>Business: ${payment.business?.name || "—"} &nbsp;|&nbsp; Reseller: ${payment.reseller?.name || "—"}</p>
<p>
<a href="${docUrl}">Download shipping documentation + receipt (PDF)</a><br/>
<a href="${messagesUrl}">View this conversation</a><br/>
<a href="${verifyUrl}">Verify this sale publicly</a>
</p>
<p style="color:#6B6B70;font-size:12px;">This email is your independent record of this transaction from Reselldock — keep it as proof of sale. If anything about this transaction looks wrong, contact support@reselldock.com.</p>
`;

await sendEmail({
  to: payment.business?.email,
  subject: `Sale confirmed — #${confirmation}`,
  html: `<h2>Your listing sold on Reselldock</h2>${sharedHtml}`,
});

await sendEmail({
  to: payment.reseller?.email,
  subject: `Purchase confirmed — #${confirmation}`,
  html: `<h2>Your purchase is confirmed</h2>${sharedHtml}`,
});
}
