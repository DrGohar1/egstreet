import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PermissionKey =
  | "dashboard" | "articles" | "articles.write" | "articles.review"
  | "categories" | "users" | "comments" | "analytics" | "settings"
  | "subscribers" | "breaking_news" | "ads" | "pages" | "tags"
  | "scraper" | "ai_tools" | "backup" | "automation";

interface Permission {
  permission_key: PermissionKey;
  granted: boolean;
}

// Super admin has ALL permissions always
const SUPER_ADMIN_PERMISSIONS: PermissionKey[] = [
  "dashboard","articles","articles.write","articles.review",
  "categories","users","comments","analytics","settings",
  "subscribers","breaking_news","ads","pages","tags",
  "scraper","ai_tools","backup","automation"
];

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) { setPermissions([]); setLoading(false); return; }
    try {
      // Get role
      const { data: roleData } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id).single();
      const userRole = roleData?.role || null;
      setRole(userRole);

      // Super admin gets everything
      if (userRole === "super_admin") {
        setPermissions(SUPER_ADMIN_PERMISSIONS);
        setLoading(false); return;
      }

      // Get explicit permissions from DB
      const { data: perms } = await supabase
        .from("permissions").select("permission_key, granted")
        .eq("user_id", user.id).eq("granted", true);

      setPermissions((perms || []).map((p: Permission) => p.permission_key));
    } catch { setPermissions([]); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const can = useCallback((key: PermissionKey): boolean => {
    if (role === "super_admin") return true;
    return permissions.includes(key);
  }, [permissions, role]);

  const isSuperAdmin = role === "super_admin";

  return { permissions, role, loading, can, isSuperAdmin, refetch: fetchPermissions };
}
