import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PermissionKey =
  // Dashboard
  | "dashboard"
  // Articles
  | "articles" | "articles.write" | "articles.publish" | "articles.review" | "articles.delete"
  // Content
  | "categories" | "tags" | "breaking_news" | "pages"
  // Media
  | "media.upload" | "media.delete"
  // Communication
  | "comments" | "comments.approve" | "subscribers"
  // Advertising
  | "ads" | "ads.create" | "ads.delete"
  // Analytics
  | "analytics"
  // AI & Automation
  | "scraper" | "scraper.run" | "ai_tools" | "ai_tools.generate" | "automation" | "automation.rules"
  // Admin
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
  ads_manager: [
    "dashboard",
    "ads","ads.create","ads.delete",
    "analytics",
    "media.upload",
  ],
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
    if (!user) { setPermissions([]); setRole(null); setLoading(false); setLastUid(null); return; }
    if (lastUid !== user.id) { setLoading(true); fetchPerms(user.id); }
  }, [user?.id]); // eslint-disable-line

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
