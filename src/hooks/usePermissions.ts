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
  "tags","scraper","ai_tools","backup","automation"
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
  const [fetched, setFetched]         = useState<string | null>(null); // uid of last fetch

  const fetchPerms = useCallback(async (uid: string) => {
    // Known super admin UID → instant full access, no DB call
    if (uid === SUPER_ADMIN_UID) {
      setRole("super_admin");
      setPermissions(ALL_PERMISSIONS);
      setLoading(false);
      setFetched(uid);
      return;
    }
    try {
      const [{ data: roleData }, { data: permsData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
        supabase.from("permissions").select("permission_key").eq("user_id", uid).eq("granted", true),
      ]);
      const r = roleData?.role || null;
      setRole(r);
      if (r === "super_admin") {
        setPermissions(ALL_PERMISSIONS);
      } else {
        setPermissions((permsData || []).map((p: any) => p.permission_key as PermissionKey));
      }
    } catch {
      if (uid === SUPER_ADMIN_UID) setPermissions(ALL_PERMISSIONS);
    } finally {
      setLoading(false);
      setFetched(uid);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setPermissions([]); setRole(null); setLoading(false); setFetched(null);
      return;
    }
    // Only re-fetch if user changed
    if (fetched !== user.id) {
      setLoading(true);
      fetchPerms(user.id);
    }
  }, [user?.id]); // only depend on user.id string — stable primitive

  const can = useCallback((key: PermissionKey): boolean => {
    if (!user) return false;
    if (user.id === SUPER_ADMIN_UID || role === "super_admin") return true;
    return permissions.includes(key);
  }, [permissions, role, user?.id]);

  const isSuperAdmin = !!(user && (user.id === SUPER_ADMIN_UID || role === "super_admin"));

  return (
    <PermissionsContext.Provider value={{
      permissions, role, loading, can, isSuperAdmin,
      refetch: () => user && fetchPerms(user.id),
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
