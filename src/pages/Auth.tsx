import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Newspaper, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/egstreet-admin";

  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) { setError("أدخل بيانات الدخول"); return; }
    setLoading(true); setError("");

    try {
      let email = identifier.trim();

      if (!email.includes("@")) {
        const domains = ["@egstreet.com"];
        let found = false;
        for (const d of domains) {
          const { data, error: e1 } = await supabase.auth.signInWithPassword({ email: email + d, password });
          if (!e1 && data.session) {
            found = true;
            await afterLogin(data.user);
            return;
          }
        }
        if (!found) { setError("اسم المستخدم أو كلمة المرور غير صحيحة"); setLoading(false); return; }
      } else {
        const { data, error: e1 } = await supabase.auth.signInWithPassword({ email, password });
        if (e1 || !data.session) { setError("البريد الإلكتروني أو كلمة المرور غير صحيحة"); setLoading(false); return; }
        await afterLogin(data.user);
      }
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    }
    setLoading(false);
  }

  async function afterLogin(user: any) {
    const meta = user?.user_metadata || {};
    if (meta.force_password_change) {
      navigate("/egstreet-admin/set-password", { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4" dir="rtl">

      {/* Back to site */}
      <Link to="/" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs mb-8 transition-colors self-start max-w-sm w-full">
        <ArrowRight className="w-3.5 h-3.5"/>
        العودة إلى الموقع
      </Link>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-600 rounded-2xl mb-4 shadow-lg shadow-rose-900/40">
            <Newspaper className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">لوحة التحكم</h1>
          <p className="text-gray-500 text-sm mt-1">جريدة الشارع المصري</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}
          className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800 space-y-5">

          {error && (
            <div className="bg-red-950/60 border border-red-800/60 text-red-400 text-sm rounded-xl px-4 py-3 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">
              اسم المستخدم أو البريد الإلكتروني
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="اسم المستخدم أو الإيميل"
              autoComplete="username"
              disabled={loading}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm
                         focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500
                         placeholder-gray-600 disabled:opacity-50 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pr-4 pl-10 py-3 text-sm
                           focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500
                           placeholder-gray-600 disabled:opacity-50 transition-colors"
              />
              <button type="button" tabIndex={-1}
                onClick={() => setShowPass(s => !s)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black py-3 rounded-xl
                       transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />جارٍ الدخول...</>
              : "دخول →"
            }
          </button>
        </form>

        <p className="text-center text-gray-700 text-xs mt-6">
          © {new Date().getFullYear()} الشارع المصري — للفريق التحريري فقط
        </p>
      </div>
    </div>
  );
}
