import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Save, Crown, Pencil, Newspaper, Megaphone, Check, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_CONFIG: Record<AppRole, { label_ar: string; label_en: string; icon: React.ElementType; color: string }> = {
  super_admin: { label_ar: "مدير عام", label_en: "Super Admin", icon: Crown, color: "bg-primary text-primary-foreground" },
  editor_in_chief: { label_ar: "رئيس تحرير", label_en: "Editor-in-Chief", icon: Pencil, color: "bg-blue-600 text-white" },
  journalist: { label_ar: "صحفي", label_en: "Journalist", icon: Newspaper, color: "bg-emerald-600 text-white" },
  ads_manager: { label_ar: "مدير إعلانات", label_en: "Ads Manager", icon: Megaphone, color: "bg-amber-600 text-white" },
};

const PERMISSION_GROUPS = [
  {
    group_ar: "المقالات", group_en: "Articles",
    permissions: [
      { key: "articles_create", ar: "إنشاء مقالات", en: "Create articles" },
      { key: "articles_edit_own", ar: "تعديل مقالاته", en: "Edit own articles" },
      { key: "articles_edit_all", ar: "تعديل كل المقالات", en: "Edit all articles" },
      { key: "articles_delete", ar: "حذف مقالات", en: "Delete articles" },
      { key: "articles_publish", ar: "نشر مقالات", en: "Publish articles" },
    ],
  },
  {
    group_ar: "المحتوى", group_en: "Content",
    permissions: [
      { key: "categories_manage", ar: "إدارة الأقسام", en: "Manage categories" },
      { key: "tags_manage", ar: "إدارة الوسوم", en: "Manage tags" },
      { key: "pages_manage", ar: "إدارة الصفحات", en: "Manage pages" },
      { key: "breaking_manage", ar: "أخبار عاجلة", en: "Breaking news" },
    ],
  },
  {
    group_ar: "الإدارة", group_en: "Management",
    permissions: [
      { key: "comments_moderate", ar: "إدارة التعليقات", en: "Moderate comments" },
      { key: "users_manage", ar: "إدارة المستخدمين", en: "Manage users" },
      { key: "subscribers_manage", ar: "إدارة المشتركين", en: "Manage subscribers" },
      { key: "ads_manage", ar: "إدارة الإعلانات", en: "Manage ads" },
    ],
  },
  {
    group_ar: "النظام", group_en: "System",
    permissions: [
      { key: "settings_manage", ar: "إدارة الإعدادات", en: "Manage settings" },
      { key: "analytics_view", ar: "عرض التحليلات", en: "View analytics" },
      { key: "ai_tools", ar: "أدوات AI", en: "AI tools" },
      { key: "news_scraper", ar: "سحب الأخبار", en: "News scraper" },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions);
const ALL_ROLES: AppRole[] = ["super_admin", "editor_in_chief", "journalist", "ads_manager"];

const DEFAULT_PERMISSIONS: Record<AppRole, string[]> = {
  super_admin: ALL_PERMISSIONS.map(p => p.key),
  editor_in_chief: [
    "articles_create", "articles_edit_own", "articles_edit_all", "articles_delete", "articles_publish",
    "categories_manage", "tags_manage", "comments_moderate", "analytics_view", "breaking_manage", "pages_manage",
  ],
  journalist: ["articles_create", "articles_edit_own"],
  ads_manager: ["ads_manage", "analytics_view"],
};

const PermissionManagement = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permMatrix, setPermMatrix] = useState<Record<AppRole, string[]>>(DEFAULT_PERMISSIONS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (user) {
        const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "super_admin" as AppRole });
        setIsSuperAdmin(!!data);
      }
      // Load saved permissions from site_settings
      const { data } = await supabase.from("site_settings").select("key, value").eq("key", "role_permissions").maybeSingle();
      if (data?.value) {
        try {
          const saved = JSON.parse(data.value);
          setPermMatrix({ ...DEFAULT_PERMISSIONS, ...saved });
        } catch {}
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const togglePermission = (role: AppRole, permKey: string) => {
    if (role === "super_admin") return; // Super admin always has all
    setPermMatrix(prev => {
      const current = prev[role] || [];
      const has = current.includes(permKey);
      return {
        ...prev,
        [role]: has ? current.filter(k => k !== permKey) : [...current, permKey],
      };
    });
    setHasChanges(true);
  };

  const toggleAll = (role: AppRole, groupPermissions: string[], allChecked: boolean) => {
    if (role === "super_admin") return;
    setPermMatrix(prev => {
      const current = prev[role] || [];
      if (allChecked) {
        return { ...prev, [role]: current.filter(k => !groupPermissions.includes(k)) };
      } else {
        const newPerms = new Set([...current, ...groupPermissions]);
        return { ...prev, [role]: Array.from(newPerms) };
      }
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from("site_settings").select("id").eq("key", "role_permissions").maybeSingle();
    const value = JSON.stringify(permMatrix);
    if (existing) {
      await supabase.from("site_settings").update({ value }).eq("key", "role_permissions");
    } else {
      await supabase.from("site_settings").insert({ key: "role_permissions", value });
    }
    toast({ title: t("تم حفظ الصلاحيات", "Permissions saved") });
    setSaving(false);
    setHasChanges(false);
  };

  const resetToDefaults = () => {
    setPermMatrix(DEFAULT_PERMISSIONS);
    setHasChanges(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Shield className="h-8 w-8 me-3" />
        <p className="text-lg">{t("هذه الصفحة متاحة فقط للمدير العام", "Only Super Admins can access this page")}</p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {t("إدارة الصلاحيات", "Permission Management")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("تحكم في صلاحيات كل دور بالتفصيل", "Control each role's permissions in detail")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            {t("استعادة الافتراضي", "Reset Defaults")}
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
            {saving ? <div className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? t("جارِ الحفظ...", "Saving...") : t("حفظ التغييرات", "Save Changes")}
          </Button>
        </div>
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-start p-3 font-bold text-foreground min-w-[200px]">
                    {t("الصلاحية", "Permission")}
                  </th>
                  {ALL_ROLES.map(role => {
                    const cfg = ROLE_CONFIG[role];
                    const Icon = cfg.icon;
                    return (
                      <th key={role} className="p-3 text-center min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-lg ${cfg.color} flex items-center justify-center`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            {language === "ar" ? cfg.label_ar : cfg.label_en}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_GROUPS.map(group => {
                  const groupKeys = group.permissions.map(p => p.key);
                  return (
                    <React.Fragment key={group.group_en}>
                      {/* Group Header */}
                      <tr className="bg-muted/30 border-b border-border">
                        <td className="p-2 ps-3 font-bold text-foreground text-xs uppercase tracking-wider">
                          {language === "ar" ? group.group_ar : group.group_en}
                        </td>
                        {ALL_ROLES.map(role => {
                          const rolePerms = permMatrix[role] || [];
                          const allChecked = groupKeys.every(k => rolePerms.includes(k));
                          const someChecked = groupKeys.some(k => rolePerms.includes(k));
                          return (
                            <td key={role} className="p-2 text-center">
                              {role === "super_admin" ? (
                                <Check className="h-4 w-4 text-primary mx-auto" />
                              ) : (
                                <Checkbox
                                  checked={allChecked ? true : someChecked ? "indeterminate" : false}
                                  onCheckedChange={() => toggleAll(role, groupKeys, allChecked)}
                                  className="mx-auto"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Individual Permissions */}
                      {group.permissions.map(perm => (
                        <tr key={perm.key} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="p-2 ps-6 text-foreground">
                            {language === "ar" ? perm.ar : perm.en}
                          </td>
                          {ALL_ROLES.map(role => {
                            const has = (permMatrix[role] || []).includes(perm.key);
                            return (
                              <td key={role} className="p-2 text-center">
                                {role === "super_admin" ? (
                                  <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                ) : (
                                  <Checkbox
                                    checked={has}
                                    onCheckedChange={() => togglePermission(role, perm.key)}
                                    className="mx-auto"
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ALL_ROLES.map(role => {
          const cfg = ROLE_CONFIG[role];
          const count = (permMatrix[role] || []).length;
          return (
            <Card key={role} className="overflow-hidden">
              <div className={`h-1 ${cfg.color}`} />
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{language === "ar" ? cfg.label_ar : cfg.label_en}</p>
                <p className="text-xl font-black text-foreground mt-1">{count}/{ALL_PERMISSIONS.length}</p>
                <p className="text-[10px] text-muted-foreground">{t("صلاحية", "permissions")}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
};

import React from "react";
export default PermissionManagement;
