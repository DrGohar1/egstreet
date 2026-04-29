import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PermissionKey =
  | "dashboard"
  | "articles" | "articles.write" | "articles.publish" | "articles.review" | "articles.delete"
  | "categories" | "tags" | "breaking_news" | "pages"
  | "media.upload" | "media.delete"
  | "comments" | "comments.approve" | "subscribers"
  | "ads" | "ads.create" | "ads.delete"
  | "analytics"
  | "scraper" | "scraper.run" | "ai_tools" | "ai_tools.generate" | "automation" | "automation.rules"
  | "users" | "users.create" | "users.delete" | "permissions"
  | "settings" | "backup";

export const ALL_PERMISSIONS: PermissionKey[] = [
  "dashboard",
  "articles","articles.write","articles.publish","articles.review","articles.delete",
  "categories","tags","breaking_news","pages",
  "media.upload","media.delete",
  "comments","comments.approve","subscribers",
  "ads","ads.create","ads.delete",
  "analytics",
  "scraper","scraper.run","ai_tools","ai_tools.generate","automation","automation.rules",
  "users","users.create","users.delete","permissions",
  "settings","backup",
];

export const ROLE_DEFAULTS: Record<string, PermissionKey[]> = {
  super_admin: ALL_PERMISSIONS,
  editor_in_chief: [
    "dashboard",
    "articles","articles.write","articles.publish","articles.review","articles.delete",
    "categories","tags","breaking_news","pages",
    "media.upload","media.delete",
    "comments","comments.approve","subscribers",
    "analytics",
  ],
  journalist: [
    "dashboard",
    "articles","articles.write",
    "categories","tags","breaking_news",
    "media.upload",
    "comments",
  ],
  analyst: [
    "dashboard",
    "articles",
    "analytics",
    "categories","tags",
  ],
  ads_manager: [
    "dashboard",
    "ads","ads.create","ads.delete",
    "analytics",
    "media.upload",
  ],
};

export const PERM_LABELS: Record<PermissionKey, string> = {
  "dashboard":          "لوحة التحكم",
  "articles":           "عرض المقالات",
  "articles.write":     "كتابة مقال",
  "articles.publish":   "نشر مقال",
  "articles.review":    "مراجعة مقالات",
  "articles.delete":    "حذف مقال",
  "categories":         "إدارة الأقسام",
  "tags":               "إدارة الوسوم",
  "breaking_news":      "أخبار عاجلة",
  "pages":              "إدارة الصفحات",
  "media.upload":       "رفع وسائط",
  "media.delete":       "حذف وسائط",
  "comments":           "عرض التعليقات",
  "comments.approve":   "اعتماد التعليقات",
  "subscribers":        "المشتركون",
  "ads":                "عرض الإعلانات",
  "ads.create":         "إنشاء إعلان",
  "ads.delete":         "حذف إعلان",
  "analytics":          "التحليلات",
  "scraper":            "سحب الأخبار",
  "scraper.run":        "تشغيل السحب",
  "ai_tools":           "أدوات الذكاء",
  "ai_tools.generate":  "توليد محتوى AI",
  "automation":         "الأتمتة",
  "automation.rules":   "قواعد الأتمتة",
  "users":              "إدارة المستخدمين",
  "users.create":       "إنشاء مستخدم",
  "users.delete":       "حذف مستخدم",
  "permissions":        "إدارة الصلاحيات",
  "settings":           "إعدادات الموقع",
  "backup":             "النسخ الاحتياطي",
};

interface PermCtx {
  permissions: PermissionKey[];
  role: string | null;
  loading: boolean;
  can: (key: PermissionKey) => boolean;
  isSuperAdmin: boolean;
  refetch: () => void;
}

const PermissionsContext = createContext<PermCtx>({
  permissions: [], role: null, loading: true,
  can: () => false, isSuperAdmin: false, refetch: () => {},
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [role, setRole]               = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [lastUid, setLastUid]         = useState<string | null>(null);

  const fetchPerms = useCallback(async (uid: string) => {
    try {
      const { data: roleData } = await supabase
        .from("user_roles").select("role").eq("user_id", uid).maybeSingle();
      const userRole = roleData?.role || "journalist";
      setRole(userRole);

      if (userRole === "super_admin") {
        setPermissions(ALL_PERMISSIONS);
        setLoading(false);
        setLastUid(uid);
        return;
      }

      // ── 1. Check user-level permissions first ──
      const { data: userPerms } = await supabase
        .from("user_permissions")
        .select("permission")
        .eq("user_id", uid);

      if (userPerms && userPerms.length > 0) {
        setPermissions(userPerms.map((p: any) => p.permission as PermissionKey));
        setLoading(false);
        setLastUid(uid);
        return;
      }

      // ── 2. Fallback to role-level permissions ──
      const { data: rolePerms } = await supabase
        .from("role_permissions").select("permission").eq("role", userRole);
      if (rolePerms && rolePerms.length > 0) {
        setPermissions(rolePerms.map((p: any) => p.permission as PermissionKey));
      } else {
        setPermissions(ROLE_DEFAULTS[userRole] || ["dashboard"]);
      }
    } catch {
      setPermissions(["dashboard"]);
    } finally {
      setLoading(false);
      setLastUid(uid);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setPermissions([]); setRole(null); setLoading(false); setLastUid(null);
      return;
    }
    if (lastUid !== user.id) { setLoading(true); fetchPerms(user.id); }
  }, [user?.id]); // eslint-disable-line

  // ── Realtime: re-fetch when user_permissions changes ──
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`perms:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_permissions",
          filter: `user_id=eq.${user.id}`,
        },
        () => { fetchPerms(user.id); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchPerms]); // eslint-disable-line

  const can = useCallback(
    (key: PermissionKey) => {
      if (!user) return false;
      if (role === "super_admin") return true;
      return permissions.includes(key);
    },
    [user?.id, role, permissions] // eslint-disable-line
  );

  const isSuperAdmin = !!(user && role === "super_admin");

  return (
    <PermissionsContext.Provider
      value={{ permissions, role, loading, can, isSuperAdmin, refetch: () => user && fetchPerms(user.id) }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() { return useContext(PermissionsContext); }
