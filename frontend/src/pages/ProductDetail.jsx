import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Minus, Plus, Truck, Shield, RefreshCw, ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((r) => setProduct(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  const [imgIdx, setImgIdx] = useState(0);
  const images = product?.images?.length ? product.images : (product?.image_url ? [product.image_url] : []);
  useEffect(() => { setImgIdx(0); }, [product?.id]);

  if (loading) return <div className="grid min-h-[60vh] place-items-center text-slate-500">Loading…</div>;
  if (!product) return <div className="grid min-h-[60vh] place-items-center text-slate-500">Product not found</div>;

  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" data-testid="product-detail-page">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-700">
        <ChevronLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {images.length > 0 ? (
            <div className="relative">
              <img src={images[imgIdx]} alt={product.name} className="aspect-square w-full object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx((imgIdx - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-lg hover:bg-white"><ChevronLeft className="h-5 w-5"/></button>
                  <button onClick={() => setImgIdx((imgIdx + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-lg hover:bg-white"><ChevronLeft className="h-5 w-5 rotate-180"/></button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => <button key={i} onClick={() => setImgIdx(i)} className={`h-2 rounded-full transition-all ${i===imgIdx?"w-6 bg-blue-600":"w-2 bg-white/80"}`}/>)}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid aspect-square place-items-center text-slate-300">No image</div>
          )}
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 ${i===imgIdx?"border-blue-600":"border-slate-200"}`}>
                  <img src={img} alt="" className="h-full w-full object-cover"/>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">{product.category}</div>
          <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">{product.name}</h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-slate-900">₹{product.price}</span>
            {product.mrp && product.mrp > product.price && (
              <>
                <span className="text-lg text-slate-400 line-through">₹{product.mrp}</span>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">{discount}% OFF</span>
              </>
            )}
          </div>

          <p className="mt-6 text-slate-600">{product.description}</p>

          {product.stock <= 5 && product.stock > 0 && (
            <div className="mt-4 rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
              Hurry — only {product.stock} left in stock
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-slate-200 bg-white">
              <button
                data-testid="pdp-qty-dec"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="rounded-l-full p-3 hover:bg-slate-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold" data-testid="pdp-qty-value">{qty}</span>
              <button
                data-testid="pdp-qty-inc"
                onClick={() => setQty((q) => q + 1)}
                className="rounded-r-full p-3 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              data-testid="pdp-add-to-cart"
              disabled={product.stock === 0}
              onClick={() => {
                addItem(product, qty);
                toast.success(`Added ${qty} to cart`);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:bg-slate-300"
            >
              <ShoppingCart className="h-4 w-4" /> {product.stock === 0 ? "Out of stock" : "Add to cart"}
            </button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Truck, label: "Fast shipping" },
              { icon: Shield, label: "Secure payment" },
              { icon: RefreshCw, label: "Easy returns" },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <t.icon className="h-4 w-4 text-blue-600" /> {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
