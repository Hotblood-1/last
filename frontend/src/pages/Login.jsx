import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Phone, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { api, formatError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [mode, setMode] = useState("password"); // password | otp
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginWithToken } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const passwordLogin = async (e) => {
    e.preventDefault();
    if (phone.length < 10 || password.length < 6) return toast.error("Enter phone & password (min 6 chars)");
    setLoading(true);
    try {
      const r = await api.post("/auth/customer/password-login", { phone, password });
      loginWithToken(r.data.token, r.data.user);
      toast.success("Welcome back!");
      nav(location.state?.from?.pathname || "/");
    } catch (e) { toast.error(formatError(e)); } finally { setLoading(false); }
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 10) {
      return toast.error("Enter a valid 10-digit phone number");
    }
    setLoading(true);
    try {
      const r = await api.post("/auth/customer/request-otp", { phone });
      toast.success(`OTP sent (mock): ${r.data.otp}`, { duration: 10000 });
      setStep(2);
    } catch (e) {
      toast.error(formatError(e));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      const r = await api.post("/auth/customer/verify-otp", { phone, otp, name, password: password || null });
      loginWithToken(r.data.token, r.data.user);
      toast.success("Welcome to TestSeries!");
      const to = location.state?.from?.pathname || "/";
      nav(to);
    } catch (e) {
      toast.error(formatError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12" data-testid="login-page">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
          <button type="button" onClick={() => setMode("password")} className={`rounded-full py-2 text-sm font-semibold ${mode==="password"?"bg-white shadow text-blue-700":"text-slate-600"}`}>Password</button>
          <button type="button" onClick={() => setMode("otp")} className={`rounded-full py-2 text-sm font-semibold ${mode==="otp"?"bg-white shadow text-blue-700":"text-slate-600"}`}>OTP</button>
        </div>

        {mode === "password" ? (
          <form onSubmit={passwordLogin} className="space-y-4">
            <h1 className="text-center font-display text-xl font-bold">Sign in with password</h1>
            <div>
              <label className="text-xs font-semibold text-slate-700">Phone</label>
              <input value={phone} onChange={(e)=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="9876543210" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none"/>
            </div>
            <button disabled={loading} className="w-full rounded-full bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">{loading?"Signing in…":"Sign in"}</button>
            <p className="text-center text-xs text-slate-500">First time or forgot password? Use the <button type="button" onClick={()=>setMode("otp")} className="font-semibold text-blue-700 underline">OTP tab</button>.</p>
          </form>
        ) : (
        <>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50">
          {step === 1 ? <Phone className="h-5 w-5 text-blue-700" /> : <KeyRound className="h-5 w-5 text-blue-700" />}
        </div>
        <h1 className="mt-5 text-center font-display text-2xl font-bold text-slate-900">
          {step === 1 ? "Sign in to TestSeries" : "Verify your number"}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          {step === 1
            ? "We'll send a one-time code to your phone."
            : `Enter the 6-digit OTP sent to ${phone}.`}
        </p>

        {step === 1 ? (
          <form onSubmit={requestOtp} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Your name (optional)</label>
              <input
                data-testid="login-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Riya Sharma"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Phone number</label>
              <div className="mt-1 flex rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-600 focus-within:bg-white">
                <span className="grid place-items-center px-3 text-sm font-semibold text-slate-500">+91</span>
                <input
                  data-testid="login-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 bg-transparent px-2 py-3 text-sm focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              data-testid="login-send-otp"
              className="w-full rounded-full bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:bg-slate-300"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">One-time code</label>
              <input
                data-testid="login-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg tracking-[0.5em] focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Set a password (optional, min 6 chars)</label>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Skip if not needed" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none"/>
              <p className="mt-1 text-[11px] text-slate-500">Set once, sign in faster next time without OTP.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              data-testid="login-verify-otp"
              className="w-full rounded-full bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:bg-slate-300"
            >
              {loading ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-slate-500 hover:text-blue-700"
            >
              Change phone number
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Admin?{" "}
          <Link to="/admin/login" className="font-semibold text-blue-700 hover:underline">
            Sign in here
          </Link>
        </p>
        </>
        )}
      </div>
    </div>
  );
}
