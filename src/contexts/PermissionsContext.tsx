import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PermissionKey =
  | "dashboard" | "articles" | "articles.write" | "articles.review"
  | "categories" | "users" | "comments" | "analytics" | "settings"
  | "subscribers" | "breaking_news" | "ads" | "pages" | "tags"
  | "scraper" | "ai_tools" | "backup" | "automation";

export const ALL_PERMISSIONS: PermissionKey[] = [
  "dashboard","articles","articles.write","articles.review","categories","users",
  "comments","analytics","settings","subscribers","breaking_news","ads","pages",
  "tags","scraper","ai_tools","backup","automation",
];

// Default permissions per role (used as fallback when DB has no entry)
export const ROLE_DEFAULTS: Record<string, PermissionKey[]> = {
  super_admin:    ALL_PERMISSIONS,
  editor_in_chief: [
    "dashboard","articles","articles.write","articles.review",
    "categories","tags","breaking_news","comments","analytics","pages","subscribers",
  ],
  journalist: [
    "dashboard","articles","articles.write","categories","tags","breaking_news",
  ],
  ads_manager: [
    "dashboard","ads","analytics","media",
  ] as PermissionKey[],
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
      // 1. Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .maybeSingle();

      const userRole = roleData?.role || "journalist";
      setRole(userRole);

      // 2. super_admin gets everything immediately
      if (userRole === "super_admin") {
        setPermissions(ALL_PERMISSIONS);
        setLoading(false);
        setLastUid(uid);
        return;
      }

      // 3. Load role permissions from DB
      const { data: rolePerms } = await supabase
        .from("role_permissions")
        .select("permission")
        .eq("role", userRole);

      if (rolePerms && rolePerms.length > 0) {
        setPermissions(rolePerms.map((p: any) => p.permission as PermissionKey));
      } else {
        // Fallback to hardcoded defaults if DB has no entries yet
        setPermissions(ROLE_DEFAULTS[userRole] || ["dashboard"]);
      }
    } catch {
      // On error: give basic dashboard access only
      setPermissions(["dashboard"]);
    } finally {
      setLoading(false);
      setLastUid(uid);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setRole(null);
      setLoading(false);
      setLastUid(null);
      return;
    }
    if (lastUid !== user.id) {
      setLoading(true);
      fetchPerms(user.id);
    }
  }, [user?.id]); // eslint-disable-line

  const can = useCallback(
    (key: PermissionKey): boolean => {
      if (!user) return false;
      if (role === "super_admin") return true;
      return permissions.includes(key);
    },
    [user?.id, role, permissions] // eslint-disable-line
  );

  const isSuperAdmin = !!(user && role === "super_admin");

  return (
    <PermissionsContext.Provider
      value={{ permissions, role, loading, can, isSuperAdmin, refetch: () => user && fetchPerms(user.id) }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
