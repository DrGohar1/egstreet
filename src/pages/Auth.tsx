import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

const ADMIN_PATH = "/G63-admin";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || ADMIN_PATH;

  const [email,     setEmail]    = useState("");
  const [password,  setPassword] = useState("");
  const [showPass,  setShowPass] = useState(false);
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState("");
  const [attempts,  setAttempts] = useState(0);
  const [lockUntil, setLockUntil]= useState(0);
  const [remaining, setRemaining]= useState(0);

  // Restore lockout from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("_auth_lock");
    if (stored) {
      const { until, tries } = JSON.parse(stored);
      if (Date.now() < until) { setLockUntil(until); setAttempts(tries); }
      else localStorage.removeItem("_auth_lock");
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!lockUntil) return;
    const iv = setInterval(() => {
      const r = Math.max(0, lockUntil - Date.now());
      setRemaining(r);
      if (r === 0) { setLockUntil(0); setAttempts(0); localStorage.removeItem("_auth_lock"); }
    }, 1000);
    return () => clearInterval(iv);
  }, [lockUntil]);

  const formatTime = (ms: number) => {
    const m = Math.floor(ms/60000), s = Math.floor((ms%60000)/1000);
    return `${m}:${s.toString().padStart(2,"0")}`;
  };

  const isLocked = lockUntil > Date.now();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked || loading) return;
    if (!email.trim() || !password) { setError("أدخل بيانات الدخول"); return; }
    setLoading(true); setError("");

    try {
      let loginEmail = email.trim();

      // If username entered (no @), look up email via RPC (SECURITY DEFINER — bypasses RLS)
      if (!loginEmail.includes("@")) {
        const { data: emailResult, error: rpcErr } = await supabase
          .rpc("get_email_by_username", { p_username: loginEmail });

        if (rpcErr || !emailResult) {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          if (newAttempts >= MAX_ATTEMPTS) {
            const until = Date.now() + LOCKOUT_MS;
            setLockUntil(until);
            localStorage.setItem("_auth_lock", JSON.stringify({ until, tries: newAttempts }));
          }
          setError(`اسم المستخدم غير موجود. المحاولات المتبقية: ${MAX_ATTEMPTS - newAttempts}`);
          setLoading(false); return;
        }
        loginEmail = emailResult;
      }

      const { data, error: e1 } = await supabase.auth.signInWithPassword({ email: loginEmail, password });

      if (e1 || !data.session) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_MS;
          setLockUntil(until);
          localStorage.setItem("_auth_lock", JSON.stringify({ until, tries: newAttempts }));
          setError(`تم تجاوز الحد المسموح. انتظر 15 دقيقة.`);
        } else {
          setError(`بيانات خاطئة. المحاولات المتبقية: ${MAX_ATTEMPTS - newAttempts}`);
        }
        setLoading(false); return;
      }

      // Reset attempts on success
      setAttempts(0); localStorage.removeItem("_auth_lock");

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        setError("ليس لديك صلاحية الوصول");
        setLoading(false); return;
      }

      // Check must_change_password
      const { data: profileData } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileData?.must_change_password) {
        navigate("/G63-admin/change-password", { replace: true });
        return;
      }

      navigate(from.startsWith(ADMIN_PATH) ? from : ADMIN_PATH, { replace: true });
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-black">تسجيل الدخول</h1>
            <p className="text-xs text-muted-foreground">منطقة مقيدة — موظفون معتمدون فقط</p>
          </div>

          {isLocked ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <Lock className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-red-600">الحساب مقفول مؤقتاً</p>
              <p className="text-xs text-muted-foreground mt-1">يُفتح بعد: <span className="font-mono font-bold text-red-500">{formatTime(remaining)}</span></p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Honeypot — invisible to humans */}
              <input type="text" name="_hp" style={{display:"none"}} tabIndex={-1} autoComplete="off" />

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">اسم المستخدم</label>
                <input
                  type="text" value={email} onChange={e=>setEmail(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="اسم المستخدم أو البريد الإلكتروني" autoComplete="username" required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pe-10"
                    placeholder="••••••••" autoComplete="current-password" required
                  />
                  <button type="button" onClick={()=>setShowPass(!showPass)}
                    className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground">
                    {showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              {attempts > 0 && attempts < MAX_ATTEMPTS && (
                <div className="flex gap-1 justify-center">
                  {Array.from({length: MAX_ATTEMPTS}).map((_,i)=>(
                    <div key={i} className={`w-2 h-2 rounded-full ${i < attempts ? "bg-red-500":"bg-muted"}`}/>
                  ))}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {loading?<><Loader2 className="w-4 h-4 animate-spin"/>جارٍ التحقق...</>:<><Lock className="w-4 h-4"/>دخول آمن</>}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-[10px] text-muted-foreground/30 mt-4">محمي بتشفير SSL</p>
      </div>
    </div>
  );
}
