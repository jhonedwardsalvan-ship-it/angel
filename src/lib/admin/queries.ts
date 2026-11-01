import "server-only";
import { Types } from "mongoose";
import { describeOptions } from "@/lib/catalog/configure";
import { LOW_STOCK_THRESHOLD } from "@/lib/catalog/stock";
import { connectDB } from "@/lib/db/mongoose";
import { AddOn } from "@/models/add-on";
import { Category } from "@/models/category";
import type { OrderStatus } from "@/lib/orders/status";
import { Order } from "@/models/order";
import { Product, type ProductDoc } from "@/models/product";
import { StockAdjustment } from "@/models/stock-adjustment";
import type {
  AdminAddOn,
  AdminCategory,
  AdminOrder,
  AdminOrderRow,
  AdminProduct,
  AdminProductRow,
  DashboardStats,
  StockAdjustmentRow,
} from "@/types/admin";

// Admin read layer. Unlike src/lib/catalog/queries.ts this includes hidden
// records. Callers must have passed requireAdmin() first.

type Id = Types.ObjectId;
type ProductRow = Omit<ProductDoc, "category"> & {
  _id: Id;
  category: { _id: Id; name: string } | null;
};
/** Lean order document. Explicit because InferSchemaType marks required nested objects optional. */
type OrderRow = {
  _id: Id;
  number: string;
  userId?: string | null;
  customer: { name: string; email: string; phone: string };
  delivery: { recipientName: string; address: string; city: string; date: string; slot: string };
  cardMessage?: string;
  tracking?: { courier?: string; url?: string };
  payment: { method: string; status: string };
  items: { product: Id; slug: string; name: string; image?: string; unitPrice: number; quantity: number; lineTotal: number; breakdown?: { label: string; amount: number }[] }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  statusHistory: { status: string; at: Date; by?: string | null }[];
  createdAt: Date;
};

const isObjectId = (id: string) => Types.ObjectId.isValid(id) && /^[a-f0-9]{24}$/i.test(id);

function toProductRow(p: ProductRow): AdminProductRow {
  return {
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    image: p.images[0]?.src ?? "",
    category: p.category ? { id: p.category._id.toString(), name: p.category.name } : null,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    stock: p.stock,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
  };
}

export type ProductFilter = { q?: string; status?: "active" | "hidden" | "low" | "out" | "" };

export async function listProducts({ q, status }: ProductFilter = {}): Promise<AdminProductRow[]> {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (q) filter.name = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (status === "active") filter.isActive = true;
  if (status === "hidden") filter.isActive = false;
  if (status === "low") filter.stock = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
  if (status === "out") filter.stock = { $lte: 0 };

  const rows = await Product.find(filter)
    .populate({ path: "category", select: "name" })
    .sort({ name: 1, _id: 1 })
    .lean<ProductRow[]>();
  return rows.map(toProductRow);
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  if (!isObjectId(id)) return null;
  await connectDB();
  const p = await Product.findById(id).populate({ path: "category", select: "name" }).lean<ProductRow>();
  if (!p) return null;
  return {
    ...toProductRow(p),
    pricing: p.pricing === "per_piece" ? "per_piece" : "fixed",
    minPieces: p.minPieces ?? 5,
    madeToOrder: p.madeToOrder ?? false,
    addOnIds: (p.addOnIds ?? []).map(String),
    description: p.description ?? "",
    details: [...p.details],
    images: p.images.map(({ src, alt }) => ({ src, alt })),
  };
}

export async function listCategories(): Promise<AdminCategory[]> {
  await connectDB();
  const [rows, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1, _id: 1 }).lean(),
    Product.aggregate<{ _id: Id; n: number }>([{ $group: { _id: "$category", n: { $sum: 1 } } }]),
  ]);
  const countById = new Map(counts.map((c) => [c._id.toString(), c.n]));
  return rows.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    image: { src: c.image.src, alt: c.image.alt },
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    showInMenu: c.showInMenu ?? false,
    productCount: countById.get(c._id.toString()) ?? 0,
  }));
}

export async function getCategory(id: string): Promise<AdminCategory | null> {
  if (!isObjectId(id)) return null;
  return (await listCategories()).find((c) => c.id === id) ?? null;
}

function toOrderRow(o: OrderRow): AdminOrderRow {
  return {
    id: o._id.toString(),
    number: o.number,
    createdAt: o.createdAt.toISOString(),
    customerName: o.customer.name,
    customerEmail: o.customer.email,
    itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    total: o.total,
    status: o.status as OrderStatus,
    paymentMethod: o.payment.method as AdminOrderRow["paymentMethod"],
    paymentStatus: o.payment.status as AdminOrderRow["paymentStatus"],
    deliveryDate: o.delivery.date,
  };
}

export const ORDERS_PAGE_SIZE = 25;

export async function listOrders({ status, page = 1 }: { status?: OrderStatus; page?: number } = {}) {
  await connectDB();
  const filter = status ? { status } : {};
  const [rows, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * ORDERS_PAGE_SIZE)
      .limit(ORDERS_PAGE_SIZE)
      .lean<OrderRow[]>(),
    Order.countDocuments(filter),
  ]);
  return { orders: rows.map(toOrderRow), total, pages: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)) };
}

export async function getOrder(id: string): Promise<AdminOrder | null> {
  if (!isObjectId(id)) return null;
  await connectDB();
  const o = await Order.findById(id).lean<OrderRow>();
  if (!o) return null;
  return {
    ...toOrderRow(o),
    userId: o.userId ?? null,
    customerPhone: o.customer.phone,
    delivery: { ...o.delivery },
    cardMessage: o.cardMessage ?? "",
    tracking: { courier: o.tracking?.courier ?? "", url: o.tracking?.url ?? "" },
    items: o.items.map((i) => ({
      productId: i.product.toString(),
      slug: i.slug,
      name: i.name,
      image: i.image ?? "",
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
      options: describeOptions(i.breakdown ?? []),
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    statusHistory: o.statusHistory.map((h) => ({
      status: h.status as OrderStatus,
      at: h.at.toISOString(),
      by: h.by ?? null,
    })),
  };
}

export async function getRecentStockAdjustments(limit = 20, productId?: string): Promise<StockAdjustmentRow[]> {
  await connectDB();
  const filter = productId && isObjectId(productId) ? { product: productId } : {};
  const rows = await StockAdjustment.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .populate<{ product: { _id: Id; name: string } | null }>({ path: "product", select: "name" })
    .lean();
  return rows.map((r) => ({
    id: r._id.toString(),
    createdAt: (r.createdAt as Date).toISOString(),
    productId: r.product?._id.toString() ?? "",
    productName: r.product?.name ?? "Deleted product",
    delta: r.delta,
    before: r.before,
    after: r.after,
    reason: r.reason,
    note: r.note ?? "",
  }));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();
  const startOfToday = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  startOfToday.setHours(0, 0, 0, 0);
  // Convert Manila midnight back to an absolute instant.
  const manilaOffsetMs = 8 * 60 * 60 * 1000;
  const todayUtc = new Date(Date.UTC(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate()) - manilaOffsetMs);
  const since30d = new Date(Date.now() - 30 * 86_400_000);

  const [activeProducts, hiddenProducts, lowStock, soldOut, pendingOrders, ordersToday, revenue] =
    await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
      Product.countDocuments({ isActive: true, stock: { $lte: 0 } }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ createdAt: { $gte: todayUtc } }),
      Order.aggregate<{ n: number; sum: number }>([
        { $match: { createdAt: { $gte: since30d }, status: { $ne: "cancelled" } } },
        { $group: { _id: null, n: { $sum: 1 }, sum: { $sum: "$total" } } },
      ]),
    ]);

  return {
    activeProducts,
    hiddenProducts,
    lowStock,
    soldOut,
    pendingOrders,
    ordersToday,
    orders30d: revenue[0]?.n ?? 0,
    revenue30d: revenue[0]?.sum ?? 0,
  };
}

export async function listAddOns(): Promise<AdminAddOn[]> {
  await connectDB();
  const [rows, counts] = await Promise.all([
    AddOn.find().sort({ isActive: -1, name: 1, _id: 1 }).lean(),
    Product.aggregate<{ _id: Id; n: number }>([{ $unwind: "$addOnIds" }, { $group: { _id: "$addOnIds", n: { $sum: 1 } } }]),
  ]);
  const countById = new Map(counts.map((c) => [c._id.toString(), c.n]));
  return rows.map((a) => ({
    id: a._id.toString(),
    name: a.name,
    price: a.price,
    appliesTo: a.appliesTo === "all" ? "all" : "selected",
    isActive: a.isActive,
    productCount: countById.get(a._id.toString()) ?? 0,
  }));
}
