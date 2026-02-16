import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";
import { Link } from "react-router-dom";
import { User, LogOut, Search } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border">
      {/* Top bar - red accent like youm7 */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex items-center justify-between py-1.5 text-xs">
          <span>{new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="flex items-center gap-1 hover:underline">
                  <User className="w-3.5 h-3.5" />
                  {t("لوحة التحكم", "Dashboard")}
                </Link>
                <button onClick={signOut} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link to="/auth" className="hover:underline font-medium">
                {t("تسجيل الدخول", "Sign In")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Logo & Search - youm7 style */}
      <div className="container py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              {t("جريدة الشارع المصري", "EgStreet News")}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 tracking-widest uppercase">
              {t("أخبار مصر والعالم", "Egypt & World News")}
            </p>
          </Link>

          {/* Search */}
          <div className="flex items-center gap-2">
            {searchOpen && (
              <input
                type="text"
                placeholder={t("ابحث...", "Search...")}
                className="border border-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground w-48 focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            )}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
