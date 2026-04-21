import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

const Auth = () => {
  const { t } = useLanguage();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.from || "/";

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setSuccess(t("تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.", "Reset link sent to your email."));
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { error } = await signUp(email, password, displayName);
      if (error) setError(error.message);
      else setSuccess(t("تم إنشاء الحساب! تحقق من بريدك للتأكيد.", "Account created! Check your email."));
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
      else navigate(returnTo, { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <SEOHead
        title={t("تسجيل الدخول", "Sign In")}
        description={t("تسجيل الدخول إلى جريدة الشارع المصري", "Sign in to EgStreet News")}
      />
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-3">
            <span className="text-white font-black text-xl">G</span>
          </div>
          <h1 className="text-xl font-black text-foreground">{t("جريدة الشارع المصري", "EgStreet News")}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "forgot" ? t("استعادة كلمة المرور", "Recover password")
              : mode === "signup" ? t("إنشاء حساب جديد", "Create account")
              : t("مرحباً بعودتك", "Welcome back")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4">
          {/* Error/Success */}
          {error && (
            <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("الاسم الكامل", "Full name")} required
                  className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t("البريد الإلكتروني", "Email address")} required
                className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("كلمة المرور", "Password")} required minLength={6}
                  className="w-full h-10 ps-9 pe-9 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "forgot" ? t("إرسال رابط الاسترداد", "Send recovery link")
                : mode === "signup" ? t("إنشاء الحساب", "Create account")
                : t("تسجيل الدخول", "Sign in")}
            </button>
          </form>

          {/* Footer Links */}
          <div className="text-center space-y-2 pt-1">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors block w-full">
                  {t("نسيت كلمة المرور؟", "Forgot password?")}
                </button>

              </>
            )}
            {(mode === "signup" || mode === "forgot") && (
              <button onClick={() => setMode("login")}
                className="text-xs text-primary font-semibold hover:underline">
                {t("العودة لتسجيل الدخول", "Back to sign in")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
