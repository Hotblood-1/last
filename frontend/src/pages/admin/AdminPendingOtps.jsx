import { useEffect, useState } from "react";
import { Copy, RefreshCw, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AdminSidebar } from "@/pages/admin/AdminProducts";

export default function AdminPendingOtps() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/pending-otps");
      setItems(r.data);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // auto-refresh every 5s
    return () => clearInterval(t);
  }, []);

  const copy = (text, label) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success(`Copied ${label}`);
    } catch (e) {
      toast.error(`Couldn't copy. Long-press the OTP to copy manually.`);
    }
  };

  const waLink = (phone, otp) =>
    `https://wa.me/91${phone}?text=${encodeURIComponent(`Your TestSeries OTP is ${otp}. Valid for 10 minutes.`)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" data-testid="admin-pending-otps-page">
      <div className="flex flex-col gap-6 lg:flex-row">
        <AdminSidebar />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Phone className="h-7 w-7 text-blue-600" /> Pending OTPs
              </h1>
              <p className="mt-1 text-sm text-slate-500">Live queue · auto-refreshes every 5s. Send OTPs to customers via WhatsApp.</p>
            </div>
            <button onClick={load} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-600">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {loading && items.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">Loading…</div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
                No pending OTPs right now. They'll appear here the moment a customer requests one.
              </div>
            ) : items.map((o) => (
              <div key={o.phone} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</div>
                    <div className="mt-1 font-display text-xl font-bold text-slate-900">+91 {o.phone}</div>
                    <div className="mt-1 text-xs text-slate-500">Requested: {new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">OTP</div>
                    <div className="mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-blue-700">{o.otp}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => copy(o.otp, "OTP")} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-600">
                      <Copy className="h-3.5 w-3.5" /> Copy OTP
                    </button>
                    <button onClick={() => copy(`Your TestSeries OTP is ${o.otp}. Valid for 10 minutes.`, "message")} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-600">
                      <Copy className="h-3.5 w-3.5" /> Copy message
                    </button>
                    <a href={waLink(o.phone, o.otp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                      <MessageCircle className="h-3.5 w-3.5" /> Send via WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
