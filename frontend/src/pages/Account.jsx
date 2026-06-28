import { Link } from "react-router-dom";
import { User, Package, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Account() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12" data-testid="account-page">
      <h1 className="font-display text-3xl font-bold text-slate-900">My Account</h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-blue-100 text-blue-700">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-lg font-bold text-slate-900">{user?.name}</div>
            <div className="text-sm text-slate-500">{user?.phone || user?.email}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/orders" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-600">
          <Package className="h-5 w-5 text-blue-700" />
          <div>
            <div className="text-sm font-semibold text-slate-900">My orders</div>
            <div className="text-xs text-slate-500">Track, return or buy again</div>
          </div>
        </Link>
        <button
          onClick={logout}
          data-testid="account-logout"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-rose-300"
        >
          <LogOut className="h-5 w-5 text-rose-600" />
          <div>
            <div className="text-sm font-semibold text-slate-900">Sign out</div>
            <div className="text-xs text-slate-500">Securely log out of your account</div>
          </div>
        </button>
      </div>
    </div>
  );
}
