import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, Layers, Tag, Zap, Users, Shield,
  MessageSquare, Mail, Megaphone, Rss, Brain, BarChart3,
  FileCode, Database, Settings, X, LogOut, Newspaper, ChevronRight
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const ADMIN = "/Gadmin";

const AdminSidebar = ({ open, onClose }: { open?: boolean; onClose?: () => void }) => {
  const { t, language } = useLanguage();
  const { signOut, user } = useAuth();
  const { role, can, loading } = usePermissions();
  const navigate = useNavigate();

  const roleBadgeColor: Record<string, string> = {
    super_admin: "bg-red-500",
    editor_in_chief: "bg-blue-500",
    journalist: "bg-green-500",
    ads_manager: "bg-yellow-500",
  };

  const roleLabel: Record<string, string> = {
    super_admin: "سوبر أدمن",
    editor_in_chief: "رئيس التحرير",
    journalist: "صحفي",
    ads_manager: "مدير إعلانات",
  };

  const allItems = [
    { key: "dashboard", label: t("لوحة التحكم", "Dashboard"), url: ADMIN, icon: LayoutDashboard, always: true },
    { key: "articles", label: t("المقالات", "Articles"), url: `${ADMIN}/articles`, icon: FileText },
    { key: "categories", label: t("الأقسام", "Categories"), url: `${ADMIN}/categories`, icon: Layers },
    { key: "tags", label: t("الوسوم", "Tags"), url: `${ADMIN}/tags`, icon: Tag },
    { key: "breaking", label: t("أخبار عاجلة", "Breaking News"), url: `${ADMIN}/breaking`, icon: Zap },
    { key: "comments", label: t("التعليقات", "Comments"), url: `${ADMIN}/comments`, icon: MessageSquare },
    { key: "subscribers", label: t("المشتركون", "Subscribers"), url: `${ADMIN}/subscribers`, icon: Mail },
    { key: "ads", label: t("الإعلانات", "Advertisements"), url: `${ADMIN}/advertisements`, icon: Megaphone },
    { key: "analytics", label: t("التحليلات", "Analytics"), url: `${ADMIN}/analytics`, icon: BarChart3 },
    { key: "ai", label: t("سحب الأخبار RSS", "News Scraper"), url: `${ADMIN}/ai/scraper`, icon: Rss },
    { key: "ai", label: t("أدوات الذكاء الاصطناعي", "AI Tools"), url: `${ADMIN}/ai/tools`, icon: Brain },
    { key: "users", label: t("المستخدمون", "Users"), url: `${ADMIN}/users`, icon: Users },
    { key: "permissions", label: t("الصلاحيات", "Permissions"), url: `${ADMIN}/permissions`, icon: Shield },
    { key: "pages", label: t("الصفحات", "Pages"), url: `${ADMIN}/pages`, icon: FileCode },
    { key: "backup", label: t("النسخ الاحتياطي", "Backup"), url: `${ADMIN}/backup`, icon: Database },
    { key: "settings", label: t("الإعدادات", "Settings"), url: `${ADMIN}/settings`, icon: Settings },
  ];

  const visibleItems = allItems.filter(item =>
    item.always || can(item.key as any)
  );

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        "fixed top-0 bottom-0 z-50 w-64 bg-card border-e border-border flex flex-col transition-transform duration-300",
        "lg:static lg:translate-x-0",
        language === "ar" ? "right-0" : "left-0",
        open ? "translate-x-0" : (language === "ar" ? "translate-x-full" : "-translate-x-full")
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-primary" />
            <div>
              <div className="font-black text-sm text-foreground">الشارع المصري</div>
              <div className="text-[10px] text-muted-foreground">لوحة التحكم</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        {!loading && (
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{user?.email}</div>
                <span className={cn("text-[10px] text-white px-1.5 py-0.5 rounded-full", roleBadgeColor[role] || "bg-gray-500")}>
                  {roleLabel[role] || role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visibleItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === ADMIN}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.url !== ADMIN && <ChevronRight className={cn("w-3 h-3 opacity-40", language === "ar" && "rotate-180")} />}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-1">
          <NavLink to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors">
            <Newspaper className="w-3.5 h-3.5" />
            {t("عرض الموقع", "View Site")}
          </NavLink>
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t("تسجيل الخروج", "Sign Out")}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
