import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, Layers, Tag, Zap, Users, Shield,
  MessageSquare, Mail, Megaphone, Rss, Brain, BarChart3,
  FileCode, Database, Settings, X, LogOut, Newspaper,
  ChevronRight, Plus, Cog
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const ADMIN = "/Gadmin";

const AdminSidebar = ({ open, onClose }: { open?:boolean; onClose?:()=>void }) => {
  const { t, language } = useLanguage();
  const { signOut, user } = useAuth();
  const { role, can, loading } = usePermissions();
  const navigate = useNavigate();

  const roleColors: Record<string,string> = {
    super_admin:"bg-red-500", editor_in_chief:"bg-blue-500",
    journalist:"bg-green-500", ads_manager:"bg-yellow-500",
  };
  const roleLabels: Record<string,string> = {
    super_admin:"سوبر أدمن", editor_in_chief:"رئيس التحرير",
    journalist:"صحفي", ads_manager:"مدير إعلانات",
  };

  const groups = [
    {
      label: "الرئيسية",
      items: [
        { key:"dashboard", label:t("لوحة التحكم","Dashboard"), url:ADMIN,                     icon:LayoutDashboard, always:true, end:true },
        { key:"analytics", label:t("التحليلات","Analytics"),   url:`${ADMIN}/analytics`,       icon:BarChart3 },
      ]
    },
    {
      label: "المحتوى",
      items: [
        { key:"articles",   label:t("المقالات","Articles"),     url:`${ADMIN}/articles`,       icon:FileText },
        { key:"articles",   label:t("مقال جديد","New Article"), url:`${ADMIN}/articles/new`,   icon:Plus, accent:true },
        { key:"categories", label:t("الأقسام","Categories"),    url:`${ADMIN}/categories`,     icon:Layers },
        { key:"tags",       label:t("الوسوم","Tags"),           url:`${ADMIN}/tags`,           icon:Tag },
        { key:"breaking",   label:t("أخبار عاجلة","Breaking"),  url:`${ADMIN}/breaking`,       icon:Zap },
        { key:"pages",      label:t("الصفحات","Pages"),         url:`${ADMIN}/pages`,          icon:FileCode },
      ]
    },
    {
      label: "التواصل",
      items: [
        { key:"comments",     label:t("التعليقات","Comments"),     url:`${ADMIN}/comments`,     icon:MessageSquare },
        { key:"subscribers",  label:t("المشتركون","Subscribers"),  url:`${ADMIN}/subscribers`,  icon:Mail },
        { key:"ads",          label:t("الإعلانات","Ads"),          url:`${ADMIN}/advertisements`,icon:Megaphone },
      ]
    },
    {
      label: "الأدوات",
      items: [
        { key:"ai",    label:t("سحب RSS","RSS Scraper"),        url:`${ADMIN}/ai/scraper`,    icon:Rss },
        { key:"ai",    label:t("أدوات AI","AI Tools"),         url:`${ADMIN}/ai/tools`,      icon:Brain },
        { key:"ai",    label:t("الأتمتة","Automation"),        url:`${ADMIN}/automation`,    icon:Cog },
      ]
    },
    {
      label: "الإدارة",
      items: [
        { key:"users",       label:t("المستخدمون","Users"),    url:`${ADMIN}/users`,         icon:Users },
        { key:"permissions", label:t("الصلاحيات","Permissions"),url:`${ADMIN}/permissions`,  icon:Shield },
        { key:"backup",      label:t("النسخ الاحتياطي","Backup"),url:`${ADMIN}/backup`,      icon:Database },
        { key:"settings",    label:t("الإعدادات","Settings"),   url:`${ADMIN}/settings`,     icon:Settings },
      ]
    },
  ];

  return (
    <>
      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose}/>}

      <aside className={cn(
        "fixed top-0 bottom-0 z-50 w-64 bg-card border-e border-border flex flex-col transition-transform duration-300 shadow-xl",
        "lg:static lg:translate-x-0 lg:shadow-none",
        language==="ar" ? "right-0" : "left-0",
        open ? "translate-x-0" : (language==="ar" ? "translate-x-full" : "-translate-x-full")
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

        {/* User */}
        {!loading && user && (
          <div className="px-4 py-3 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0",roleColors[role]||"bg-primary")}>
                {user.email?.[0]?.toUpperCase()||"U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{user.email?.split("@")[0]}</div>
                <span className={cn("text-[9px] text-white px-1.5 py-0.5 rounded-full inline-block mt-0.5",roleColors[role]||"bg-primary")}>
                  {roleLabels[role]||role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {groups.map(group=>{
            const visible = group.items.filter(item=>(item as any).always || can(item.key as any));
            if (!visible.length) return null;
            return (
              <div key={group.label}>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wider px-3 mb-1">{group.label}</p>
                <div className="space-y-0.5">
                  {visible.map(item=>(
                    <NavLink key={item.url} to={item.url} end={(item as any).end} onClick={onClose}
                      className={({isActive})=>cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                        (item as any).accent && !isActive
                          ? "text-primary hover:bg-primary/10 border border-dashed border-primary/30"
                          : isActive
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}>
                      <item.icon className="w-4 h-4 shrink-0"/>
                      <span className="flex-1 truncate">{item.label}</span>
                      {(item as any).accent && <Plus className="w-3 h-3 opacity-60"/>}
                    </NavLink>
                  ))}
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
          <button onClick={()=>{signOut();navigate("/");}}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-500/10 transition-colors font-bold">
            <LogOut className="w-3.5 h-3.5"/> تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
};
export default AdminSidebar;
