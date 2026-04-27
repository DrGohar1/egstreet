import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Moon, Sun, Bookmark, Menu, X, LayoutDashboard } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Category { id:string; name_ar:string; slug:string; }

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme?.() || { theme:"light", toggleTheme:()=>{} };
  const { settings } = useSiteSettings();
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [searchQ,     setSearchQ]     = useState("");
  const [scrolled,    setScrolled]    = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const logoUrl  = settings?.logo_url || settings?.site_logo || "";
  const siteName = settings?.site_name_ar || "الشارع المصري";

  useEffect(()=>{
    supabase.from("categories").select("id,name_ar,slug").order("sort_order").limit(10)
      .then(({data})=>setCategories(data||[]));
    const onScroll = ()=>setScrolled(window.scrollY>10);
    window.addEventListener("scroll",onScroll,{passive:true});
    return ()=>window.removeEventListener("scroll",onScroll);
  },[]);

  useEffect(()=>{
    if (searchOpen) setTimeout(()=>searchRef.current?.focus(),100);
  },[searchOpen]);

  const handleSearch = (e:React.FormEvent)=>{
    e.preventDefault();
    if (searchQ.trim()) { navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`); setSearchOpen(false); setSearchQ(""); }
  };

  const today = new Date().toLocaleDateString("ar-EG",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

  return (
    <>
      {/* Top bar */}
      <div className="bg-primary text-white text-[10px] hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between py-1.5">
          <span className="font-medium">{today}</span>
          <div className="flex items-center gap-3">
            {settings?.facebook_url  && <a href={settings.facebook_url}  target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">فيسبوك</a>}
            {settings?.twitter_url   && <a href={settings.twitter_url}   target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">تويتر</a>}
            {settings?.youtube_url   && <a href={settings.youtube_url}   target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">يوتيوب</a>}
            {settings?.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">إنستغرام</a>}
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className={`sticky top-0 z-40 bg-card border-b border-border transition-all duration-300 ${scrolled?"shadow-lg shadow-black/10":""}`} dir="rtl">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16 gap-2">

            {/* Mobile hamburger */}
            <button onClick={()=>setMenuOpen(m=>!m)} aria-label="القائمة"
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors shrink-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={menuOpen?"x":"menu"} initial={{rotate:-90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:90,opacity:0}} transition={{duration:0.15}}>
                  {menuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Logo — dynamic from site_settings */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <motion.div whileHover={{scale:1.05}} whileTap={{scale:0.95}} className="shrink-0">
                {logoUrl
                  ? <img src={logoUrl} alt={siteName}
                      className="h-11 w-11 rounded-xl object-cover shadow-md shadow-primary/20"
                      onError={e => { (e.target as HTMLImageElement).style.display="none"; }}/>
                  : <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/25">
                      <span className="text-white font-black text-xl">ش</span>
                    </div>
                }
              </motion.div>
              <div className="min-w-0">
                <div className="text-[9px] text-muted-foreground font-medium leading-none mb-0.5">جريدة</div>
                <div className="font-black text-base leading-tight tracking-tight group-hover:text-primary transition-colors">
                  {siteName.replace("جريدة ","").replace("جريدة","") || "الشارع المصري"}
                </div>
                <div className="text-[9px] text-muted-foreground/70 font-medium leading-none mt-0.5 hidden sm:block">
                  {settings?.newspaper_slogan || "صحافة تضرم عقلك"}
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center overflow-x-auto scrollbar-hide px-2">
              {categories.slice(0,8).map(c=>(
                <Link key={c.id} to={`/category/${c.slug}`}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-muted hover:text-primary transition-all shrink-0 text-muted-foreground whitespace-nowrap">
                  {c.name_ar}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={()=>setSearchOpen(s=>!s)} aria-label="بحث"
                className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
                <Search className="w-4 h-4"/>
              </button>
              <button onClick={toggleTheme} aria-label="الوضع الليلي"
                className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
                {theme==="dark" ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
              </button>
              <Link to="/saved" aria-label="المحفوظات"
                className="w-9 h-9 rounded-xl hover:bg-muted hidden sm:flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
                <Bookmark className="w-4 h-4"/>
              </Link>
              {user && (
                <Link to="/G63-admin"
                  className="hidden sm:flex items-center gap-1.5 bg-primary text-white text-xs font-black px-3 py-1.5 rounded-xl hover:bg-primary/85 transition-colors shadow-sm">
                  <LayoutDashboard className="w-3.5 h-3.5"/><span className="hidden md:inline">لوحة التحكم</span>
                </Link>
              )}
              {user && (
                <Link to="/profile"
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm hover:bg-primary/80 transition-colors shadow-sm">
                  {user?.user_metadata?.display_name?.[0]?.toUpperCase()||user?.email?.[0]?.toUpperCase()||"U"}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.2}}
              className="border-t border-border overflow-hidden bg-card">
              <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex gap-2">
                <input ref={searchRef} value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                  placeholder="ابحث في الأخبار..."
                  className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                <button type="submit" className="bg-primary text-white px-5 rounded-xl font-bold text-sm hover:bg-primary/80 transition-colors">بحث</button>
                <button type="button" onClick={()=>setSearchOpen(false)}
                  className="w-10 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.25}}
              className="border-t border-border overflow-hidden bg-card lg:hidden">
              <div className="max-w-7xl mx-auto px-3 py-3 grid grid-cols-3 gap-2">
                {categories.map(c=>(
                  <Link key={c.id} to={`/category/${c.slug}`} onClick={()=>setMenuOpen(false)}
                    className="text-xs font-bold px-2 py-2.5 rounded-xl bg-muted hover:bg-primary hover:text-white text-center transition-all">
                    {c.name_ar}
                  </Link>
                ))}
              </div>
              <div className="px-3 pb-3 pt-1 flex items-center gap-2 border-t border-border/50">
                {user
                  ? <>
                      <Link to="/G63-admin" onClick={()=>setMenuOpen(false)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-black py-2.5 rounded-xl bg-primary text-white hover:bg-primary/85 transition-colors">
                        <LayoutDashboard className="w-3.5 h-3.5"/>لوحة التحكم
                      </Link>
                      <button onClick={()=>{signOut();setMenuOpen(false);}}
                        className="text-xs font-bold px-3 py-2.5 rounded-xl border border-border hover:bg-destructive/10 text-destructive transition-colors">
                        خروج
                      </button>
                    </>
                  : <Link to="/G63-admin/login" onClick={()=>setMenuOpen(false)}
                      className="flex-1 flex items-center justify-center text-xs font-black py-2.5 rounded-xl bg-primary text-white">
                      تسجيل الدخول
                    </Link>
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
