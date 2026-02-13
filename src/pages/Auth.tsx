import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Mail, Lock, User, AlertCircle } from "lucide-react";

const Auth = () => {
  const { t } = useLanguage();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, displayName);
      if (error) setError(error.message);
      else setSuccess(t("تم إنشاء الحساب! تحقق من بريدك الإلكتروني للتأكيد.", "Account created! Check your email to confirm."));
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
      else navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead
        title={t("تسجيل الدخول", "Sign In")}
        description={t("تسجيل الدخول إلى جريدة الشارع المصري", "Sign in to EgStreet News")}
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-foreground">{t("جريدة الشارع المصري", "EgStreet News")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? t("إنشاء حساب جديد", "Create a new account") : t("تسجيل الدخول", "Sign in to your account")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-primary bg-primary/10 p-3 rounded">{success}</div>
          )}

          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">{t("الاسم", "Name")}</label>
              <div className="relative">
                <User className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">{t("البريد الإلكتروني", "Email")}</label>
            <div className="relative">
              <Mail className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full ps-9 pe-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">{t("كلمة المرور", "Password")}</label>
            <div className="relative">
              <Lock className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full ps-9 pe-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading
              ? "..."
              : isSignUp
              ? t("إنشاء حساب", "Sign Up")
              : t("تسجيل الدخول", "Sign In")}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? t("لديك حساب؟", "Already have an account?") : t("ليس لديك حساب؟", "Don't have an account?")}{" "}
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccess(""); }} className="text-primary font-semibold hover:underline">
              {isSignUp ? t("تسجيل الدخول", "Sign In") : t("إنشاء حساب", "Sign Up")}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Auth;
