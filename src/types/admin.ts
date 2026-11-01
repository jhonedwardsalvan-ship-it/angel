import type { PaymentMethod } from "@/lib/checkout/last-order";
import type { OrderStatus } from "@/lib/orders/status";
import type { CatalogImage } from "@/types/catalog";

export type AdminFormState =
  | {
      error?: string;
      notice?: string;
      fieldErrors?: Record<string, string>;
      values?: Record<string, string>;
    }
  | undefined;

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  image: string;
  category: { id: string; name: string } | null;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
};

export type AdminProduct = AdminProductRow & {
  pricing: "fixed" | "per_piece";
  minPieces: number;
  madeToOrder: boolean;
  /** Shared add-ons ticked for this product. */
  addOnIds: string[];
  /** Shared flower/wrapper colors ticked for this product. */
  colorIds: string[];
  description: string;
  details: string[];
  images: CatalogImage[];
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: CatalogImage;
  sortOrder: number;
  isActive: boolean;
  showInMenu: boolean;
  productCount: number;
};

export type AdminOrderRow = {
  id: string;
  number: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: "unpaid" | "demo" | "paid";
  deliveryDate: string;
};

export type AdminOrder = AdminOrderRow & {
  userId: string | null;
  customerPhone: string;
  delivery: { recipientName: string; address: string; city: string; date: string; slot: string };
  cardMessage: string;
  tracking: { courier: string; url: string };
  items: {
    productId: string;
    slug: string;
    name: string;
    image: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    /** e.g. ["20 flowers", "Glitter on 10 flowers"]. */
    options: string[];
  }[];
  subtotal: number;
  deliveryFee: number;
  statusHistory: { status: OrderStatus; at: string; by: string | null }[];
};

export type StockAdjustmentRow = {
  id: string;
  createdAt: string;
  productId: string;
  productName: string;
  delta: number;
  before: number;
  after: number;
  reason: string;
  note: string;
};

export type DashboardStats = {
  activeProducts: number;
  hiddenProducts: number;
  lowStock: number;
  soldOut: number;
  pendingOrders: number;
  ordersToday: number;
  orders30d: number;
  revenue30d: number;
};

export type AdminAddOn = {
  id: string;
  name: string;
  price: number;
  appliesTo: "all" | "selected";
  isActive: boolean;
  /** Products that ticked it (only matters for "selected"). */
  productCount: number;
};

export type AdminColor = {
  id: string;
  name: string;
  hex: string;
  forFlowers: boolean;
  forWrappers: boolean;
  appliesTo: "all" | "selected";
  isActive: boolean;
  productCount: number;
};
