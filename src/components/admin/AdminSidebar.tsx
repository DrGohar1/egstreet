import { NavLink, useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/contexts/PermissionsContext";
import {
  LayoutDashboard, FileText, PenTool, Tag, AlertCircle,
  FileCode, Image, MessageSquare, Users, Mail, Megaphone,
  BarChart2, Settings, HardDrive, Globe, Rss, Bot,
  Zap, Shield, ChevronDown, ChevronRight, Clock, CheckCircle, Eye
} from "lucide-react";
import { useState } from "react";

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
  groupPermission?: PermissionKey;
  items: SidebarItem[];
  // sub-groups: expandable nested items
  subGroups?: {
    label: string;
    icon: React.ReactNode;
    to: string;
    permission?: PermissionKey;
    children?: SidebarItem[];
  }[];
}

const ADMIN = "/G63-admin";

const GROUPS: SidebarGroup[] = [
  {
    title: "الرئيسي",
    items: [
      { label: "لوحة التحكم", icon: <LayoutDashboard className="w-4 h-4"/>, to: ADMIN },
      { label: "تحليلات",     icon: <BarChart2 className="w-4 h-4"/>,      to: `${ADMIN}/analytics`, permission: "analytics" },
    ]
  },
  {
    title: "المحتوى",
    items: [
      { label: "الأقسام",  icon: <Globe className="w-4 h-4"/>,    to: `${ADMIN}/categories`,  permission: "categories" },
      { label: "الوسوم",   icon: <Tag className="w-4 h-4"/>,      to: `${ADMIN}/tags`,        permission: "tags" },
      { label: "الصفحات",  icon: <FileCode className="w-4 h-4"/>, to: `${ADMIN}/pages`,       permission: "pages" },
      { label: "عاجل",     icon: <AlertCircle className="w-4 h-4"/>, to: `${ADMIN}/breaking`, permission: "breaking_news", badgeColor: "bg-red-500" },
    ]
  },
  {
    title: "الوسائط والتفاعل",
    items: [
      { label: "الوسائط",    icon: <Image className="w-4 h-4"/>,        to: `${ADMIN}/media`,       permission: "media.upload" },
      { label: "التعليقات",  icon: <MessageSquare className="w-4 h-4"/>, to: `${ADMIN}/comments`,   permission: "comments" },
      { label: "المشتركون",  icon: <Mail className="w-4 h-4"/>,         to: `${ADMIN}/subscribers`, permission: "subscribers" },
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
      { label: "سحب الأخبار", icon: <Rss className="w-4 h-4"/>,  to: `${ADMIN}/ai/scraper`,  permission: "scraper" },
      { label: "أدوات AI",    icon: <Bot className="w-4 h-4"/>,  to: `${ADMIN}/ai/tools`,    permission: "ai_tools" },
      { label: "أتمتة",       icon: <Zap className="w-4 h-4"/>,  to: `${ADMIN}/automation`,  permission: "automation" },
    ]
  },
  {
    title: "الإدارة",
    items: [
      { label: "المستخدمون", icon: <Users className="w-4 h-4"/>,    to: `${ADMIN}/users`,    permission: "users" },
      { label: "الإعدادات",  icon: <Settings className="w-4 h-4"/>, to: `${ADMIN}/settings`, permission: "settings" },
      { label: "نسخ احتياطي",icon: <HardDrive className="w-4 h-4"/>,to: `${ADMIN}/backup`,   permission: "backup" },
      { label: "الصلاحيات",  icon: <Shield className="w-4 h-4"/>,  to: `${ADMIN}/users`,    permission: "permissions" },
    ]
  },
];

// ── Articles sub-items ─────────────────────────────────────
const ARTICLES_CHILDREN: SidebarItem[] = [
  { label: "كل المقالات",        icon: <FileText className="w-3.5 h-3.5"/>,    to: `${ADMIN}/articles`,            permission: "articles" },
  { label: "مقال جديد",          icon: <PenTool className="w-3.5 h-3.5"/>,     to: `${ADMIN}/articles/new`,        permission: "articles.write",  badgeColor: "bg-green-500" },
  { label: "مسوداتي",            icon: <Clock className="w-3.5 h-3.5"/>,       to: `${ADMIN}/articles?status=draft`, permission: "articles" },
  { label: "في انتظار المراجعة", icon: <Eye className="w-3.5 h-3.5"/>,         to: `${ADMIN}/articles?status=pending`, permission: "articles.review",  badgeColor: "bg-amber-400" },
  { label: "تمت المراجعة",       icon: <CheckCircle className="w-3.5 h-3.5"/>, to: `${ADMIN}/articles?status=published`, permission: "articles.review" },
];

const linkClass = (active: boolean) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
    active
      ? "bg-primary text-white shadow-sm shadow-primary/20"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;

export default function AdminSidebar() {
  const { can } = usePermissions();
  const location = useLocation();
  const [articlesOpen, setArticlesOpen] = useState(
    location.pathname.includes("/articles")
  );

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1" dir="rtl">
      {/* ── Articles section (special expandable) ── */}
      {can("articles") && (
        <div className="mb-1">
          <button
            onClick={() => setArticlesOpen(o => !o)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
              location.pathname.includes("/articles")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}>
            <FileText className="w-4 h-4 shrink-0"/>
            <span className="flex-1 text-start">المقالات</span>
            {articlesOpen
              ? <ChevronDown className="w-3.5 h-3.5 opacity-60"/>
              : <ChevronRight className="w-3.5 h-3.5 opacity-60"/>}
          </button>

          {articlesOpen && (
            <div className="mr-3 mt-0.5 border-r-2 border-border/60 pr-3 space-y-0.5">
              {ARTICLES_CHILDREN.filter(item => !item.permission || can(item.permission)).map(item => (
                <NavLink key={item.to} to={item.to} end={item.to === `${ADMIN}/articles`}
                  className={({ isActive }) => linkClass(isActive) + " !py-1.5 !text-xs"}>
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.badgeColor && (
                    <span className={`w-1.5 h-1.5 rounded-full ${item.badgeColor}`}/>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Other groups ── */}
      {GROUPS.map(group => {
        const visible = group.items.filter(i => !i.permission || can(i.permission));
        if (visible.length === 0) return null;
        return (
          <div key={group.title} className="space-y-0.5">
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest px-3 pt-3 pb-1">
              {group.title}
            </p>
            {visible.map(item => (
              <NavLink key={item.to} to={item.to}
                end={item.to === ADMIN}
                className={({ isActive }) => linkClass(isActive)}>
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badgeColor && (
                  <span className={`w-1.5 h-1.5 rounded-full ${item.badgeColor}`}/>
                )}
                {item.badge && (
                  <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-black">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
