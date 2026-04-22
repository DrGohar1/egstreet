import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Loader2, Newspaper, Lock, UserPlus, LogIn } from "lucide-react";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [tab,      setTab]      = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [display,  setDisplay]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(null);

  const cleanUser = (v) => v.toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,20);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!username.trim()) { setError("ادخل اسم المستخدم"); return; }
    if (!password)        { setError("ادخل كلمة السر"); return; }
    setLoading(true);

    if (tab === "login") {
      const { error } = await signIn(username, password);
      if (error) { setError(error); setLoading(false); return; }
      navigate("/");
    } else {
      if (password.length < 6) { setError("كلمة السر 6 أحرف على الأقل"); setLoading(false); return; }
      const { error } = await signUp(username, password, display || username);
      if (error) { setError(error); setLoading(false); return; }
      setSuccess("تم إنشاء الحساب! جاري الدخول...");
      setTimeout(async () => { await signIn(username, password); navigate("/"); }, 1200);
    }
    setLoading(false);
  };

  const strength = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : password.length >= 3 ? 1 : 0;
  const strengthColors = ["bg-muted","bg-red-400","bg-yellow-400","bg-blue-400","bg-green-400"];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">

        <Link to="/" className="flex flex-col items-center gap-2 mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Newspaper className="w-7 h-7 text-white"/>
          </div>
          <div className="text-center">
            <div className="font-black text-xl leading-tight">الشارع المصري</div>
            <div className="text-xs text-muted-foreground">EG Street News</div>
          </div>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">

          <div className="flex bg-muted rounded-xl p-1 mb-6">
            {["login","register"].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                className={"flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all " +
                  (tab===t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
                {t==="login" ? <><LogIn className="w-3.5 h-3.5"/>دخول</> : <><UserPlus className="w-3.5 h-3.5"/>تسجيل</>}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {tab === "register" && (
              <div>
                <label className="block text-xs font-bold mb-1.5">الاسم الظاهر <span className="text-muted-foreground font-normal">(اختياري)</span></label>
                <input value={display} onChange={e => setDisplay(e.target.value)}
                  placeholder="مثال: محمد أحمد"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"/>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1.5">اسم المستخدم</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold select-none">@</span>
                <input value={username} onChange={e => setUsername(cleanUser(e.target.value))}
                  placeholder="ahmed_news" autoComplete="username"
                  className="w-full bg-muted border border-border rounded-xl pr-8 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  dir="ltr"/>
              </div>
              {tab==="register" && username.length > 0 && username.length < 3 && (
                <p className="text-[10px] text-red-500 mt-1">3 حروف على الأقل</p>
              )}
              {tab==="register" && username.length >= 3 && (
                <p className="text-[10px] text-green-600 mt-1 font-bold">@{username} ✓</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5">كلمة السر</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <input type={showPass?"text":"password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={tab==="register" ? "6 أحرف على الأقل" : "كلمة السر"}
                  autoComplete={tab==="login"?"current-password":"new-password"}
                  className="w-full bg-muted border border-border rounded-xl pr-10 pl-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  dir="ltr"/>
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
              {tab==="register" && password.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={"h-1 flex-1 rounded-full transition-all " + (strength >= i ? strengthColors[i] : "bg-muted")}/>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs font-medium flex items-center gap-2 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 py-2.5 text-xs font-medium flex items-center gap-2">
                ✅ {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white font-black py-3 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>جاري التحقق...</>
                : tab==="login" ? <><LogIn className="w-4 h-4"/>دخول</>
                : <><UserPlus className="w-4 h-4"/>إنشاء الحساب</>}
            </button>

            {tab==="register" && (
              <p className="text-[10px] text-muted-foreground text-center">بالتسجيل توافق على شروط الاستخدام</p>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link to="/" className="hover:text-primary transition-colors">← العودة للرئيسية</Link>
        </p>
      </div>
    </div>
  );
}
