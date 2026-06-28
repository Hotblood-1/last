import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function Cart() {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const nav = useNavigate();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center" data-testid="cart-empty">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50">
          <ShoppingBag className="h-7 w-7 text-blue-700" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">Looks like you haven&apos;t added anything yet.</p>
        <Link
          to="/products"
          data-testid="cart-empty-shop-btn"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Continue shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= 499 ? 0 : 49;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" data-testid="cart-page">
      <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Your Cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((i) => (
            <div
              key={i.product_id}
              data-testid={`cart-item-${i.product_id}`}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <img src={i.image_url} alt={i.name} className="h-24 w-24 rounded-xl object-cover" />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link to={`/products/${i.product_id}`} className="font-semibold text-slate-900 hover:text-blue-700">
                    {i.name}
                  </Link>
                  <div className="mt-1 text-sm text-slate-500">₹{i.price} each</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-slate-200">
                    <button data-testid={`cart-dec-${i.product_id}`} onClick={() => updateQty(i.product_id, i.quantity - 1)} className="p-2 hover:bg-slate-50 rounded-l-full">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                    <button data-testid={`cart-inc-${i.product_id}`} onClick={() => updateQty(i.product_id, i.quantity + 1)} className="p-2 hover:bg-slate-50 rounded-r-full">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-slate-900">₹{i.price * i.quantity}</span>
                    <button
                      data-testid={`cart-remove-${i.product_id}`}
                      onClick={() => removeItem(i.product_id)}
                      className="rounded-full p-2 text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-lg font-bold text-slate-900">Order summary</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span data-testid="cart-subtotal">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between font-display text-lg font-bold text-slate-900">
              <span>Total</span>
              <span data-testid="cart-total">₹{total}</span>
            </div>
          </div>
          <button
            data-testid="cart-checkout-btn"
            onClick={() => nav("/checkout")}
            className="mt-6 w-full rounded-full bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
          >
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
}
