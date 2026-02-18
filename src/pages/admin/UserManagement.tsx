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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Shield, Users, Crown, Pencil, Newspaper, Megaphone, Eye, Lock, Unlock } from "lucide-react";
import { motion } from "framer-motion";
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

const ROLE_CONFIG: Record<AppRole, { label_ar: string; label_en: string; icon: React.ElementType; color: string; desc_ar: string; desc_en: string }> = {
  super_admin: {
    label_ar: "مدير عام", label_en: "Super Admin", icon: Crown,
    color: "bg-primary text-primary-foreground",
    desc_ar: "صلاحيات كاملة - تحكم في كل شيء",
    desc_en: "Full access - controls everything",
  },
  editor_in_chief: {
    label_ar: "رئيس تحرير", label_en: "Editor-in-Chief", icon: Pencil,
    color: "bg-blue-600 text-white",
    desc_ar: "إدارة المقالات والتعليقات والأقسام",
    desc_en: "Manage articles, comments & categories",
  },
  journalist: {
    label_ar: "صحفي", label_en: "Journalist", icon: Newspaper,
    color: "bg-emerald-600 text-white",
    desc_ar: "كتابة وتعديل مقالاته فقط",
    desc_en: "Write & edit own articles only",
  },
  ads_manager: {
    label_ar: "مدير إعلانات", label_en: "Ads Manager", icon: Megaphone,
    color: "bg-amber-600 text-white",
    desc_ar: "إدارة الإعلانات والحملات الإعلانية",
    desc_en: "Manage advertisements & campaigns",
  },
};

const PERMISSIONS = [
  { key: "articles_create", ar: "إنشاء مقالات", en: "Create articles" },
  { key: "articles_edit_own", ar: "تعديل مقالاته", en: "Edit own articles" },
  { key: "articles_edit_all", ar: "تعديل كل المقالات", en: "Edit all articles" },
  { key: "articles_delete", ar: "حذف مقالات", en: "Delete articles" },
  { key: "articles_publish", ar: "نشر مقالات", en: "Publish articles" },
  { key: "categories_manage", ar: "إدارة الأقسام", en: "Manage categories" },
  { key: "tags_manage", ar: "إدارة الوسوم", en: "Manage tags" },
  { key: "comments_moderate", ar: "إدارة التعليقات", en: "Moderate comments" },
  { key: "users_manage", ar: "إدارة المستخدمين", en: "Manage users" },
  { key: "ads_manage", ar: "إدارة الإعلانات", en: "Manage ads" },
  { key: "settings_manage", ar: "إدارة الإعدادات", en: "Manage settings" },
  { key: "pages_manage", ar: "إدارة الصفحات", en: "Manage pages" },
  { key: "analytics_view", ar: "عرض التحليلات", en: "View analytics" },
  { key: "subscribers_manage", ar: "إدارة المشتركين", en: "Manage subscribers" },
  { key: "breaking_manage", ar: "إدارة الأخبار العاجلة", en: "Manage breaking news" },
];

const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  super_admin: PERMISSIONS.map(p => p.key),
  editor_in_chief: [
    "articles_create", "articles_edit_own", "articles_edit_all", "articles_delete", "articles_publish",
    "categories_manage", "tags_manage", "comments_moderate", "analytics_view", "breaking_manage", "pages_manage",
  ],
  journalist: ["articles_create", "articles_edit_own"],
  ads_manager: ["ads_manage", "analytics_view"],
};

const ALL_ROLES: AppRole[] = ["super_admin", "editor_in_chief", "journalist", "ads_manager"];

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

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
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    } else {
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
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="rounded-2xl bg-gradient-to-l from-secondary to-secondary/80 p-6 text-secondary-foreground">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-black">{t("إدارة المستخدمين والصلاحيات", "Users & Permissions")}</h1>
              <p className="text-sm opacity-80">{t("تحكم كامل في أدوار وصلاحيات كل مستخدم", "Full control over user roles & permissions")}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-secondary-foreground/30 text-secondary-foreground">
            <Users className="h-3 w-3 me-1" />
            {profiles.length} {t("مستخدم", "Users")}
          </Badge>
        </div>
      </motion.div>

      <Tabs defaultValue="users" className="space-y-4">
        <motion.div variants={fadeUp}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="users" className="rounded-xl gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {t("المستخدمون", "Users")}
            </TabsTrigger>
            <TabsTrigger value="roles" className="rounded-xl gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              {t("الأدوار والصلاحيات", "Roles & Permissions")}
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* Users Tab */}
        <TabsContent value="users">
          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>{t("المستخدم", "User")}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("تاريخ الانضمام", "Joined")}</TableHead>
                      {ALL_ROLES.map((role) => {
                        const cfg = ROLE_CONFIG[role];
                        return (
                          <TableHead key={role} className="text-center text-xs">
                            <div className="flex flex-col items-center gap-0.5">
                              <cfg.icon className="h-3.5 w-3.5" />
                              <span>{language === "ar" ? cfg.label_ar : cfg.label_en}</span>
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => {
                      const userRoles = getUserRoles(profile.user_id);
                      return (
                        <TableRow key={profile.id} className="hover:bg-muted/30">
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
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {userRoles.map(r => (
                                    <Badge key={r} className={`${ROLE_CONFIG[r].color} text-[9px] px-1.5 py-0 border-0`}>
                                      {language === "ar" ? ROLE_CONFIG[r].label_ar : ROLE_CONFIG[r].label_en}
                                    </Badge>
                                  ))}
                                  {userRoles.length === 0 && (
                                    <span className="text-[10px] text-muted-foreground">{t("بدون دور", "No role")}</span>
                                  )}
                                </div>
                                {profile.user_id === user?.id && (
                                  <span className="text-[10px] text-primary font-bold">{t("(أنت)", "(You)")}</span>
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
            </Card>
          </motion.div>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ALL_ROLES.map((role) => {
              const cfg = ROLE_CONFIG[role];
              const perms = ROLE_PERMISSIONS[role];
              const Icon = cfg.icon;
              return (
                <motion.div key={role} variants={fadeUp}>
                  <Card className="overflow-hidden">
                    <CardHeader className={`${cfg.color} py-4`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{language === "ar" ? cfg.label_ar : cfg.label_en}</CardTitle>
                          <CardDescription className="text-white/70 text-xs mt-0.5">
                            {language === "ar" ? cfg.desc_ar : cfg.desc_en}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {PERMISSIONS.map((perm) => {
                          const hasIt = perms.includes(perm.key);
                          return (
                            <div key={perm.key} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                              <span className="text-sm text-foreground">{language === "ar" ? perm.ar : perm.en}</span>
                              {hasIt ? (
                                <div className="flex items-center gap-1 text-emerald-600">
                                  <Unlock className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium">{t("مسموح", "Allowed")}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-muted-foreground/50">
                                  <Lock className="h-3.5 w-3.5" />
                                  <span className="text-xs">{t("محظور", "Denied")}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {perms.length}/{PERMISSIONS.length} {t("صلاحية", "permissions")}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {profiles.filter(p => getUserRoles(p.user_id).includes(role)).length} {t("مستخدم", "users")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default UserManagement;
