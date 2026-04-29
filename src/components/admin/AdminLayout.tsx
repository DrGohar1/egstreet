import { ReactNode, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar from "./AdminSidebar";
import {
  Menu, X, Bell, LogOut, User, Globe, ChevronDown,
  Sun, Moon, Home
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

interface AdminLayoutProps { children: ReactNode; }

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const { role } = usePermissions();
  const { settings } = useSiteSettings();
  const { theme, toggleTheme } = useTheme?.() || { theme:"light", toggleTheme:()=>{} };
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profile, setProfile] = useState<{display_name?:string; avatar_url?:string} | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("display_name,avatar_url").eq("id", user.id).maybeSingle()
        .then(({ data }) => setProfile(data));
    }
  }, [user?.id]);

  // Close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate("/G63-admin/login", { replace: true });
  }, [user]);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Admin";
  const siteName    = settings?.site_name_ar || "الشارع المصري";
  const logoUrl     = settings?.logo_url || "";

  const roleLabel: Record<string, string> = {
    super_admin:      "سوبر أدمن",
    editor_in_chief:  "رئيس التحرير",
    journalist:       "صحفي",
    ads_manager:      "مدير الإعلانات",
  };

  const roleBadge: Record<string, string> = {
    super_admin:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    editor_in_chief: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    journalist:      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    ads_manager:     "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden" dir="rtl">

      {/* ══ DESKTOP SIDEBAR (always visible) ══ */}
      <aside className={`
        hidden lg:flex flex-col border-l border-border bg-card
        transition-all duration-300 shrink-0
        ${sidebarCollapsed ? "w-16" : "w-60"}
      `}>
        {/* Sidebar header */}
        <div className={`flex items-center border-b border-border p-3 gap-2 h-14 ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
          {!sidebarCollapsed && (
            <Link to="/" target="_blank" className="flex items-center gap-2 group min-w-0">
              {logoUrl
                ? <img src={logoUrl} alt={siteName} className="w-8 h-8 rounded-lg object-cover shrink-0"/>
                : <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-sm shrink-0">ش</div>
              }
              <div className="min-w-0">
                <div className="text-xs font-black leading-tight truncate group-hover:text-primary transition-colors">{siteName}</div>
                <div className="text-[9px] text-muted-foreground">لوحة التحكم</div>
              </div>
            </Link>
          )}
          <button onClick={() => setSidebarCollapsed(c => !c)}
            className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground shrink-0">
            <Menu className="w-4 h-4"/>
          </button>
        </div>

        {/* Sidebar nav */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
          <AdminSidebar collapsed={sidebarCollapsed}/>
        </div>

        {/* User info at bottom */}
        {!sidebarCollapsed && (
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary"/>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate">{displayName}</div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${roleBadge[role||""] || "bg-muted text-muted-foreground"}`}>
                  {roleLabel[role||""] || role || "مستخدم"}
                </span>
              </div>
              <button onClick={signOut} className="w-7 h-7 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors text-muted-foreground" title="تسجيل خروج">
                <LogOut className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ══ MOBILE SIDEBAR DRAWER ══ */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}/>
            <motion.aside
              initial={{x:240}} animate={{x:0}} exit={{x:240}}
              transition={{type:"spring",stiffness:300,damping:30}}
              className="fixed top-0 right-0 h-full w-64 z-50 bg-card border-l border-border flex flex-col lg:hidden shadow-2xl">
              {/* Mobile sidebar header */}
              <div className="flex items-center justify-between border-b border-border p-3 h-14">
                <Link to="/" target="_blank" className="flex items-center gap-2">
                  {logoUrl
                    ? <img src={logoUrl} alt={siteName} className="w-7 h-7 rounded-lg object-cover"/>
                    : <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-black text-xs">ش</div>
                  }
                  <span className="text-sm font-black">{siteName}</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center">
                  <X className="w-4 h-4"/>
                </button>
              </div>
              {/* Nav */}
              <div className="flex-1 overflow-y-auto py-2">
                <AdminSidebar collapsed={false}/>
              </div>
              {/* User */}
              <div className="border-t border-border p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{displayName}</div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${roleBadge[role||""] || "bg-muted text-muted-foreground"}`}>
                      {roleLabel[role||""] || role}
                    </span>
                  </div>
                  <button onClick={signOut} className="w-7 h-7 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors text-muted-foreground">
                    <LogOut className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══ MAIN CONTENT ══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ─ Top Nav Bar ─ */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
          {/* Mobile menu toggle */}
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
            <Menu className="w-5 h-5"/>
          </button>

          {/* Breadcrumb title */}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black truncate text-foreground">لوحة التحكم</h2>
            <p className="text-[10px] text-muted-foreground hidden sm:block">{siteName}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* View site */}
            <Link to="/" target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground">
              <Globe className="w-3.5 h-3.5"/>
              <span className="hidden md:inline">الموقع</span>
            </Link>

            {/* Theme toggle */}
            <button onClick={toggleTheme}
              className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground">
              {theme==="dark" ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
            </button>

            {/* User menu */}
            <div className="relative">
              <button onClick={() => setUserMenuOpen(m => !m)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-muted transition-colors">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary"/>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold leading-tight">{displayName}</div>
                  <div className={`text-[9px] font-bold px-1 rounded ${roleBadge[role||""] || "text-muted-foreground"}`}>
                    {roleLabel[role||""] || role}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground"/>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div initial={{opacity:0,scale:0.95,y:-5}} animate={{opacity:1,scale:1,y:0}}
                    exit={{opacity:0,scale:0.95,y:-5}} transition={{duration:0.1}}
                    className="absolute left-0 top-full mt-2 w-48 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="p-3 border-b border-border">
                      <div className="font-bold text-sm">{displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${roleBadge[role||""] || "bg-muted text-muted-foreground"}`}>
                        {roleLabel[role||""] || role}
                      </span>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-muted transition-colors w-full text-right">
                        <User className="w-3.5 h-3.5"/> ملف شخصي
                      </Link>
                      <Link to="/" target="_blank" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-muted transition-colors w-full text-right">
                        <Globe className="w-3.5 h-3.5"/> الموقع
                      </Link>
                      <div className="border-t border-border my-1"/>
                      <button onClick={() => { setUserMenuOpen(false); signOut(); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-right text-muted-foreground">
                        <LogOut className="w-3.5 h-3.5"/> تسجيل الخروج
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ─ Page Content ─ */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
