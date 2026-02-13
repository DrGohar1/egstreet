import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: AppRole;
}

const ROLE_CONFIG: Record<AppRole, { label_ar: string; label_en: string; color: string }> = {
  super_admin: { label_ar: "مدير عام", label_en: "Super Admin", color: "bg-primary text-primary-foreground" },
  editor_in_chief: { label_ar: "رئيس تحرير", label_en: "Editor-in-Chief", color: "bg-blue-600 text-white" },
  journalist: { label_ar: "صحفي", label_en: "Journalist", color: "bg-emerald-600 text-white" },
  ads_manager: { label_ar: "مدير إعلانات", label_en: "Ads Manager", color: "bg-amber-600 text-white" },
};

const ALL_ROLES: AppRole[] = ["super_admin", "editor_in_chief", "journalist", "ads_manager"];

const UserManagement = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [profRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id, user_id, display_name, avatar_url, created_at").order("created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (profRes.data) setProfiles(profRes.data);
    if (rolesRes.data) setRoles(rolesRes.data);

    if (user) {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "super_admin" as AppRole });
      setIsSuperAdmin(!!data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getUserRoles = (userId: string): AppRole[] => {
    return roles.filter((r) => r.user_id === userId).map((r) => r.role);
  };

  const toggleRole = async (userId: string, role: AppRole, hasRole: boolean) => {
    if (hasRole) {
      // Remove role
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    } else {
      // Add role
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: t("تم التحديث", "Updated") });
    fetchData();
  };

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {t("إدارة المستخدمين والصلاحيات", "User & Permissions Management")}
        </h2>
        <Badge variant="outline" className="text-xs">
          {profiles.length} {t("مستخدم", "Users")}
        </Badge>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t("المستخدم", "User")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("تاريخ الانضمام", "Joined")}</TableHead>
              {ALL_ROLES.map((role) => (
                <TableHead key={role} className="text-center text-xs">
                  {language === "ar" ? ROLE_CONFIG[role].label_ar : ROLE_CONFIG[role].label_en}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => {
              const userRoles = getUserRoles(profile.user_id);
              return (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                          {getInitials(profile.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground text-sm">{profile.display_name}</p>
                        {profile.user_id === user?.id && (
                          <span className="text-[10px] text-muted-foreground">{t("(أنت)", "(You)")}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                  </TableCell>
                  {ALL_ROLES.map((role) => {
                    const has = userRoles.includes(role);
                    return (
                      <TableCell key={role} className="text-center">
                        {isSuperAdmin ? (
                          <Checkbox
                            checked={has}
                            onCheckedChange={() => toggleRole(profile.user_id, role, has)}
                            className="mx-auto"
                          />
                        ) : (
                          has ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Need these icons for non-admin view
import { Check, X } from "lucide-react";

export default UserManagement;
