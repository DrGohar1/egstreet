import { NavLink } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/contexts/PermissionsContext";
import {
  LayoutDashboard, FileText, PenTool, Tag, AlertCircle,
  FileCode, Image, MessageSquare, Users, Mail, Megaphone,
  BarChart2, Settings, HardDrive, Globe, Rss, Bot,
  Zap, Shield, ChevronRight
} from "lucide-react";

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  to: string;
  permission?: PermissionKey;
  badge?: string;
  badgeColor?: string;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const ADMIN = "/G63-admin";

const GROUPS: SidebarGroup[] = [
  {
    title: "الرئيسي",
    items: [
      { label: "لوحة التحكم", icon: <LayoutDashboard className="w-4 h-4"/>, to: ADMIN },
      { label: "تحليلات", icon: <BarChart2 className="w-4 h-4"/>, to: `${ADMIN}/analytics`, permission: "analytics" },
    ]
  },
  {
    title: "المحتوى",
    items: [
      { label: "المقالات", icon: <FileText className="w-4 h-4"/>, to: `${ADMIN}/articles`, permission: "articles" },
      { label: "مقال جديد", icon: <PenTool className="w-4 h-4"/>, to: `${ADMIN}/articles/new`, permission: "articles.write", badgeColor: "bg-green-500" },
      { label: "الأقسام", icon: <Globe className="w-4 h-4"/>, to: `${ADMIN}/categories`, permission: "categories" },
      { label: "الوسوم", icon: <Tag className="w-4 h-4"/>, to: `${ADMIN}/tags`, permission: "tags" },
      { label: "الصفحات", icon: <FileCode className="w-4 h-4"/>, to: `${ADMIN}/pages`, permission: "pages" },
      { label: "عاجل", icon: <AlertCircle className="w-4 h-4"/>, to: `${ADMIN}/breaking`, permission: "breaking_news", badgeColor: "bg-red-500" },
    ]
  },
  {
    title: "الوسائط والتفاعل",
    items: [
      { label: "الوسائط", icon: <Image className="w-4 h-4"/>, to: `${ADMIN}/media`, permission: "media.upload" },
      { label: "التعليقات", icon: <MessageSquare className="w-4 h-4"/>, to: `${ADMIN}/comments`, permission: "comments" },
      { label: "المشتركون", icon: <Mail className="w-4 h-4"/>, to: `${ADMIN}/subscribers`, permission: "subscribers" },
    ]
  },
  {
    title: "الإعلانات",
    items: [
      { label: "الإعلانات", icon: <Megaphone className="w-4 h-4"/>, to: `${ADMIN}/advertisements`, permission: "ads" },
    ]
  },
  {
    title: "الذكاء الاصطناعي",
    items: [
      { label: "سحب الأخبار", icon: <Rss className="w-4 h-4"/>, to: `${ADMIN}/ai/scraper`, permission: "scraper" },
      { label: "أدوات AI", icon: <Bot className="w-4 h-4"/>, to: `${ADMIN}/ai/tools`, permission: "ai_tools" },
      { label: "أتمتة", icon: <Zap className="w-4 h-4"/>, to: `${ADMIN}/automation`, permission: "automation" },
    ]
  },
  {
    title: "الإدارة",
    items: [
      { label: "المستخدمون", icon: <Users className="w-4 h-4"/>, to: `${ADMIN}/users`, permission: "users" },
      { label: "الإعدادات", icon: <Settings className="w-4 h-4"/>, to: `${ADMIN}/settings`, permission: "settings" },
      { label: "النسخ الاحتياطي", icon: <HardDrive className="w-4 h-4"/>, to: `${ADMIN}/backup`, permission: "backup" },
    ]
  },
];

interface Props { collapsed?: boolean; }

export function AdminSidebar({ collapsed = false }: Props) {
  const { can } = usePermissions();

  return (
    <nav className="px-2 space-y-1" dir="rtl">
      {GROUPS.map(group => {
        const visibleItems = group.items.filter(item =>
          !item.permission || can(item.permission)
        );
        if (!visibleItems.length) return null;

        return (
          <div key={group.title} className="mb-1">
            {/* Group title */}
            {!collapsed && (
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 pt-3 pb-1 select-none">
                {group.title}
              </p>
            )}
            {collapsed && <div className="h-2"/>}

            {/* Items */}
            <div className="space-y-0.5">
              {visibleItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === ADMIN}
                  className={({ isActive }) => `
                    flex items-center gap-2.5 rounded-xl transition-all duration-150 group relative
                    ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"}
                    ${isActive
                      ? "bg-primary text-white shadow-sm shadow-primary/30"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator */}
                      {isActive && !collapsed && (
                        <ChevronRight className="w-3 h-3 absolute -right-2 text-primary hidden lg:block"/>
                      )}

                      {/* Icon */}
                      <span className={`shrink-0 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`}>
                        {item.icon}
                      </span>

                      {/* Label + badge */}
                      {!collapsed && (
                        <>
                          <span className="text-xs font-bold flex-1 leading-none">{item.label}</span>
                          {item.badgeColor && (
                            <span className={`w-2 h-2 rounded-full shrink-0 ${item.badgeColor} ${isActive ? "opacity-70" : ""}`}/>
                          )}
                        </>
                      )}

                      {/* Collapsed tooltip */}
                      {collapsed && (
                        <span className="absolute right-full mr-2 px-2 py-1 rounded-lg bg-popover border border-border text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-50">
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
