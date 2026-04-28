import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Moon, Sun, Bookmark, Menu, X, LayoutDashboard, Radio, Cloud } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Category { id:string; name_ar:string; slug:string; }

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme?.() || { theme:"light", toggleTheme:()=>{} };
  const { settings } = useSiteSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [searchQ,    setSearchQ]    = useState("");
  const [scrolled,   setScrolled]   = useState(false);
  const [staffList, setStaffList] = useState<{display_name:string;role:string}[]>([]);
  const [clock,      setClock]      = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("ar-EG", { hour:"2-digit", minute:"2-digit" }));
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Load staff by role for top bar
    supabase.from("profiles").select("display_name, user_roles!inner(role)")
      .in("user_roles.role", ["super_admin","editor_in_chief","journalist","analyst","ads_manager"])
      .then(({ data }) => {
        if (data) setStaffList(data.map((p:any) => ({
          display_name: p.display_name,
          role: p.user_roles?.[0]?.role || "journalist",
        })));
      });
    supabase.from("categories").select("id,name_ar,slug").order("sort_order")
      .then(({ data }) => setCategories(data || []));
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false); setSearchQ("");
    }
  };

  const ROLE_META: Record<string,{label:string;color:string}> = {
    super_admin:     { label:"مدير عام",     color:"text-red-300" },
    editor_in_chief: { label:"رئيس تحرير",   color:"text-yellow-300" },
    journalist:      { label:"صحفي",          color:"text-blue-300" },
    analyst:         { label:"محلل",          color:"text-green-300" },
    ads_manager:     { label:"مدير إعلانات", color:"text-purple-300" },
  };
  const ROLE_ORDER = ["super_admin","editor_in_chief","journalist","analyst","ads_manager"];
  const sortedStaff = [...staffList].sort((a,b)=>ROLE_ORDER.indexOf(a.role)-ROLE_ORDER.indexOf(b.role));
  const logoUrl  = settings?.logo_url || settings?.site_logo || "";
  const siteName = settings?.site_name_ar || "الشارع المصري";
  const slogan   = settings?.newspaper_slogan || "من قلب الحدث";
  const editorName  = settings?.chief_editor_name || "";
  const today = new Date().toLocaleDateString("ar-EG", {
    weekday:"long", year:"numeric", month:"long", day:"numeric"
  });

  // Social links from settings
  const socials = [
    { key:"facebook_url",  label:"f",  icon:"𝐟" },
    { key:"twitter_url",   label:"X",  icon:"𝕏" },
    { key:"instagram_url", label:"◎",  icon:"◎" },
    { key:"youtube_url",   label:"▶",  icon:"▶" },
    { key:"tiktok_url",    label:"♪",  icon:"♪" },
  ];

  return (
    <>
      {/* ══ Top Bar (desktop only) ══ */}
      <div className="bg-primary text-white text-[10px] hidden md:block shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-8">
          {/* Left: Date + Time + Social */}
          <div className="flex items-center gap-3">
            <span className="font-medium opacity-90">{today}</span>
            <span className="opacity-30 text-xs">|</span>
            <span className="font-mono opacity-80 tabular-nums">{clock}</span>
            <span className="opacity-30 text-xs">|</span>
            <div className="flex items-center gap-2">
              {socials.map(s => {
                const url = settings?.[s.key];
                return url
                  ? <a key={s.key} href={url} target="_blank" rel="noopener noreferrer"
                      className="hover:opacity-70 transition-opacity font-bold">{s.label}</a>
                  : null;
              })}
            </div>
          </div>
          {/* Right: Page links */}
          <div className="flex items-center gap-3 font-bold">
            <Link to="/page/about"     className="hover:opacity-75 transition-opacity">من نحن</Link>
            <span className="opacity-30">|</span>
            <Link to="/page/contact"   className="hover:opacity-75 transition-opacity">اتصل بنا</Link>
            <span className="opacity-30">|</span>
            <Link to="/page/advertise" className="hover:opacity-75 transition-opacity">أعلن معنا</Link>
            <span className="opacity-30">|</span>
            <Link to="/page/privacy"   className="hover:opacity-75 transition-opacity">سياسة الخصوصية</Link>
          </div>
        </div>
      </div>

      {/* ══ Staff Bar (newspaper style) ══ */}
      {sortedStaff.length > 0 && (
        <div className="bg-foreground/5 border-b border-border/30 hidden md:block text-[9px]">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 h-6 overflow-hidden">
            <span className="text-muted-foreground/60 font-bold shrink-0">الفريق التحريري:</span>
            {sortedStaff.map((s, i) => {
              const meta = ROLE_META[s.role] || { label: s.role, color: "text-muted-foreground" };
              return (
                <span key={i} className="flex items-center gap-1 shrink-0">
                  <span className={`font-bold ${meta.color}`}>{meta.label}</span>
                  <span className="text-foreground font-black">{s.display_name}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ Main Header ══ */}
      <header className={`sticky top-0 z-40 bg-card border-b border-border transition-all duration-300 ${scrolled ? "shadow-lg shadow-black/10" : ""}`} dir="rtl">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">

          {/* ─ Logo Row (desktop: weather + logo + actions) ─ */}
          <div className="flex items-center justify-between py-2 gap-3">

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(m => !m)} aria-label="القائمة"
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors shrink-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={menuOpen ? "x" : "menu"}
                  initial={{ rotate:-90, opacity:0 }} animate={{ rotate:0, opacity:1 }}
                  exit={{ rotate:90, opacity:0 }} transition={{ duration:0.15 }}>
                  {menuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Weather (desktop left) */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground min-w-[100px]">
              <Cloud className="w-4 h-4 text-primary/60"/>
              <div>
                <div className="font-bold text-foreground text-sm">28°</div>
                <div className="text-[10px] leading-none">{settings?.weather_city || "القاهرة"} • صحو</div>
              </div>
            </div>

            {/* Logo — center */}
            <Link to="/" className="flex items-center gap-2.5 group mx-auto lg:mx-0">
              <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}>
                {logoUrl
                  ? <img src={logoUrl} alt={siteName} className="h-12 w-auto max-w-[52px] rounded-xl object-cover shadow-sm"/>
                  : <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg shadow-sm">ش</div>
                }
              </motion.div>
              <div className="text-center lg:text-start">
                <div className="font-black text-xl leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {siteName.replace("جريدة ", "")}
                </div>
                <div className="text-[9px] text-muted-foreground/70 font-medium leading-none">{slogan}</div>
                {editorName && (
                  <div className="text-[9px] text-primary/80 font-bold leading-none mt-0.5">
                    رئيس التحرير: {editorName}
                  </div>
                )}
              </div>
            </Link>

            {/* Actions (right) */}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setSearchOpen(s => !s)} aria-label="بحث"
                className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
                <Search className="w-4 h-4"/>
              </button>
              <button onClick={toggleTheme} aria-label="الوضع الليلي"
                className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
                {theme === "dark" ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
              </button>
              <Link to="/saved" aria-label="المحفوظات"
                className="w-9 h-9 rounded-xl hover:bg-muted hidden sm:flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
                <Bookmark className="w-4 h-4"/>
              </Link>
              {/* Live button */}
              <a href={settings?.live_url || "#"}
                className="hidden sm:flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl hover:bg-red-700 transition-colors shadow-sm animate-pulse">
                <Radio className="w-3 h-3 shrink-0"/>
                <span>البث المباشر</span>
              </a>
              {user && (
                <Link to="/G63-admin"
                  className="hidden md:flex items-center gap-1.5 bg-primary text-white text-xs font-black px-3 py-1.5 rounded-xl hover:bg-primary/85 transition-colors shadow-sm">
                  <LayoutDashboard className="w-3.5 h-3.5"/>
                  <span className="hidden lg:inline">لوحة التحكم</span>
                </Link>
              )}
            </div>
          </div>

          {/* ─ Nav Bar ─ */}
          <nav className="hidden lg:flex items-center border-t border-border/50 overflow-x-auto scrollbar-hide" dir="rtl">
            <Link to="/"
              className="text-xs font-black px-4 py-2.5 hover:text-primary border-b-2 border-transparent hover:border-primary transition-all shrink-0 text-foreground whitespace-nowrap">
              الرئيسية
            </Link>
            {categories.map(c => (
              <Link key={c.id} to={`/category/${c.slug}`}
                className="text-xs font-bold px-3 py-2.5 hover:text-primary border-b-2 border-transparent hover:border-primary transition-all shrink-0 text-muted-foreground whitespace-nowrap">
                {c.name_ar}
              </Link>
            ))}
            <Link to="/archive"
              className="text-xs font-bold px-3 py-2.5 hover:text-primary border-b-2 border-transparent hover:border-primary transition-all shrink-0 text-muted-foreground whitespace-nowrap mr-auto">
              المزيد
            </Link>
          </nav>
        </div>

        {/* ── Search Bar ── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
              exit={{height:0,opacity:0}} transition={{duration:0.2}}
              className="border-t border-border overflow-hidden bg-card">
              <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex gap-2">
                <input ref={searchRef} value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="ابحث في الأخبار..."
                  className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" dir="rtl"/>
                <button type="submit"
                  className="bg-primary text-white px-5 rounded-xl font-bold text-sm hover:bg-primary/80 transition-colors">بحث</button>
                <button type="button" onClick={() => setSearchOpen(false)}
                  className="w-10 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
              exit={{height:0,opacity:0}} transition={{duration:0.25}}
              className="border-t border-border overflow-hidden bg-card lg:hidden">
              <div className="max-w-7xl mx-auto px-3 py-3">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Link to="/" onClick={() => setMenuOpen(false)}
                    className="text-xs font-black px-2 py-2.5 rounded-xl bg-primary text-white text-center">
                    الرئيسية
                  </Link>
                  {categories.map(c => (
                    <Link key={c.id} to={`/category/${c.slug}`} onClick={() => setMenuOpen(false)}
                      className="text-xs font-bold px-2 py-2.5 rounded-xl bg-muted hover:bg-primary hover:text-white text-center transition-all">
                      {c.name_ar}
                    </Link>
                  ))}
                </div>
                {user && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Link to="/G63-admin" onClick={() => setMenuOpen(false)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-black py-2.5 rounded-xl bg-primary text-white">
                      <LayoutDashboard className="w-3.5 h-3.5"/> لوحة التحكم
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
