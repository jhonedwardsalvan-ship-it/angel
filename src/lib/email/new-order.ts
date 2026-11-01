import "server-only";
import { DELIVERY_SLOTS } from "@/lib/checkout/delivery";
import { env } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { sendMail } from "./mailer";

export type NewOrderEmail = {
  id: string;
  number: string;
  customer: { name: string; email: string; phone: string };
  delivery: { recipientName: string; address: string; city: string; date: string; slot: keyof typeof DELIVERY_SLOTS };
  cardMessage: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

function escape(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Emails the shop owner (ORDER_NOTIFY_EMAIL, else GMAIL_USER) about a new order. Never throws. */
export async function sendNewOrderEmail(order: NewOrderEmail) {
  const to = process.env.ORDER_NOTIFY_EMAIL || process.env.GMAIL_USER;
  if (!to) return;

  const adminUrl = `${env.BETTER_AUTH_URL.replace(/\/$/, "")}/admin/orders/${order.id}`;
  const { customer, delivery } = order;
  const when = `${delivery.date}, ${DELIVERY_SLOTS[delivery.slot]}`;
  const details: [string, string][] = [
    ["Customer", customer.name],
    ["Email", customer.email],
    ["Phone", customer.phone],
    ["Recipient", delivery.recipientName],
    ["Address", `${delivery.address}, ${delivery.city}`],
    ["Delivery", when],
    ...(order.cardMessage ? [["Card message", order.cardMessage] as [string, string]] : []),
  ];
  const totals: [string, string][] = [
    ["Subtotal", formatPrice(order.subtotal)],
    ["Delivery", order.deliveryFee ? formatPrice(order.deliveryFee) : "Free"],
    ["Total", formatPrice(order.total)],
  ];

  const text = [
    `New order ${order.number} — ${formatPrice(order.total)}`,
    "",
    ...details.map(([k, v]) => `${k}: ${v}`),
    "",
    ...order.items.map((i) => `${i.quantity} × ${i.name} — ${formatPrice(i.lineTotal)}`),
    "",
    ...totals.map(([k, v]) => `${k}: ${v}`),
    "",
    `Open in admin: ${adminUrl}`,
  ].join("\n");

  const row = (k: string, v: string, bold = false) =>
    `<tr><td style="padding:4px 16px 4px 0;color:#6b6b6b;vertical-align:top">${escape(k)}</td>` +
    `<td style="padding:4px 0;${bold ? "font-weight:600" : ""}">${escape(v)}</td></tr>`;
  const html = `
<div style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#1f1f1f;max-width:560px">
  <h2 style="margin:0 0 4px">New order ${escape(order.number)}</h2>
  <p style="margin:0 0 20px;color:#6b6b6b">${escape(formatPrice(order.total))} · deliver ${escape(when)}</p>
  <table style="border-collapse:collapse;margin-bottom:20px">${details.map(([k, v]) => row(k, v)).join("")}</table>
  <table style="border-collapse:collapse;width:100%;margin-bottom:12px">
    ${order.items
      .map(
        (i) =>
          `<tr><td style="padding:6px 0;border-top:1px solid #eee">${i.quantity} × ${escape(i.name)}</td>` +
          `<td style="padding:6px 0;border-top:1px solid #eee;text-align:right">${escape(formatPrice(i.lineTotal))}</td></tr>`,
      )
      .join("")}
  </table>
  <table style="border-collapse:collapse;margin:0 0 24px auto">${totals.map(([k, v], n) => row(k, v, n === totals.length - 1)).join("")}</table>
  <a href="${escape(adminUrl)}" style="display:inline-block;background:#1f1f1f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px">Open order in admin</a>
</div>`;

  try {
    await sendMail({
      to,
      replyTo: customer.email,
      subject: `New order ${order.number} — ${formatPrice(order.total)} (${customer.name})`,
      text,
      html,
    });
  } catch (error) {
    // The order is already saved; a mail failure must not affect the buyer.
    console.error(`[email] New order notification failed for ${order.number}:`, error);
  }
}
