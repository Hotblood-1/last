import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, User, Menu, X, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { count } = useCart();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/products?search=${encodeURIComponent(q.trim())}`);
  };

  const links = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Shop" },
    { to: "/products?category=Tablet", label: "LCD Tablets" },
    { to: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white font-display font-bold">T</div>
          <span className="font-display text-xl font-bold tracking-tight">TestSeries</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
              end={l.to === "/"}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submit} className="hidden flex-1 max-w-sm md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              data-testid="nav-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notebooks, tablets…"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            data-testid="nav-cart-btn"
            className="relative rounded-full p-2 text-slate-700 transition-colors hover:bg-slate-100"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span
                data-testid="nav-cart-count"
                className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white"
              >
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              {user.role === "admin" ? (
                <Link
                  to="/admin/products"
                  data-testid="nav-admin-btn"
                  className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              ) : (
                <Link
                  to="/account"
                  data-testid="nav-account-btn"
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700"
                >
                  <User className="h-4 w-4" /> {user.name?.split(" ")[0] || "Account"}
                </Link>
              )}
              <button
                onClick={logout}
                data-testid="nav-logout-btn"
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              data-testid="nav-login-btn"
              className="hidden rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 md:inline-block"
            >
              Sign in
            </Link>
          )}

          <button
            onClick={() => setOpen(!open)}
            data-testid="nav-mobile-toggle"
            className="rounded-full p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <form onSubmit={submit} className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:outline-none"
              />
            </div>
          </form>
          <div className="flex flex-col gap-1 p-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              user.role === "admin" ? (
                <Link to="/admin/products" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-blue-700">
                  Admin Dashboard
                </Link>
              ) : (
                <Link to="/account" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-blue-700">
                  My Account
                </Link>
              )
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-blue-700">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
