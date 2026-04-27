import { ReactNode, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "./AdminSidebar";
import NotificationsPanel from "./NotificationsPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Menu, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const roleLabels: Record<string,string> = {
  super_admin: "سوبر أدمن", editor_in_chief: "رئيس التحرير",
  journalist: "صحفي", ads_manager: "مدير إعلانات",
};
const roleColors: Record<string,string> = {
  super_admin: "text-red-500", editor_in_chief: "text-blue-500",
  journalist: "text-green-500", ads_manager: "text-yellow-500",
};

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, profile, loading, signOut } = useAuth();
  const { role } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setSidebarOpen(false); setUserMenuOpen(false); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    if (!loading && !user) navigate("/G63-admin/login", { state: { from: location.pathname }, replace: true });
  }, [user, loading, navigate, location]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      <p className="text-xs text-muted-foreground">جارٍ التحقق...</p>
    </div>
  );
  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-primary"/>
    </div>
  );

  const displayName = profile?.display_name || profile?.username || user.email?.split("@")[0] || "مستخدم";
  const initials = displayName.charAt(0).toUpperCase();
  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen flex bg-muted/30" dir="rtl">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-3 sm:px-4 shrink-0 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5"/>
            </button>
            <p className="text-xs text-muted-foreground hidden md:block">{today}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle/>
            <NotificationsPanel/>
            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 ps-2 ms-1 border-s border-border hover:bg-muted/50 px-2 py-1.5 rounded-xl transition-colors">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-foreground leading-tight">{displayName}</p>
                  <p className={cn("text-[9px] font-bold leading-tight", roleColors[role || ""] || "text-muted-foreground")}>
                    {roleLabels[role || ""] || role || "مستخدم"}
                  </p>
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", userMenuOpen && "rotate-180")}/>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute top-full mt-2 end-0 w-52 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/30">
                    <p className="text-sm font-black">{displayName}</p>
                    <p className={cn("text-xs font-bold", roleColors[role || ""] || "text-muted-foreground")}>
                      {roleLabels[role || ""] || "مستخدم"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{user.email}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button onClick={() => { navigate("/G63-admin/profile"); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-muted transition-colors text-right">
                      <User className="w-4 h-4 text-muted-foreground"/>
                      <span>الملف الشخصي</span>
                    </button>
                    <button onClick={() => { navigate("/G63-admin/settings"); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-muted transition-colors text-right">
                      <Settings className="w-4 h-4 text-muted-foreground"/>
                      <span>الإعدادات</span>
                    </button>
                    <div className="border-t border-border my-1"/>
                    <button onClick={() => { signOut(); navigate("/"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors font-bold text-right">
                      <LogOut className="w-4 h-4"/>
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <ErrorBoundary>
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto min-h-0">
            {children}
          </main>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default AdminLayout;
