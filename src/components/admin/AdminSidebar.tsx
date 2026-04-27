import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, Layers, Tag, Zap, Users, Shield,
  MessageSquare, Mail, Megaphone, Rss, Brain, BarChart3,
  FileCode, Database, Settings, X, LogOut, Newspaper,
  Plus, Cog, Image
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/contexts/PermissionsContext";
import { cn } from "@/lib/utils";

const ADMIN = "/G63-admin";

const roleColors: Record<string,string> = {
  super_admin:"bg-red-500", editor_in_chief:"bg-blue-500",
  journalist:"bg-green-500", ads_manager:"bg-yellow-500",
};
const roleLabels: Record<string,string> = {
  super_admin:"سوبر أدمن", editor_in_chief:"رئيس التحرير",
  journalist:"صحفي", ads_manager:"مدير إعلانات",
};

interface NavItem {
  key: string;
  perm?: PermissionKey;
  label: string;
  url: string;
  icon: React.ElementType;
  always?: boolean;
  end?: boolean;
  accent?: boolean;
}

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "الرئيسية",
    items: [
      { key:"dashboard", label:"لوحة التحكم", url:ADMIN, icon:LayoutDashboard, always:true, end:true },
      { key:"analytics",  perm:"analytics", label:"التحليلات", url:`${ADMIN}/analytics`, icon:BarChart3 },
    ]
  },
  {
    label: "المحتوى",
    items: [
      { key:"articles",   perm:"articles",      label:"المقالات",     url:`${ADMIN}/articles`,     icon:FileText },
      { key:"newarticle", perm:"articles.write", label:"مقال جديد",    url:`${ADMIN}/articles/new`, icon:Plus, accent:true },
      { key:"categories", perm:"categories",     label:"الأقسام",      url:`${ADMIN}/categories`,   icon:Layers },
      { key:"tags",       perm:"tags",           label:"الوسوم",       url:`${ADMIN}/tags`,         icon:Tag },
      { key:"breaking",   perm:"breaking_news",  label:"أخبار عاجلة",  url:`${ADMIN}/breaking`,     icon:Zap },
      { key:"pages",      perm:"pages",          label:"الصفحات",      url:`${ADMIN}/pages`,        icon:FileCode },
    ]
  },
  {
    label: "الوسائط",
    items: [
      { key:"media", perm:"media.upload", label:"رفع الوسائط", url:`${ADMIN}/media`, icon:Image },
    ]
  },
  {
    label: "التواصل",
    items: [
      { key:"comments",    perm:"comments",     label:"التعليقات",   url:`${ADMIN}/comments`,      icon:MessageSquare },
      { key:"subscribers", perm:"subscribers",  label:"المشتركون",   url:`${ADMIN}/subscribers`,   icon:Mail },
      { key:"ads",         perm:"ads",          label:"الإعلانات",   url:`${ADMIN}/advertisements`,icon:Megaphone },
    ]
  },
  {
    label: "الأدوات",
    items: [
      { key:"scraper",    perm:"scraper",    label:"سحب RSS",     url:`${ADMIN}/ai/scraper`, icon:Rss },
      { key:"ai_tools",   perm:"ai_tools",   label:"أدوات AI",    url:`${ADMIN}/ai/tools`,   icon:Brain },
      { key:"automation", perm:"automation", label:"الأتمتة",     url:`${ADMIN}/automation`, icon:Cog },
    ]
  },
  {
    label: "الإدارة",
    items: [
      { key:"users",       perm:"users",       label:"المستخدمون",       url:`${ADMIN}/users`,       icon:Users },
      { key:"permissions", perm:"permissions", label:"الصلاحيات",        url:`${ADMIN}/permissions`, icon:Shield },
      { key:"backup",      perm:"backup",      label:"النسخ الاحتياطي",  url:`${ADMIN}/backup`,      icon:Database },
      { key:"settings",    perm:"settings",    label:"الإعدادات",        url:`${ADMIN}/settings`,    icon:Settings },
    ]
  },
];

const AdminSidebar = ({ open, onClose }: { open?:boolean; onClose?:()=>void }) => {
  const { signOut, user, profile } = useAuth();
  const { role, can, loading } = usePermissions();
  const navigate = useNavigate();

  const displayName = profile?.display_name || profile?.username || user?.email?.split("@")[0] || "مستخدم";

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose}/>}
      <aside className={cn(
        "fixed top-0 bottom-0 z-50 w-64 bg-card border-e border-border flex flex-col transition-transform duration-300 shadow-xl",
        "lg:static lg:translate-x-0 lg:shadow-none",
        "right-0",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-white"/>
            </div>
            <div>
              <div className="font-black text-sm">الشارع المصري</div>
              <div className="text-[10px] text-muted-foreground">لوحة التحكم</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* User badge */}
        {!loading && user && (
          <div className="px-4 py-3 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0", roleColors[role||""] || "bg-primary")}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{displayName}</div>
                <span className={cn("text-[9px] text-white px-1.5 py-0.5 rounded-full inline-block mt-0.5", roleColors[role||""] || "bg-primary")}>
                  {roleLabels[role||""] || role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {groups.map(group => {
            // Hide entire group if no items are visible
            const hasVisible = group.items.some(item => item.always || (item.perm && can(item.perm)));
            if (!hasVisible) return null;
            return (
              <div key={group.label}>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wider px-3 mb-1">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const allowed = item.always || (item.perm ? can(item.perm) : false);
                    if (item.always || allowed) {
                      return (
                        <NavLink key={item.url} to={item.url} end={item.end} onClick={onClose}
                          className={({isActive}) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                            item.accent && !isActive
                              ? "text-primary hover:bg-primary/10 border border-dashed border-primary/30"
                              : isActive
                                ? "bg-primary text-white shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}>
                          <item.icon className="w-4 h-4 shrink-0"/>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.accent && <Plus className="w-3 h-3 opacity-60"/>}
                        </NavLink>
                      );
                    } else {
                      // No permission — hide completely
                      return null;
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-1 shrink-0">
          <NavLink to="/" target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted transition-colors">
            <Newspaper className="w-3.5 h-3.5"/> عرض الموقع
          </NavLink>
          <button onClick={() => { signOut(); navigate("/"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-500/10 transition-colors font-bold">
            <LogOut className="w-3.5 h-3.5"/> تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
};
export default AdminSidebar;
