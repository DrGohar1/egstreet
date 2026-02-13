import { LayoutDashboard, Users, FileText, Settings, BarChart3, Zap, Layers } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const AdminSidebar = () => {
  const { t } = useLanguage();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const menuItems = [
    { title: t("الإحصائيات", "Overview"), url: "/dashboard", icon: BarChart3 },
    { title: t("المستخدمون", "Users"), url: "/dashboard/users", icon: Users },
    { title: t("المقالات", "Articles"), url: "/dashboard/articles", icon: FileText },
    { title: t("الأقسام", "Categories"), url: "/dashboard/categories", icon: Layers },
    { title: t("أخبار عاجلة", "Breaking News"), url: "/dashboard/breaking", icon: Zap },
    { title: t("الإعدادات", "Settings"), url: "/dashboard/settings", icon: Settings },
  ];

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <span>{t("لوحة التحكم", "Dashboard")}</span>
              </div>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
