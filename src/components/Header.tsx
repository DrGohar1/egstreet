import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";
import { Link } from "react-router-dom";
import { User, LogOut, Search, Bookmark, UserCircle, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const { t, language } = useLanguage();
  const { user, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const [searchOpen, setSearchOpen] = useState(false);

  const siteName = language === "ar"
    ? (settings.site_name_ar || "جريدة الشارع المصري")
    : (settings.site_name_en || "EgStreet News");

  const tagline = language === "ar"
    ? (settings.site_tagline_ar || "صحافة تضرم عقلك")
    : (settings.site_tagline_en || "Journalism that ignites your mind");

  const today = new Date().toLocaleDateString(
    language === "ar" ? "ar-EG" : "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <header className="bg-card border-b border-border">
      <div className="topbar-stripe" />

      {/* Utility bar */}
      <div className="bg-ink text-[hsl(var(--nav-foreground))]">
        <div className="container flex items-center justify-between py-1.5 text-xs">
          <span className="opacity-60 hidden sm:block">{today}</span>
          <div className="flex items-center gap-3 ms-auto">
            <ThemeToggle />
            <LanguageToggle />
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="flex items-center gap-1 hover:text-[hsl(var(--nav-accent))] transition-colors">
                  <UserCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("حسابي", "Account")}</span>
                </Link>
                <Link to="/Gadmin" className="flex items-center gap-1 hover:text-[hsl(var(--nav-accent))] transition-colors">
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("لوحة التحكم", "Dashboard")}</span>
                </Link>
                <button onClick={signOut} className="opacity-60 hover:opacity-100 hover:text-[hsl(var(--nav-accent))] transition-all">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Logo zone */}
      <div className="container py-4 md:py-6">
        <div className="flex items-center justify-between gap-4">

          {/* Left space / partner */}
          <div className="flex-1 flex items-start">
            {settings.partner_logo_url && (
              <a href={settings.partner_link || "#"} target="_blank" rel="noopener noreferrer">
                <img src={settings.partner_logo_url} alt="" className="h-8 md:h-10 object-contain opacity-60 hover:opacity-100 transition-opacity" />
              </a>
            )}
          </div>

          {/* Center logo */}
          <Link to="/" className="inline-block text-center group">
            {settings.logo_url ? (
              <img
                src={settings.logo_url} alt={siteName}
                className="h-16 md:h-24 object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div>
                <p className="text-[10px] text-muted-foreground tracking-[.18em] uppercase mb-1">{t("جريدة", "newspaper")}</p>
                <h1 className="text-4xl md:text-6xl font-black leading-none tracking-tight">
                  <span className="text-[hsl(var(--primary))]">الشارع</span>
                  <span className="text-foreground"> المصري</span>
                </h1>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1.5 tracking-[.22em] font-medium uppercase">{tagline}</p>
              </div>
            )}
          </Link>

          {/* Right: search + saved */}
          <div className="flex-1 flex items-center justify-end gap-1.5">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label={t("بحث", "Search")}
            >
              <Search className="w-5 h-5" />
            </button>
            {user && (
              <Link to="/saved" className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title={t("المحفوظات", "Saved")}>
                <Bookmark className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Search bar expand */}
        {searchOpen && (
          <div className="mt-4 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
            <input
              type="search"
              autoFocus
              placeholder={t("ابحث في الأخبار...", "Search news...")}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim())
                  window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`;
              }}
            />
            <button onClick={() => setSearchOpen(false)} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
