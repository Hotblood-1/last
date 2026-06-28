import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const CATEGORIES = ["All", "Stationery", "Tablet", "Geometry", "Bottle"];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const initialCat = params.get("category") || "All";
  const initialSearch = params.get("search") || "";

  const [category, setCategory] = useState(initialCat);
  const [search, setSearch] = useState(initialSearch);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = {};
    if (category && category !== "All") query.category = category;
    if (search) query.search = search;
    api
      .get("/products", { params: query })
      .then((r) => setProducts(r.data))
      .finally(() => setLoading(false));

    const newParams = {};
    if (category && category !== "All") newParams.category = category;
    if (search) newParams.search = search;
    setParams(newParams, { replace: true });
  }, [category, search]); // eslint-disable-line

  const count = products.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" data-testid="products-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Shop</h1>
          <p className="mt-1 text-sm text-slate-500">{count} products</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            data-testid="products-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            data-testid={`filter-cat-${c.toLowerCase()}`}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              category === c
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:border-blue-600 hover:text-blue-700"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No products found.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
