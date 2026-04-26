import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PermissionKey =
  | "dashboard" | "articles" | "articles.write" | "articles.review"
  | "categories" | "users" | "comments" | "analytics" | "settings"
  | "subscribers" | "breaking_news" | "ads" | "pages" | "tags"
  | "scraper" | "ai_tools" | "backup" | "automation";

const ALL_PERMISSIONS: PermissionKey[] = [
  "dashboard","articles","articles.write","articles.review","categories","users",
  "comments","analytics","settings","subscribers","breaking_news","ads","pages",
  "tags","scraper","ai_tools","backup","automation",
];

const SUPER_ADMIN_UID = "50919c52-81ab-4b98-9a25-66cdaa405c16";

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
    if (uid === SUPER_ADMIN_UID) {
      setRole("super_admin");
      setPermissions(ALL_PERMISSIONS);
      setLoading(false);
      setLastUid(uid);
      return;
    }
    try {
      const [{ data: roleData }, { data: permsData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
        supabase.from("permissions").select("permission_key").eq("user_id", uid).eq("granted", true),
      ]);
      const r = roleData?.role || null;
      setRole(r);
      setPermissions(
        r === "super_admin"
          ? ALL_PERMISSIONS
          : (permsData || []).map((p: any) => p.permission_key as PermissionKey)
      );
    } catch {
      /* keep empty on error */
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
  }, [user?.id]);  // eslint-disable-line

  const can = useCallback(
    (key: PermissionKey): boolean => {
      if (!user) return false;
      if (user.id === SUPER_ADMIN_UID || role === "super_admin") return true;
      return permissions.includes(key);
    },
    [user?.id, role, permissions]  // eslint-disable-line
  );

  const isSuperAdmin = !!(user && (user.id === SUPER_ADMIN_UID || role === "super_admin"));

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
