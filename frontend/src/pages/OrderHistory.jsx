import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { api } from "@/lib/api";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-violet-100 text-violet-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/mine").then((r) => setOrders(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8" data-testid="orders-page">
      <h1 className="font-display text-3xl font-bold text-slate-900">My Orders</h1>

      {loading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          You haven&apos;t placed any orders yet.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-slate-900">#{o.order_number}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[o.status] || "bg-slate-100 text-slate-700"}`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{new Date(o.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold text-slate-900">₹{o.total}</div>
                  <div className="text-xs text-slate-500 uppercase">{o.payment_method}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {o.items.map((i) => (
                  <div key={i.product_id} className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                    <img src={i.image_url} alt={i.name} className="h-6 w-6 rounded-full object-cover" />
                    <span className="line-clamp-1 max-w-[180px]">{i.name}</span>
                    <span className="font-semibold">×{i.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
