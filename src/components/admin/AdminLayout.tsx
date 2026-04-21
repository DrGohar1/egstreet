import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./AdminSidebar";
import NotificationsPanel from "./NotificationsPanel";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isRtl = language === "ar";

  useEffect(() => {
    if (!loading && !user) {
      // Pass current path so Auth can redirect back after login
      navigate("/auth", { state: { from: location.pathname }, replace: true });
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">{t("جارٍ التحقق...", "Verifying...")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">{t("جارٍ التوجيه...", "Redirecting...")}</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30" dir={isRtl ? "rtl" : "ltr"}>
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <p className="text-xs text-muted-foreground hidden md:block">{today}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <LanguageToggle />
              <NotificationsPanel />
              <div className="flex items-center gap-2 ps-2 ms-1 border-s border-border">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                    {user.email?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-xs font-semibold text-foreground leading-tight">{user.email?.split("@")[0]}</p>
                  <p className="text-[10px] text-muted-foreground">{t("مدير", "Admin")}</p>
                </div>
              </div>
            </div>
          </header>
          <ErrorBoundary>
          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
