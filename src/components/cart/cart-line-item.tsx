import Image from "next/image";
import Link from "next/link";
import type { CartLine } from "@/lib/cart/get-cart";
import { setCartQuantityAction } from "@/lib/cart/actions";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart/pricing";
import { formatPrice } from "@/lib/format";

function QuantityButton({ productId, quantity, label, children, disabled }: {
  productId: string;
  quantity: number;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <form action={setCartQuantityAction}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button
        type="submit"
        aria-label={label}
        disabled={disabled}
        className="grid size-10 place-items-center text-lg disabled:text-ink-subtle"
      >
        {children}
      </button>
    </form>
  );
}

export function CartLineItem({ line }: { line: CartLine }) {
  const { product, quantity, lineTotal, issue } = line;
  const max = Math.min(product.stock, MAX_QUANTITY_PER_LINE);
  const href = `/products/${product.slug}`;

  return (
    <li className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-line py-5 sm:grid-cols-[7rem_1fr]">
      <Link href={href} className="media" tabIndex={-1} aria-hidden="true">
        <Image src={product.images[0].src} alt="" fill sizes="112px" />
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="stack gap-1">
          <p className="eyebrow">{product.category.name}</p>
          <Link href={href} className="hover:underline hover:underline-offset-4">
            {product.name}
          </Link>
          <p className="text-sm text-ink-muted tabular-nums">{formatPrice(product.price)} each</p>
          {issue === "sold-out" && (
            <p className="text-sm text-danger">Sold out — remove it to continue.</p>
          )}
          {issue === "insufficient-stock" && (
            <p className="text-sm text-warning">Only {product.stock} left — lower the quantity to continue.</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
          <div className="flex items-center rounded-control border border-line-strong">
            <QuantityButton productId={product.id} quantity={quantity - 1} label={`Decrease quantity of ${product.name}`}>
              −
            </QuantityButton>
            <span aria-label="Quantity" className="w-8 text-center tabular-nums">{quantity}</span>
            <QuantityButton
              productId={product.id}
              quantity={quantity + 1}
              label={`Increase quantity of ${product.name}`}
              disabled={quantity >= max}
            >
              +
            </QuantityButton>
          </div>
          <p className="font-medium tabular-nums">{formatPrice(lineTotal)}</p>
          <form action={setCartQuantityAction}>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value={0} />
            <button type="submit" className="link text-xs text-ink-muted">
              Remove<span className="sr-only"> {product.name}</span>
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}
