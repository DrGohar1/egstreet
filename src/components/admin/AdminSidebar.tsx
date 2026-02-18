import { LayoutDashboard, Users, FileText, Settings, BarChart3, Zap, Layers, Mail, MessageSquare, TrendingUp, FileCode, Tag, Megaphone, LogOut, Home, Newspaper } from "lucide-react";
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
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const mainItems = [
    { title: t("لوحة التحكم", "Dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("المقالات", "Articles"), url: "/dashboard/articles", icon: FileText },
    { title: t("الأقسام", "Categories"), url: "/dashboard/categories", icon: Layers },
    { title: t("الوسوم", "Tags"), url: "/dashboard/tags", icon: Tag },
    { title: t("أخبار عاجلة", "Breaking News"), url: "/dashboard/breaking", icon: Zap },
  ];

  const managementItems = [
    { title: t("المستخدمون", "Users"), url: "/dashboard/users", icon: Users },
    { title: t("التعليقات", "Comments"), url: "/dashboard/comments", icon: MessageSquare },
    { title: t("المشتركون", "Subscribers"), url: "/dashboard/subscribers", icon: Mail },
    { title: t("الإعلانات", "Advertisements"), url: "/dashboard/advertisements", icon: Megaphone },
  ];

  const systemItems = [
    { title: t("التحليلات", "Analytics"), url: "/dashboard/analytics", icon: TrendingUp },
    { title: t("الصفحات", "Pages"), url: "/dashboard/pages", icon: FileCode },
    { title: t("الإعدادات", "Settings"), url: "/dashboard/settings", icon: Settings },
  ];

  const renderGroup = (items: typeof mainItems, label: string) => (
    <div className="mb-2">
      {!collapsed && (
        <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
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
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-primary/10 hover:text-primary transition-all duration-200 text-sm"
                activeClassName="bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary hover:text-primary-foreground"
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );

  return (
    <Sidebar className={`${collapsed ? "w-14" : "w-64"} border-e-0`} collapsible="icon">
      <SidebarContent className="bg-sidebar-background flex flex-col h-full">
        {/* Logo Section */}
        {!collapsed && (
          <div className="p-5 pb-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <Newspaper className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-black text-sidebar-foreground tracking-tight">
                  {t("جريدة الشارع", "EgStreet")}
                </h2>
                <p className="text-[10px] text-sidebar-foreground/50">{t("لوحة التحكم", "Admin Panel")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu Groups */}
        <SidebarGroup className="flex-1 pt-4 px-2 space-y-1">
          <SidebarGroupContent>
            {renderGroup(mainItems, t("المحتوى", "Content"))}
            {renderGroup(managementItems, t("الإدارة", "Management"))}
            {renderGroup(systemItems, t("النظام", "System"))}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Actions */}
        {!collapsed && (
          <div className="p-3 border-t border-sidebar-border space-y-1">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-2 rounded-xl text-sidebar-foreground/60 hover:bg-muted hover:text-foreground transition-all text-sm"
            >
              <Home className="h-4 w-4" />
              <span>{t("الموقع الرئيسي", "Main Site")}</span>
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-4 py-2 rounded-xl text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all text-sm w-full"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("تسجيل الخروج", "Sign Out")}</span>
            </button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
