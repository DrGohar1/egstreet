import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./AdminSidebar";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="hidden md:block">
                <p className="text-xs text-muted-foreground">{today}</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center max-w-md flex-1 mx-8">
              <div className="relative w-full">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("بحث في لوحة التحكم...", "Search dashboard...")}
                  className="ps-10 h-9 bg-muted/50 border-0 focus-visible:ring-1 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle />
              <button className="relative p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-primary rounded-full" />
              </button>
              <div className="flex items-center gap-2 ps-2 ms-2 border-s border-border">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
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

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
