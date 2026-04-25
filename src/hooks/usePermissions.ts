import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PermissionKey =
  | "dashboard" | "articles" | "articles.write" | "articles.review"
  | "categories" | "users" | "comments" | "analytics" | "settings"
  | "subscribers" | "breaking_news" | "ads" | "pages" | "tags"
  | "scraper" | "ai_tools" | "backup" | "automation";

const ALL_PERMISSIONS: PermissionKey[] = [
  "dashboard","articles","articles.write","articles.review",
  "categories","users","comments","analytics","settings",
  "subscribers","breaking_news","ads","pages","tags",
  "scraper","ai_tools","backup","automation"
];

// Hardcoded super admin UID as ultimate fallback
const SUPER_ADMIN_UID = "50919c52-81ab-4b98-9a25-66cdaa405c16";

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) { setPermissions([]); setRole(null); setLoading(false); return; }

    // Hardcoded fallback: known super admin UID always gets full access
    if (user.id === SUPER_ADMIN_UID) {
      setRole("super_admin");
      setPermissions(ALL_PERMISSIONS);
      setLoading(false);
      return;
    }

    try {
      // Get role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const userRole = roleData?.role || null;
      setRole(userRole);

      if (userRole === "super_admin") {
        setPermissions(ALL_PERMISSIONS);
        setLoading(false);
        return;
      }

      // Get explicit permissions
      const { data: perms } = await supabase
        .from("permissions")
        .select("permission_key, granted")
        .eq("user_id", user.id)
        .eq("granted", true);

      setPermissions((perms || []).map((p: any) => p.permission_key as PermissionKey));
    } catch {
      // Fallback: if DB fails and user is known admin, grant full access
      if (user.id === SUPER_ADMIN_UID) {
        setRole("super_admin");
        setPermissions(ALL_PERMISSIONS);
      } else {
        setPermissions([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const can = useCallback((key: PermissionKey): boolean => {
    if (!user) return false;
    if (user.id === SUPER_ADMIN_UID) return true;
    if (role === "super_admin") return true;
    return permissions.includes(key);
  }, [permissions, role, user]);

  const isSuperAdmin = role === "super_admin" || user?.id === SUPER_ADMIN_UID;

  return { permissions, role, loading, can, isSuperAdmin, refetch: fetchPermissions };
}
