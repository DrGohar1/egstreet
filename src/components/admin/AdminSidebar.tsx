import {
  LayoutDashboard, Users, FileText, Settings, Zap, Layers, Mail,
  MessageSquare, Tag, Megaphone, LogOut, Home, Newspaper,
  Brain, Rss, Shield, BarChart3, FileCode, Database
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const ADMIN = "/Gadmin";

const AdminSidebar = () => {
  const { t, language } = useLanguage();
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const { unreadCount } = useNotifications();
  const collapsed = state === "collapsed";

  const mainItems = [
    { title: t("لوحة التحكم", "Dashboard"), url: ADMIN, icon: LayoutDashboard },
    { title: t("المقالات", "Articles"), url: `${ADMIN}/articles`, icon: FileText },
    { title: t("الأقسام", "Categories"), url: `${ADMIN}/categories`, icon: Layers },
    { title: t("الوسوم", "Tags"), url: `${ADMIN}/tags`, icon: Tag },
    { title: t("أخبار عاجلة", "Breaking News"), url: `${ADMIN}/breaking`, icon: Zap },
  ];

  const managementItems = [
    { title: t("المستخدمون", "Users"), url: `${ADMIN}/users`, icon: Users },
    { title: t("الصلاحيات", "Permissions"), url: `${ADMIN}/permissions`, icon: Shield },
    { title: t("التعليقات", "Comments"), url: `${ADMIN}/comments`, icon: MessageSquare },
    { title: t("المشتركون", "Subscribers"), url: `${ADMIN}/subscribers`, icon: Mail },
    { title: t("الإعلانات", "Advertisements"), url: `${ADMIN}/advertisements`, icon: Megaphone },
  ];

  const aiItems = [
    { title: t("سحب الأخبار", "News Scraper"), url: `${ADMIN}/ai/scraper`, icon: Rss },
    { title: t("أدوات AI", "AI Tools"), url: `${ADMIN}/ai/tools`, icon: Brain },
  ];

  const systemItems = [
    { title: t("التحليلات", "Analytics"), url: `${ADMIN}/analytics`, icon: BarChart3 },
    { title: t("الصفحات", "Pages"), url: `${ADMIN}/pages`, icon: FileCode },
    { title: t("النسخ الاحتياطي", "Backup"), url: `${ADMIN}/backup`, icon: Database },
    { title: t("الإعدادات", "Settings"), url: `${ADMIN}/settings`, icon: Settings },
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
                end={item.url === ADMIN}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 text-sm ${collapsed ? "justify-center" : ""}`}
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
    <Sidebar
      className={`${collapsed ? "w-14" : "w-60"} border-e border-sidebar-border`}
      collapsible="icon"
      side={language === "ar" ? "right" : "left"}
    >
      <SidebarContent className="bg-sidebar flex flex-col h-full overflow-hidden">
        {/* Logo */}
        <div className={`p-4 pb-3 border-b border-sidebar-border shrink-0 flex items-center ${collapsed ? "justify-center" : "gap-2.5"}`}>
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm shrink-0">
            <Newspaper className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <h2 className="text-sm font-black text-sidebar-foreground truncate">
                {t("جريدة الشارع", "EgStreet")}
              </h2>
              <p className="text-[10px] text-sidebar-foreground/50">{t("لوحة التحكم", "Dashboard")}</p>
            </div>
          )}
        </div>

        {/* Unread badge banner */}
        {!collapsed && unreadCount > 0 && (
          <div className="mx-2 mt-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="text-xs font-bold text-primary">
              {unreadCount} {t("إشعار جديد", "new notification")}
            </span>
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
        <div className="p-2 border-t border-sidebar-border space-y-0.5 shrink-0">
          {!collapsed && (
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all text-sm"
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>{t("الموقع", "Site")}</span>
            </Link>
          )}
          <button
            onClick={signOut}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all text-sm w-full ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{t("خروج", "Sign Out")}</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
