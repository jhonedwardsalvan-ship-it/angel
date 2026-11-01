"use server";

import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { writeCart } from "@/lib/cart/cart-cookie";
import { getCart } from "@/lib/cart/get-cart";
import { connectDB } from "@/lib/db/mongoose";
import { sendNewOrderEmail } from "@/lib/email/new-order";
import { releaseStock, reserveStock } from "@/lib/inventory";
import { allowTrackedOrder } from "@/lib/orders/tracking";
import { getSession } from "@/lib/session";
import { getStoreSettings } from "@/lib/settings";
import { Order } from "@/models/order";
import { DELIVERY_SLOTS, MAX_DELIVERY_DAYS_AHEAD, storeDate } from "./delivery";
import { writeLastOrder, type DeliverySlot } from "./last-order";

export type CheckoutField =
  | "email" | "name" | "phone" | "recipientName" | "address" | "city"
  | "deliveryDate" | "deliverySlot" | "cardMessage" | "agreeTerms";

export type CheckoutState =
  | {
      error?: string;
      fieldErrors?: Partial<Record<CheckoutField, string>>;
      values?: Partial<Record<CheckoutField, string>>;
    }
  | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][\d\s()-]{6,19}$/;

function orderNumber() {
  return `AL-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

function isDuplicateKey(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

/**
 * Validates the form and the live cart, takes stock, saves the order and
 * empties the cart. No payment is taken on the site: the team contacts the
 * buyer to arrange it, and preparation starts once an admin marks it paid.
 */
export async function placeOrderAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const fields = [
    "email", "name", "phone", "recipientName", "address", "city",
    "deliveryDate", "deliverySlot", "cardMessage", "agreeTerms",
  ] as const;
  const values = Object.fromEntries(
    fields.map((f) => [f, String(formData.get(f) ?? "").trim()]),
  ) as Record<CheckoutField, string>;

  const fieldErrors: Partial<Record<CheckoutField, string>> = {};
  if (!EMAIL_PATTERN.test(values.email)) fieldErrors.email = "Enter a valid email address.";
  if (!values.name) fieldErrors.name = "Enter your name.";
  if (!PHONE_PATTERN.test(values.phone)) fieldErrors.phone = "Enter a valid phone number.";
  if (!values.recipientName) fieldErrors.recipientName = "Who is receiving the flowers?";
  if (values.address.length < 8) fieldErrors.address = "Enter the full delivery address.";
  if (!values.city) fieldErrors.city = "Enter the city.";
  // No rush orders: the earliest date is today + the lead time set in Admin → Settings.
  const { leadDays } = await getStoreSettings();
  const earliest = storeDate(leadDays);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.deliveryDate) || values.deliveryDate > storeDate(MAX_DELIVERY_DAYS_AHEAD)) {
    fieldErrors.deliveryDate = `Choose a date up to ${MAX_DELIVERY_DAYS_AHEAD} days from now.`;
  } else if (values.deliveryDate < earliest) {
    fieldErrors.deliveryDate = `Orders must be booked at least ${leadDays} days ahead. Choose ${earliest} or later.`;
  }
  if (!(values.deliverySlot in DELIVERY_SLOTS)) fieldErrors.deliverySlot = "Choose a delivery time.";
  if (values.cardMessage.length > 200) fieldErrors.cardMessage = "Keep the message under 200 characters.";
  if (values.agreeTerms !== "on") fieldErrors.agreeTerms = "Please agree to the terms to place your order.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  // Re-check the cart against live prices and stock right before ordering.
  const cart = await getCart();
  if (cart.lines.length === 0) redirect("/cart");
  if (cart.hasIssues) {
    return {
      error: "Some items in your cart changed availability. Review your cart before ordering.",
      values,
    };
  }

  const lines = cart.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity }));
  const orderId = new Types.ObjectId();
  await connectDB();

  // Take stock atomically per line; another checkout may have just bought the last one.
  const reserved = await reserveStock(lines, orderId);
  if (!reserved.ok) {
    return {
      error: "Sorry, one of your items just sold out. Review your cart before ordering.",
      values,
    };
  }

  const session = await getSession();
  let number = orderNumber();
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        await Order.create({
          _id: orderId,
          number,
          userId: session?.user.id ?? null,
          customer: { name: values.name, email: values.email, phone: values.phone },
          delivery: {
            recipientName: values.recipientName,
            address: values.address,
            city: values.city,
            date: values.deliveryDate,
            slot: values.deliverySlot as DeliverySlot,
          },
          cardMessage: values.cardMessage,
          payment: { method: "arranged", status: "unpaid" },
          items: cart.lines.map((l) => ({
            product: l.product.id,
            slug: l.product.slug,
            name: l.product.name,
            image: l.product.images[0]?.src ?? "",
            unitPrice: l.product.price,
            quantity: l.quantity,
            lineTotal: l.lineTotal,
          })),
          subtotal: cart.subtotal,
          deliveryFee: cart.deliveryFee,
          total: cart.total,
          status: "pending",
          statusHistory: [{ status: "pending", at: new Date(), by: null }],
        });
        break;
      } catch (error) {
        // Order numbers are random-suffixed; retry the rare collision.
        if (isDuplicateKey(error) && attempt < 3) {
          number = orderNumber();
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    await releaseStock(lines, orderId);
    throw error;
  }

  // Notify the shop owner once the buyer has been redirected; never blocks or fails checkout.
  const notification = {
    id: orderId.toString(),
    number,
    customer: { name: values.name, email: values.email, phone: values.phone },
    delivery: {
      recipientName: values.recipientName,
      address: values.address,
      city: values.city,
      date: values.deliveryDate,
      slot: values.deliverySlot as DeliverySlot,
    },
    cardMessage: values.cardMessage,
    items: cart.lines.map((l) => ({ name: l.product.name, quantity: l.quantity, lineTotal: l.lineTotal })),
    subtotal: cart.subtotal,
    deliveryFee: cart.deliveryFee,
    total: cart.total,
  };
  after(() => sendNewOrderEmail(notification));

  await writeLastOrder({
    number,
    placedAt: new Date().toISOString(),
    name: values.name,
    email: values.email,
    recipientName: values.recipientName,
    address: values.address,
    city: values.city,
    deliveryDate: values.deliveryDate,
    deliverySlot: values.deliverySlot as DeliverySlot,
    phone: values.phone,
    items: cart.lines.map((l) => ({
      name: l.product.name.slice(0, 80),
      quantity: l.quantity,
      lineTotal: l.lineTotal,
    })),
    subtotal: cart.subtotal,
    deliveryFee: cart.deliveryFee,
    total: cart.total,
  });
  await allowTrackedOrder(number);
  await writeCart([]);
  redirect("/checkout/confirmation");
}
