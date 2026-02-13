import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

    // Check if current user is super_admin
    if (user) {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "super_admin" as AppRole });
      setIsSuperAdmin(!!data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getUserRole = (userId: string): AppRole | null => {
    const r = roles.find((r) => r.user_id === userId);
    return r ? r.role : null;
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    const existingRole = roles.find((r) => r.user_id === userId);

    if (existingRole) {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
      if (error) {
        toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });
      if (error) {
        toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: t("تم التحديث", "Updated"), description: t("تم تغيير الدور بنجاح", "Role updated successfully") });
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
          {t("إدارة المستخدمين والأدوار", "User & Roles Management")}
        </h2>
        <Badge variant="outline" className="text-xs">
          {profiles.length} {t("مستخدم", "Users")}
        </Badge>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t("المستخدم", "User")}</TableHead>
              <TableHead>{t("الدور", "Role")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("تاريخ الانضمام", "Joined")}</TableHead>
              {isSuperAdmin && <TableHead>{t("تغيير الدور", "Change Role")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => {
              const role = getUserRole(profile.user_id);
              const roleConfig = role ? ROLE_CONFIG[role] : null;

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
                          <span className="text-[10px] text-muted-foreground">
                            {t("(أنت)", "(You)")}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {roleConfig ? (
                      <Badge className={`${roleConfig.color} text-[11px] border-0`}>
                        {language === "ar" ? roleConfig.label_ar : roleConfig.label_en}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] text-muted-foreground">
                        {t("بدون دور", "No Role")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Select
                        value={role || ""}
                        onValueChange={(val) => handleRoleChange(profile.user_id, val as AppRole)}
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <SelectValue placeholder={t("اختر دور", "Select Role")} />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((r) => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {language === "ar" ? ROLE_CONFIG[r].label_ar : ROLE_CONFIG[r].label_en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserManagement;
