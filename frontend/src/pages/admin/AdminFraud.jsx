import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { AdminSidebar } from "@/pages/admin/AdminProducts";

const LABEL = {
  price_tampering: { color: "bg-rose-100 text-rose-700", label: "Price tampering" },
  invalid_code: { color: "bg-amber-100 text-amber-700", label: "Invalid code" },
  reused_code: { color: "bg-amber-100 text-amber-700", label: "Reused code" },
  missing_code: { color: "bg-slate-100 text-slate-700", label: "Missing code" },
  stock_exceeded: { color: "bg-orange-100 text-orange-700", label: "Stock exceeded" },
  bad_quantity: { color: "bg-orange-100 text-orange-700", label: "Bad quantity" },
  unavailable_product: { color: "bg-slate-100 text-slate-700", label: "Unavailable product" },
  bad_payment_method: { color: "bg-rose-100 text-rose-700", label: "Bad payment method" },
};

export default function AdminFraud() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/fraud-logs");
      setLogs(r.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" data-testid="admin-fraud-page">
      <div className="flex flex-col gap-6 lg:flex-row">
        <AdminSidebar />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-7 w-7 text-rose-600" /> Fraud Log
              </h1>
              <p className="mt-1 text-sm text-slate-500">Suspicious activity intercepted before any money moved.</p>
            </div>
            <button onClick={load} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-700">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="px-4 py-12 text-center text-slate-400">Loading…</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="4" className="px-4 py-12 text-center text-slate-400">No suspicious activity. All clean. ✓</td></tr>
                ) : logs.map((l) => {
                  const meta = LABEL[l.kind] || { color: "bg-slate-100 text-slate-700", label: l.kind };
                  return (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {l.user?.name || "—"}<br />
                        <span className="text-slate-500">{l.user?.phone || l.user?.email || l.user_id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <pre className="text-[11px] text-slate-600 whitespace-pre-wrap break-all">{JSON.stringify(l.detail, null, 0)}</pre>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
