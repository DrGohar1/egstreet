import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Moon, Sun, User, LogIn, Bookmark, Menu, X, Newspaper, ChevronDown, Globe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

interface Category { id:string; name_ar:string; name_en:string; slug:string; }

export default function Header() {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme?.() || { theme:"light", toggleTheme:()=>{} };
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [searchQ,     setSearchQ]     = useState("");
  const [scrolled,    setScrolled]    = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    supabase.from("categories").select("id,name_ar,name_en,slug").order("sort_order").limit(10)
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
      {/* ── Top bar ── */}
      <div className="bg-primary text-white text-[10px] hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between py-1">
          <span>{today}</span>
          <div className="flex items-center gap-4">
            <button onClick={()=>setLanguage(language==="ar"?"en":"ar")} className="flex items-center gap-1 hover:opacity-80">
              <Globe className="w-3 h-3"/>{language==="ar"?"English":"العربية"}
            </button>
            {user
              ? <Link to="/profile" className="hover:opacity-80 flex items-center gap-1"><User className="w-3 h-3"/>حسابي</Link>
              : <Link to="/auth" className="hover:opacity-80 flex items-center gap-1"><LogIn className="w-3 h-3"/>تسجيل الدخول</Link>
            }
          </div>
        </div>
      </div>

      {/* ── Main header ── */}
      <header className={`sticky top-0 z-40 bg-card border-b border-border transition-shadow duration-200 ${scrolled?"shadow-md":""}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 gap-3">

            {/* Mobile menu */}
            <button onClick={()=>setMenuOpen(m=>!m)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors shrink-0">
              {menuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <Newspaper className="w-4 h-4 text-white"/>
              </div>
              <div className="hidden sm:block">
                <div className="font-black text-base leading-none tracking-tight">الشارع المصري</div>
                <div className="text-[9px] text-muted-foreground font-medium">EG STREET NEWS</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center overflow-x-auto">
              {categories.slice(0,7).map(c=>(
                <Link key={c.id} to={`/category/${c.slug}`}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-muted hover:text-primary transition-all shrink-0 text-muted-foreground">
                  {c.name_ar}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={()=>setSearchOpen(s=>!s)}
                className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
                <Search className="w-4 h-4"/>
              </button>
              <button onClick={toggleTheme}
                className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
                {theme==="dark" ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
              </button>
              <Link to="/saved" className="w-9 h-9 rounded-lg hover:bg-muted hidden sm:flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
                <Bookmark className="w-4 h-4"/>
              </Link>
              {user
                ? <Link to="/profile" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm hover:bg-primary/80 transition-colors">
                    {user.email?.[0]?.toUpperCase()||"U"}
                  </Link>
                : <Link to="/auth" className="text-xs font-black bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/80 transition-colors hidden sm:block">
                    دخول
                  </Link>
              }
            </div>
          </div>
        </div>

        {/* ── Search overlay ── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
              className="border-t border-border overflow-hidden bg-card">
              <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
                <input ref={searchRef} value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                  placeholder="ابحث في الأخبار..."
                  className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                <button type="submit" className="bg-primary text-white px-5 rounded-xl font-bold text-sm hover:bg-primary/80 transition-colors">بحث</button>
                <button type="button" onClick={()=>setSearchOpen(false)} className="w-10 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
              className="border-t border-border overflow-hidden bg-card lg:hidden">
              <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-3 gap-2">
                {categories.map(c=>(
                  <Link key={c.id} to={`/category/${c.slug}`} onClick={()=>setMenuOpen(false)}
                    className="text-xs font-bold px-3 py-2.5 rounded-xl bg-muted hover:bg-primary hover:text-white text-center transition-all">
                    {c.name_ar}
                  </Link>
                ))}
              </div>
              <div className="px-4 pb-3 flex items-center gap-2">
                {!user && <Link to="/auth" onClick={()=>setMenuOpen(false)}
                  className="flex-1 text-center text-xs font-black bg-primary text-white py-2.5 rounded-xl hover:bg-primary/80 transition-colors">
                  تسجيل الدخول
                </Link>}
                {user && <button onClick={()=>{signOut();setMenuOpen(false);}}
                  className="flex-1 text-center text-xs font-bold border border-border py-2.5 rounded-xl hover:bg-muted transition-colors text-red-500">
                  تسجيل الخروج
                </button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
