import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";

const ResetPassword = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "Password must be at least 6 characters"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("كلمتا المرور غير متطابقتين", "Passwords don't match"));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead title={t("إعادة تعيين كلمة المرور", "Reset Password")} description="" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-foreground">{t("إعادة تعيين كلمة المرور", "Reset Password")}</h1>
        </div>

        {success ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-foreground font-medium">{t("تم تغيير كلمة المرور بنجاح!", "Password changed successfully!")}</p>
            <p className="text-sm text-muted-foreground">{t("سيتم توجيهك للصفحة الرئيسية...", "Redirecting to home page...")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">{t("كلمة المرور الجديدة", "New Password")}</label>
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

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">{t("تأكيد كلمة المرور", "Confirm Password")}</label>
              <div className="relative">
                <Lock className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "..." : t("تغيير كلمة المرور", "Change Password")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
