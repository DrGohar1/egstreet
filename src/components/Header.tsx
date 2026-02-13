import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import LanguageToggle from "./LanguageToggle";
import { Link } from "react-router-dom";
import { User, LogOut } from "lucide-react";

const Header = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();

  return (
    <header className="bg-card border-b border-border">
      {/* Top bar */}
      <div className="container flex items-center justify-between py-2 text-xs text-muted-foreground">
        <span>{new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="flex items-center gap-1 text-primary hover:underline">
                <User className="w-3.5 h-3.5" />
                {t("لوحة التحكم", "Dashboard")}
              </Link>
              <button onClick={signOut} className="flex items-center gap-1 hover:text-destructive transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="text-primary hover:underline font-medium">
              {t("تسجيل الدخول", "Sign In")}
            </Link>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className="container py-4 text-center border-t border-border">
        <Link to="/" className="inline-block">
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
            {t("جريدة الشارع المصري", "EgStreet News")}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">
            {t("أخبار مصر والعالم", "Egypt & World News")}
          </p>
        </Link>
      </div>
    </header>
  );
};

export default Header;
