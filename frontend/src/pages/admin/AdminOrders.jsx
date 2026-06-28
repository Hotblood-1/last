import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, formatError } from "@/lib/api";
import { AdminSidebar } from "@/pages/admin/AdminProducts";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/orders");
      setOrders(r.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}`, { status });
      toast.success("Status updated");
      load();
    } catch (e) {
      toast.error(formatError(e));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" data-testid="admin-orders-page">
      <div className="flex flex-col gap-6 lg:flex-row">
        <AdminSidebar />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-slate-900">Orders</h1>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">Loading…</div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">No orders yet</div>
            ) : (
              orders.map((o) => (
                <div key={o.id} data-testid={`admin-order-${o.id}`} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">#{o.order_number}</div>
                      <div className="text-xs text-slate-500">{new Date(o.created_at).toLocaleString()}</div>
                      <div className="mt-2 text-sm">
                        <span className="font-semibold">{o.address.full_name}</span> · {o.address.phone}
                        <div className="text-xs text-slate-500">{o.address.address_line}, {o.address.city}, {o.address.state} - {o.address.pincode}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-bold text-slate-900">₹{o.total}</div>
                      <div className="text-xs text-slate-500 uppercase">{o.payment_method}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {o.items.map((i) => (
                      <div key={i.product_id} className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs">
                        <img src={i.image_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                        <span className="line-clamp-1 max-w-[180px]">{i.name}</span>
                        <span className="font-semibold">×{i.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-slate-500">Status</span>
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        data-testid={`admin-order-status-${o.id}-${s}`}
                        onClick={() => updateStatus(o.id, s)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                          o.status === s
                            ? "bg-blue-600 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-700"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
