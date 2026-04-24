import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck } from "lucide-react";

export default function SetPassword() {
  const navigate = useNavigate();
  const [pass,    setPass]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const strength = pass.length >= 12 ? 4 : pass.length >= 8 ? 3 : pass.length >= 6 ? 2 : pass.length > 0 ? 1 : 0;
  const colors   = ["bg-gray-700","bg-red-500","bg-yellow-500","bg-blue-500","bg-green-500"];
  const labels   = ["", "ضعيف جداً", "ضعيف", "جيد", "قوي 💪"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pass.length < 8) { setError("الباسورد 8 أحرف على الأقل"); return; }
    if (pass !== confirm) { setError("الباسوردين غير متطابقين"); return; }
    if (strength < 2) { setError("الباسورد ضعيف جداً، أضف أرقاماً وأحرف"); return; }
    setLoading(true); setError("");

    const { error: e1 } = await supabase.auth.updateUser({
      password: pass,
      data: { force_password_change: false }
    });

    if (e1) { setError(e1.message); setLoading(false); return; }
    navigate("/G63-admin", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">تعيين كلمة المرور</h1>
          <p className="text-gray-500 text-sm mt-1">أول دخول — عيّن باسوردك الخاص</p>
        </div>

        <form onSubmit={handleSubmit}
          className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">

          {error && (
            <div className="bg-red-950/60 border border-red-800/60 text-red-400 text-sm rounded-xl px-4 py-3 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">كلمة المرور الجديدة</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••" disabled={loading}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm
                         focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder-gray-600" />
            {pass && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i<=strength ? colors[strength] : "bg-gray-700"}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">{labels[strength]}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">تأكيد كلمة المرور</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••" disabled={loading}
              className={`w-full bg-gray-800 border text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 placeholder-gray-600
                ${confirm && confirm !== pass ? "border-red-600 focus:ring-red-600" : "border-gray-700 focus:border-green-500 focus:ring-green-500"}`} />
            {confirm && confirm !== pass && <p className="text-xs text-red-500 mt-1">الباسوردين غير متطابقين</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> جاري الحفظ...</> : "حفظ وادخل →"}
          </button>
        </form>
      </div>
    </div>
  );
}
