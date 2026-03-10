import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./AdminSidebar";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  const today = new Date().toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30" dir={language === "ar" ? "rtl" : "ltr"}>
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <p className="text-xs text-muted-foreground hidden md:block">{today}</p>
            </div>

            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <LanguageToggle />
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 end-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
              </button>
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

          {/* Content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
