import { Link } from "react-router-dom";
import { ShoppingCart, Sparkles, Flame } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const tags = product.tags || [];

  return (
    <div
      className="product-card group flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white"
      data-testid={`product-card-${product.id}`}
    >
      <Link to={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-slate-50">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-300">No image</div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {discount > 0 && (
            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">
              {discount}% OFF
            </span>
          )}
          {tags.includes("best-seller") && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              <Flame className="h-3 w-3" /> Best
            </span>
          )}
          {tags.includes("new") && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              <Sparkles className="h-3 w-3" /> New
            </span>
          )}
        </div>

        {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700">
            Only {product.stock} left
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
          {product.category}
        </div>
        <Link to={`/products/${product.id}`} className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-blue-700">
          {product.name}
        </Link>

        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold text-slate-900">₹{product.price}</span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
              )}
            </div>
          </div>
          <button
            data-testid={`add-to-cart-${product.id}`}
            onClick={(e) => {
              e.preventDefault();
              if (product.stock === 0) {
                toast.error("Out of stock");
                return;
              }
              addItem(product);
              toast.success("Added to cart");
            }}
            disabled={product.stock === 0}
            className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
