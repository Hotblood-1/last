import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setOrder(r.data));
  }, [id]);

  if (!order) return <div className="grid min-h-[50vh] place-items-center text-slate-500">Loading order…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12" data-testid="order-confirmation-page">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold text-slate-900">Order placed!</h1>
        <p className="mt-2 text-slate-500">
          Thanks for shopping with TestSeries. Your order is confirmed.
        </p>
        <div className="mt-5 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700" data-testid="order-number">
          Order #{order.order_number}
        </div>

        <div className="mt-8 grid gap-6 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Shipping to</h4>
            <div className="mt-2 text-sm text-slate-900">
              <div className="font-semibold">{order.address.full_name}</div>
              <div className="text-slate-600">{order.address.phone}</div>
              <div className="text-slate-600">
                {order.address.address_line}, {order.address.city}, {order.address.state} - {order.address.pincode}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment</h4>
            <div className="mt-2 text-sm text-slate-900">
              <div className="font-semibold uppercase">{order.payment_method}</div>
              <div className="mt-3 space-y-1 text-slate-600">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-₹{order.discount}</span></div>}
                <div className="flex justify-between"><span>Shipping</span><span>{order.shipping === 0 ? "Free" : `₹${order.shipping}`}</span></div>
                <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900"><span>Total</span><span>₹{order.total}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
          <Package className="h-4 w-4 text-blue-600" />
          Status: <span className="font-semibold capitalize text-slate-900">{order.status}</span>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/orders" data-testid="order-view-history" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-600">
            Order history
          </Link>
          <Link to="/products" data-testid="order-continue-shopping" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Continue shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
