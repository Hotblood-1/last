import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit2, Trash2, Eye, EyeOff, Package, Tag, ShoppingBag, ShieldAlert, Phone } from "lucide-react";
import { toast } from "sonner";
import { api, formatError } from "@/lib/api";

const empty = { name: "", category: "Stationery", price: 0, mrp: 0, description: "", image_url: "", stock: 50, tags: [] };

function AdminSidebar() {
  const links = [
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { to: "/admin/codes", label: "Discount Codes", icon: Tag },
    { to: "/admin/pending-otps", label: "Pending OTPs", icon: Phone },
    { to: "/admin/fraud", label: "Fraud Log", icon: ShieldAlert },
  ];
  return (
    <aside className="w-full lg:w-60 lg:shrink-0">
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">Admin</div>
        <nav className="space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={`admin-nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | product
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/products");
      setItems(r.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setModal("new"); };
  const openEdit = (p) => { setForm({ ...p, mrp: p.mrp || 0, tags: p.tags || [] }); setModal(p); };

  const save = async () => {
    try {
      const payload = { ...form, mrp: form.mrp || null };
      if (modal === "new") {
        await api.post("/admin/products", payload);
        toast.success("Product created");
      } else {
        await api.patch(`/admin/products/${modal.id}`, payload);
        toast.success("Product updated");
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(formatError(e));
    }
  };

  const remove = async (p) => {
    try {
      await api.delete(`/admin/products/${p.id}`);
      toast.success(`Deleted "${p.name}"`);
      load();
    } catch (e) {
      toast.error(formatError(e));
    }
  };

  const toggleHide = async (p) => {
    try {
      await api.patch(`/admin/products/${p.id}`, { hidden: !p.hidden });
      load();
    } catch (e) {
      toast.error(formatError(e));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" data-testid="admin-products-page">
      <div className="flex flex-col gap-6 lg:flex-row">
        <AdminSidebar />

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-bold text-slate-900">Products</h1>
            <button
              onClick={openNew}
              data-testid="admin-new-product"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Add product
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-400">Loading…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-400">No products</td></tr>
                ) : (
                  items.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                          <div className="line-clamp-1 font-medium text-slate-900">{p.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.category}</td>
                      <td className="px-4 py-3 font-semibold">₹{p.price}</td>
                      <td className="px-4 py-3">
                        <span className={p.stock <= 5 ? "text-rose-600 font-semibold" : "text-slate-700"}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.hidden ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>
                          {p.hidden ? "Hidden" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => toggleHide(p)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" title={p.hidden ? "Show" : "Hide"}>
                            {p.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button onClick={() => openEdit(p)} data-testid={`admin-edit-${p.id}`} className="rounded-full p-2 text-blue-700 hover:bg-blue-50">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => remove(p)} data-testid={`admin-delete-${p.id}`} className="rounded-full p-2 text-rose-500 hover:bg-rose-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="font-display text-xl font-bold text-slate-900">
              {modal === "new" ? "New product" : "Edit product"}
            </h2>
            {modal !== "new" && (
              <div className="mt-4">
                <label className="text-xs font-semibold text-slate-700">Product images ({(modal.images||[]).length}/8)</label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {(modal.images || []).map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={async () => {
                        try {
                          const r = await api.delete(`/admin/products/${modal.id}/images/${idx}`);
                          setModal({...modal, images: r.data.images});
                          toast.success("Image removed");
                          load();
                        } catch(e) { toast.error(formatError(e)); }
                      }} className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 hover:bg-rose-700">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {(modal.images || []).length < 8 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 grid place-items-center cursor-pointer hover:border-blue-600 text-slate-400 hover:text-blue-600">
                      <Plus className="h-6 w-6" />
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const fd = new FormData();
                        fd.append("file", f);
                        try {
                          const r = await api.post(`/admin/products/${modal.id}/images`, fd, { headers: {"Content-Type": "multipart/form-data"} });
                          setModal({...modal, images: r.data.images});
                          toast.success("Image uploaded");
                          load();
                        } catch(err) { toast.error(formatError(err)); }
                        e.target.value = "";
                      }} />
                    </label>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">JPG/PNG/WEBP · max 5MB · first image = main thumbnail</p>
              </div>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["name", "Name", "text", 2],
                ["category", "Category", "text", 1],
                ["price", "Price (₹)", "number", 1],
                ["mrp", "MRP (₹)", "number", 1],
                ["stock", "Stock", "number", 1],
                ["image_url", "Image URL", "text", 2],
                ["description", "Description", "text", 2],
              ].map(([k, label, type, span]) => (
                <div key={k} className={span === 2 ? "sm:col-span-2" : ""}>
                  <label className="text-xs font-semibold text-slate-700">{label}</label>
                  <input
                    data-testid={`admin-form-${k}`}
                    type={type}
                    value={form[k] ?? ""}
                    onChange={(e) => setForm({ ...form, [k]: type === "number" ? Number(e.target.value) : e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="rounded-full px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={save} data-testid="admin-form-save" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { AdminSidebar };
