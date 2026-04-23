import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Permissions {
  articles: boolean; categories: boolean; breaking: boolean;
  users: boolean; settings: boolean; ads: boolean;
  analytics: boolean; pages: boolean; subscribers: boolean;
  comments: boolean; ai: boolean; backup: boolean;
  tags: boolean; permissions: boolean;
}

const DEFAULT_PERMS: Permissions = {
  articles: false, categories: false, breaking: false,
  users: false, settings: false, ads: false,
  analytics: false, pages: false, subscribers: false,
  comments: false, ai: false, backup: false,
  tags: false, permissions: false,
};

export function usePermissions() {
  const { user } = useAuth();
  const [role, setRole] = useState<string>("");
  const [perms, setPerms] = useState<Permissions>(DEFAULT_PERMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("user_roles")
      .select("role, permissions")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setRole(data.role);
          const p = typeof data.permissions === "string"
            ? JSON.parse(data.permissions)
            : (data.permissions as any) || {};
          setPerms({ ...DEFAULT_PERMS, ...p });
        }
        setLoading(false);
      });
  }, [user]);

  const isSuperAdmin = role === "super_admin";  // top role in app_role enum
  const isEditor = role === "editor_in_chief" || isSuperAdmin;
  const can = (key: keyof Permissions) => isSuperAdmin || perms[key] === true;

  return { role, perms, loading, isSuperAdmin, isEditor, can };
}
