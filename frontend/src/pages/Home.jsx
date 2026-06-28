import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, Lock, GraduationCap, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative overflow-hidden bg-grid">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-white" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <Sparkles className="h-3.5 w-3.5" /> New Arrivals · Made for Indian Students
              </span>
              <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Stationery that studies <span className="text-blue-600">harder</span> with you.
              </h1>
              <p className="mt-6 max-w-xl text-base text-slate-600 sm:text-lg">
                Pens, geometry boxes, LCD writing tablets, water bottles and books — picked for
                Indian students and priced like it.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  data-testid="hero-shop-now-btn"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95"
                >
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/products?category=Tablet"
                  data-testid="hero-lcd-tablets-btn"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-all hover:border-blue-600 hover:text-blue-700 active:scale-95"
                >
                  LCD Tablets
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4">
                {[
                  { icon: Truck, label: "Fast Shipping", desc: "Pan-India" },
                  { icon: Lock, label: "Secure Payments", desc: "100% safe" },
                  { icon: GraduationCap, label: "Student Discounts", desc: "Always on" },
                ].map((t) => (
                  <div key={t.label} className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 backdrop-blur">
                    <t.icon className="h-5 w-5 text-blue-600" />
                    <div className="mt-2 text-sm font-semibold text-slate-900">{t.label}</div>
                    <div className="text-xs text-slate-500">{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-fade-up [animation-delay:120ms]">
              <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-blue-100 to-blue-50 blur-2xl" />
              <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-xl">
                <img
                  src="https://images.pexels.com/photos/8472969/pexels-photo-8472969.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                  alt="Student studying"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES STRIP */}
      <section className="border-y border-slate-200/70 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8 no-scrollbar">
          {["All", "Stationery", "Tablet", "Geometry", "Bottle"].map((c) => (
            <Link
              key={c}
              to={c === "All" ? "/products" : `/products?category=${c}`}
              data-testid={`home-cat-${c.toLowerCase()}`}
              className="flex-shrink-0 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* POPULAR PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
              Popular Products
            </h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Loved by students. Priced fair. Built to last.
            </p>
          </div>
          <Link
            to="/products"
            className="hidden items-center gap-1 text-sm font-semibold text-blue-700 hover:underline sm:inline-flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* PROMO BAND */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-blue-600 px-8 py-12 text-white sm:px-12 lg:px-16">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
                Got your access code? <span className="rounded-lg bg-white/15 px-2 py-0.5">XXXX-XXXX-XXXX</span>
              </h3>
              <p className="mt-3 text-blue-100">Every order requires an exclusive 12-character access code. Apply it at checkout to unlock your purchase &amp; instant savings.</p>
            </div>
            <div className="lg:justify-self-end">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-blue-700 transition-all hover:bg-blue-50 active:scale-95"
              >
                Start shopping <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
