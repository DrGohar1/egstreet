import { 
  LayoutDashboard, Users, FileText, Settings, Zap, Layers, Mail, 
  MessageSquare, Tag, Megaphone, LogOut, Home, Newspaper, 
  Brain, Rss, Shield, BarChart3, FileCode, Database
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const AdminSidebar = () => {
  const { t, language } = useLanguage();
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isRtl = language === "ar";

  const mainItems = [
    { title: t("لوحة التحكم", "Dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("المقالات", "Articles"), url: "/dashboard/articles", icon: FileText },
    { title: t("الأقسام", "Categories"), url: "/dashboard/categories", icon: Layers },
    { title: t("الوسوم", "Tags"), url: "/dashboard/tags", icon: Tag },
    { title: t("أخبار عاجلة", "Breaking News"), url: "/dashboard/breaking", icon: Zap },
  ];

  const managementItems = [
    { title: t("المستخدمون", "Users"), url: "/dashboard/users", icon: Users },
    { title: t("الصلاحيات", "Permissions"), url: "/dashboard/permissions", icon: Shield },
    { title: t("التعليقات", "Comments"), url: "/dashboard/comments", icon: MessageSquare },
    { title: t("المشتركون", "Subscribers"), url: "/dashboard/subscribers", icon: Mail },
    { title: t("الإعلانات", "Advertisements"), url: "/dashboard/advertisements", icon: Megaphone },
  ];

  const aiItems = [
    { title: t("سحب الأخبار", "News Scraper"), url: "/dashboard/ai/scraper", icon: Rss },
    { title: t("أدوات AI", "AI Tools"), url: "/dashboard/ai/tools", icon: Brain },
  ];

  const systemItems = [
    { title: t("التحليلات", "Analytics"), url: "/dashboard/analytics", icon: BarChart3 },
    { title: t("الصفحات", "Pages"), url: "/dashboard/pages", icon: FileCode },
    { title: t("النسخ الاحتياطي", "Backup"), url: "/dashboard/backup", icon: Database },
    { title: t("الإعدادات", "Settings"), url: "/dashboard/settings", icon: Settings },
  ];

  const renderGroup = (items: typeof mainItems, label: string) => (
    <div className="mb-1">
      {!collapsed && (
        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
          {label}
        </p>
      )}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton asChild>
              <NavLink
                to={item.url}
                end={item.url === "/dashboard"}
                className={`flex items-center ${isRtl ? "flex-row" : "flex-row"} gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 text-sm`}
                activeClassName="bg-primary text-primary-foreground font-bold shadow-sm hover:bg-primary hover:text-primary-foreground"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );

  return (
    <Sidebar className={`${collapsed ? "w-14" : "w-60"} border-e border-sidebar-border`} collapsible="icon">
      <SidebarContent className="bg-sidebar flex flex-col h-full overflow-hidden">
        {/* Logo */}
        {!collapsed && (
          <div className="p-4 pb-3 border-b border-sidebar-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm shrink-0">
                <Newspaper className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0 overflow-hidden">
                <h2 className="text-sm font-black text-sidebar-foreground truncate">
                  {t("جريدة الشارع", "EgStreet")}
                </h2>
                <p className="text-[10px] text-sidebar-foreground/50">{t("لوحة التحكم", "Dashboard")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        <SidebarGroup className="flex-1 pt-3 px-2 overflow-y-auto min-h-0">
          <SidebarGroupContent className="space-y-0.5">
            {renderGroup(mainItems, t("المحتوى", "Content"))}
            {renderGroup(managementItems, t("الإدارة", "Management"))}
            {renderGroup(aiItems, t("الذكاء الاصطناعي", "AI"))}
            {renderGroup(systemItems, t("النظام", "System"))}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom */}
        {!collapsed && (
          <div className="p-2 border-t border-sidebar-border space-y-0.5 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all text-sm"
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>{t("الموقع", "Site")}</span>
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all text-sm w-full"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{t("خروج", "Sign Out")}</span>
            </button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
