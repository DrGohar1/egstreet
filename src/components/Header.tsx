import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";
import { Link } from "react-router-dom";
import { User, LogOut, Search, Bookmark, UserCircle } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const { t, language } = useLanguage();
  const { user, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const [searchOpen, setSearchOpen] = useState(false);

  const siteName = language === "ar"
    ? (settings.site_name_ar || "جريدة الشارع المصري")
    : (settings.site_name_en || "EgStreet News");

  const siteDesc = settings.site_description || t("أخبار مصر والعالم", "Egypt & World News");

  return (
    <header className="bg-card border-b border-border">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground" style={settings.topbar_color ? { background: `hsl(${settings.topbar_color})` } : undefined}>
        <div className="container flex items-center justify-between py-1.5 text-xs">
          <span>{new Date().toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="flex items-center gap-1 hover:underline">
                  <UserCircle className="w-3.5 h-3.5" />
                  {t("حسابي", "My Account")}
                </Link>
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

      {/* Logo & Search — centered layout */}
      <div className="container py-5" style={settings.font_family ? { fontFamily: settings.font_family } : undefined}>
        <div className="flex items-center justify-between">
          {/* Partner logo left */}
          <div className="flex-1 flex items-center">
            {settings.partner_logo_url && (
              <a href={settings.partner_link || "#"} target="_blank" rel="noopener noreferrer">
                <img src={settings.partner_logo_url} alt={settings.partner_credit || ""} className="h-8 md:h-10 object-contain opacity-70 hover:opacity-100 transition-opacity" />
              </a>
            )}
          </div>

          {/* Centered Logo */}
          <Link to="/" className="inline-block text-center">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={siteName} className="h-12 md:h-16 object-contain mx-auto" />
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                  {siteName}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 tracking-widest uppercase">
                  {siteDesc}
                </p>
              </>
            )}
          </Link>

          {/* Search right */}
          <div className="flex-1 flex items-center justify-end gap-3">
            {user && (
              <Link to="/saved" className="p-2 rounded-full hover:bg-muted transition-colors" title={t("المحفوظة", "Saved")}>
                <Bookmark className="w-5 h-5 text-muted-foreground" />
              </Link>
            )}
            {searchOpen && (
              <form onSubmit={(e) => { e.preventDefault(); const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value; window.location.href = `/search?q=${encodeURIComponent(q)}`; }}>
                <input
                  name="q"
                  type="text"
                  placeholder={t("ابحث...", "Search...")}
                  className="border border-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground w-48 focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                />
              </form>
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
