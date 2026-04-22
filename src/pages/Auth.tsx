import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft, Newspaper, KeyRound, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "login" | "signup" | "forgot";

const Auth = () => {
  const { t } = useLanguage();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.from || "/";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSubmitting(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSubmitting(false);
      if (error) setError(error.message);
      else setSuccess(t("✅ تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.", "✅ Password reset link sent to your email."));
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPass) {
        setError(t("كلمتا المرور غير متطابقتين", "Passwords do not match"));
        setSubmitting(false);
        return;
      }
      if (password.length < 6) {
        setError(t("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "Password must be at least 6 characters"));
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, displayName);
      setSubmitting(false);
      if (error) setError(error.message);
      else setSuccess(t("✅ تم إنشاء الحساب! تحقق من بريدك الإلكتروني للتأكيد.", "✅ Account created! Check your email to confirm."));
      return;
    }

    // Login
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      if (error.message.includes("Invalid login")) {
        setError(t("البريد الإلكتروني أو كلمة المرور غير صحيحة", "Invalid email or password"));
      } else {
        setError(error.message);
      }
    } else {
      navigate(returnTo, { replace: true });
    }
  };

  const titles: Record<Mode, { ar: string; en: string; sub_ar: string; sub_en: string }> = {
    login: { ar: "مرحباً بعودتك 👋", en: "Welcome back 👋", sub_ar: "سجّل دخولك للمتابعة", sub_en: "Sign in to continue" },
    signup: { ar: "إنشاء حساب جديد", en: "Create account", sub_ar: "انضم إلى الشارع المصري", sub_en: "Join EgStreet News" },
    forgot: { ar: "نسيت كلمة المرور؟", en: "Forgot password?", sub_ar: "سنرسل رابط الاسترداد لبريدك", sub_en: "We'll send a reset link to your email" },
  };

  const title = titles[mode];

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <SEOHead
        title={t("تسجيل الدخول", "Sign In")}
        description={t("تسجيل الدخول إلى جريدة الشارع المصري", "Sign in to EgStreet News")}
      />

      {/* Left decorative panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden flex-col items-center justify-center p-12 text-white">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-white/5 rounded-full" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm mb-6 shadow-xl">
            <Newspaper className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black mb-3">الشارع المصري</h1>
          <p className="text-white/75 text-sm leading-relaxed mb-8">
            أحدث الأخبار المصرية والعربية والعالمية — موثوقة وسريعة ومحايدة
          </p>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { n: "16+", l: "مقال" },
              { n: "6", l: "قسم" },
              { n: "24/7", l: "تغطية" },
            ].map(s => (
              <div key={s.l} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
                <div className="text-xl font-black">{s.n}</div>
                <div className="text-xs text-white/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-lg">الشارع المصري</span>
            </div>
          </div>

          {/* Title */}
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-7">
              <h2 className="text-2xl font-black text-foreground">
                {t(title.ar, title.en)}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {t(title.sub_ar, title.sub_en)}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Success message */}
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex items-start gap-3 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 rounded-2xl p-4 mb-5 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl p-4 mb-5 text-sm">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

                {/* Display name (signup only) */}
                {mode === "signup" && (
                  <div>
                    <label className="text-sm font-bold text-foreground mb-1.5 block">
                      {t("الاسم الكامل", "Full Name")}
                    </label>
                    <div className="relative">
                      <User className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder={t("أدخل اسمك الكامل", "Enter your full name")}
                        required
                        className="w-full border border-border rounded-xl px-4 py-3 ps-10 text-sm bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="text-sm font-bold text-foreground mb-1.5 block">
                    {t("البريد الإلكتروني", "Email")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      required
                      autoComplete="email"
                      className="w-full border border-border rounded-xl px-4 py-3 ps-10 text-sm bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Password */}
                {mode !== "forgot" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-bold text-foreground">
                        {t("كلمة المرور", "Password")}
                      </label>
                      {mode === "login" && (
                        <button type="button" onClick={() => { setMode("forgot"); setError(""); }}
                          className="text-xs text-primary hover:underline">
                          {t("نسيت كلمة المرور؟", "Forgot password?")}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        className="w-full border border-border rounded-xl px-4 py-3 ps-10 pe-12 text-sm bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                        dir="ltr"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute top-1/2 -translate-y-1/2 end-3.5 text-muted-foreground hover:text-foreground transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm password (signup only) */}
                {mode === "signup" && (
                  <div>
                    <label className="text-sm font-bold text-foreground mb-1.5 block">
                      {t("تأكيد كلمة المرور", "Confirm Password")}
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={`w-full border rounded-xl px-4 py-3 ps-10 pe-12 text-sm bg-background focus:ring-2 focus:ring-primary/30 outline-none transition-all ${
                          confirmPass && confirmPass !== password ? "border-red-400 focus:ring-red-400/30" : "border-border focus:border-primary"
                        }`}
                        dir="ltr"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute top-1/2 -translate-y-1/2 end-3.5 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPass && confirmPass !== password && (
                      <p className="text-xs text-red-500 mt-1">{t("كلمتا المرور غير متطابقتين", "Passwords don't match")}</p>
                    )}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-black text-sm hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 transition-all shadow-md shadow-primary/20 mt-2"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t("جاري...", "Loading...")}</>
                  ) : mode === "forgot" ? (
                    <>{t("إرسال رابط الاستعادة", "Send reset link")}</>
                  ) : mode === "signup" ? (
                    <>{t("إنشاء الحساب", "Create Account")}</>
                  ) : (
                    <>{t("تسجيل الدخول", "Sign In")}</>
                  )}
                </button>
              </motion.div>
            </AnimatePresence>
          </form>

          {/* Mode toggle */}
          <div className="mt-6 text-center space-y-2">
            {mode === "login" ? (
              <p className="text-sm text-muted-foreground">
                {t("ليس لديك حساب؟ ", "Don't have an account? ")}
                <button onClick={() => { setMode("signup"); setError(""); }}
                  className="text-primary font-bold hover:underline">
                  {t("أنشئ حساباً", "Sign up")}
                </button>
              </p>
            ) : (
              <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
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
