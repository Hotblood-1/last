import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Copy, CheckCircle2, XCircle, Search } from "lucide-react";
import { api, formatError } from "@/lib/api";
import { AdminSidebar } from "@/pages/admin/AdminProducts";

export default function AdminCodes() {
  const [codes, setCodes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [oneTime, setOneTime] = useState(true);
  const [discountsByPid, setDiscountsByPid] = useState({}); // { product_id: amount }
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        api.get("/admin/codes"),
        api.get("/admin/products"),
      ]);
      setCodes(c.data);
      setProducts(p.data);
      // Pre-fill discount inputs from each product's saved default_discount
      const initial = {};
      p.data.forEach((prod) => {
        if (prod.default_discount && prod.default_discount > 0) {
          initial[prod.id] = prod.default_discount;
        }
      });
      setDiscountsByPid(initial);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const productsById = useMemo(() => {
    const m = {};
    products.forEach((p) => { m[p.id] = p; });
    return m;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, search]);

  const setDiscount = (pid, value) => {
    setDiscountsByPid((prev) => {
      const next = { ...prev };
      const n = Number(value);
      if (!value || n <= 0) delete next[pid];
      else next[pid] = n;
      return next;
    });
  };

  // Auto-save default_discount on blur
  const saveDefaultDiscount = async (pid, value) => {
    const n = Number(value) || 0;
    try {
      await api.patch(`/admin/products/${pid}`, { default_discount: n });
      setProducts((prev) => prev.map((p) => p.id === pid ? { ...p, default_discount: n } : p));
    } catch (e) {
      toast.error(formatError(e));
    }
  };

  // Auto-save price on blur
  const savePrice = async (pid, value) => {
    const n = Number(value);
    if (!n || n <= 0) return toast.error("Price must be positive");
    try {
      await api.patch(`/admin/products/${pid}`, { price: n });
      setProducts((prev) => prev.map((p) => p.id === pid ? { ...p, price: n } : p));
      toast.success("Price updated");
    } catch (e) {
      toast.error(formatError(e));
    }
  };

  const totalCovered = Object.keys(discountsByPid).length;

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const r = await api.post("/admin/codes", {
        one_time: oneTime,
        product_discounts: discountsByPid,
      });
      toast.success(`Code generated: ${r.data.code}${totalCovered === 0 ? " (₹0 off — access only)" : ""}`);
      load();
    } catch (e) {
      toast.error(formatError(e));
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id, codeStr) => {
    try {
      await api.delete(`/admin/codes/${id}`);
      toast.success(`Deleted ${codeStr}`);
      load();
    } catch (e) {
      toast.error(formatError(e));
    }
  };

  const removeAllUsed = async () => {
    const used = codes.filter((c) => c.used);
    if (used.length === 0) return toast.info("No used codes to clear");
    try {
      await Promise.all(used.map((c) => api.delete(`/admin/codes/${c.id}`)));
      toast.success(`Cleared ${used.length} used code(s)`);
      load();
    } catch (e) {
      toast.error(formatError(e));
    }
  };

  const copy = (c) => {
    navigator.clipboard.writeText(c);
    toast.success(`Copied: ${c}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" data-testid="admin-codes-page">
      <div className="flex flex-col gap-6 lg:flex-row">
        <AdminSidebar />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-slate-900">Discount Codes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate a 12-character access code (XXXX-XXXX-XXXX) and assign a different ₹ off per product.
          </p>

          {/* CREATE CODE */}
          <form onSubmit={create} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">Generate new code</h3>
                <p className="text-xs text-slate-500">Discounts &amp; prices auto-save as you type — reused next time. Click <b>Generate code</b> to lock the current values into a new XXXX-XXXX-XXXX code.</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={oneTime}
                    onChange={(e) => setOneTime(e.target.checked)}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  One-time use
                </label>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {totalCovered} product{totalCovered === 1 ? "" : "s"} covered
                </div>
              </div>
            </div>

            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="mt-4 max-h-96 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 w-32">Price (₹)</th>
                    <th className="px-3 py-2 w-40">₹ Off (per line)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-400">No products</td></tr>
                  ) : filteredProducts.map((p) => (
                    <tr key={p.id} className={discountsByPid[p.id] ? "bg-blue-50/40" : "hover:bg-slate-50"}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {p.image_url && <img src={p.image_url} alt="" className="h-8 w-8 rounded-md object-cover" />}
                          <div>
                            <div className="line-clamp-1 text-sm font-medium text-slate-900">{p.name}</div>
                            <div className="text-[11px] text-slate-500">{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">₹</span>
                          <input
                            data-testid={`code-price-${p.id}`}
                            type="number"
                            min="1"
                            defaultValue={p.price}
                            key={`price-${p.id}-${p.price}`}
                            onBlur={(e) => {
                              if (Number(e.target.value) !== p.price) savePrice(p.id, e.target.value);
                            }}
                            className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">₹</span>
                          <input
                            data-testid={`code-pd-${p.id}`}
                            type="number"
                            min="0"
                            max={p.price}
                            value={discountsByPid[p.id] || ""}
                            onChange={(e) => setDiscount(p.id, e.target.value)}
                            onBlur={(e) => saveDefaultDiscount(p.id, e.target.value)}
                            placeholder="0"
                            className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                data-testid="admin-code-create"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
              >
                <Plus className="h-4 w-4" /> {creating ? "Generating…" : "Generate code"}
              </button>
            </div>
          </form>

          {/* CODES LIST */}
          <div className="mt-8 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900">
              All codes <span className="text-sm font-normal text-slate-500">({codes.length})</span>
            </h2>
            {codes.some((c) => c.used) && (
              <button
                onClick={removeAllUsed}
                data-testid="admin-clear-used-codes"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-700 active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear all used codes
              </button>
            )}
          </div>
          <div className="mt-3 space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">Loading…</div>
            ) : codes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">No codes yet</div>
            ) : codes.map((c) => {
              const entries = Object.entries(c.product_discounts || {});
              return (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-sm font-bold text-white">
                        {c.code}
                      </span>
                      <button onClick={() => copy(c.code)} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100" title="Copy">
                        <Copy className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-slate-500">{c.one_time ? "One-time" : "Reusable"}</span>
                      {c.used ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                          <XCircle className="h-3 w-3" /> Used
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => remove(c.id, c.code)}
                      data-testid={`admin-code-delete-${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entries.length === 0 ? (
                      <span className="text-xs text-slate-400">No products covered</span>
                    ) : entries.map(([pid, amt]) => {
                      const p = productsById[pid];
                      return (
                        <div key={pid} className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs text-blue-800">
                          {p?.image_url && <img src={p.image_url} alt="" className="h-5 w-5 rounded-full object-cover" />}
                          <span className="line-clamp-1 max-w-[200px] font-medium">{p?.name || pid}</span>
                          <span className="rounded-full bg-blue-700 px-2 py-0.5 font-bold text-white">−₹{amt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
