import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Shield, CheckSquare, Square, Minus } from "lucide-react";

// ─── PERMISSION MATRIX DEFINITION ───────────────────────────────────────────
const ROLES = [
  { key: "editor_in_chief", ar: "رئيس التحرير",   en: "Editor in Chief",  color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { key: "journalist",      ar: "صحفي",             en: "Journalist",       color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { key: "ads_manager",     ar: "مدير الإعلانات",  en: "Ads Manager",      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
] as const;
type RoleKey = typeof ROLES[number]["key"];

const SECTIONS = [
  {
    group: "ar", groupEn: "Content",
    items: [
      { key: "articles.view",    ar: "عرض المقالات",         en: "View Articles" },
      { key: "articles.create",  ar: "كتابة مقال جديد",      en: "Create Article" },
      { key: "articles.edit",    ar: "تعديل مقالات الكل",    en: "Edit All Articles" },
      { key: "articles.delete",  ar: "حذف المقالات",         en: "Delete Articles" },
      { key: "articles.publish", ar: "نشر/إيقاف المقالات",   en: "Publish Articles" },
      { key: "breaking.manage",  ar: "إدارة الأخبار العاجلة", en: "Manage Breaking News" },
      { key: "comments.manage",  ar: "إدارة التعليقات",      en: "Manage Comments" },
      { key: "tags.manage",      ar: "إدارة الوسوم",          en: "Manage Tags" },
    ],
  },
  {
    group: "المستخدمون", groupEn: "Users",
    items: [
      { key: "users.view",    ar: "عرض المستخدمين",     en: "View Users" },
      { key: "users.manage",  ar: "إدارة المستخدمين",   en: "Manage Users" },
      { key: "subscribers.view",   ar: "عرض المشتركين",  en: "View Subscribers" },
    ],
  },
  {
    group: "الإعلانات", groupEn: "Ads",
    items: [
      { key: "ads.view",    ar: "عرض الإعلانات",   en: "View Ads" },
      { key: "ads.manage",  ar: "إدارة الإعلانات", en: "Manage Ads" },
    ],
  },
  {
    group: "الإعدادات", groupEn: "Settings",
    items: [
      { key: "analytics.view",  ar: "عرض الإحصائيات", en: "View Analytics" },
      { key: "settings.view",   ar: "عرض الإعدادات",  en: "View Settings" },
      { key: "settings.edit",   ar: "تعديل الإعدادات", en: "Edit Settings" },
      { key: "categories.manage", ar: "إدارة الأقسام", en: "Manage Categories" },
      { key: "pages.manage",    ar: "إدارة الصفحات",  en: "Manage Pages" },
      { key: "backup.access",   ar: "النسخ الاحتياطي", en: "Backup Access" },
      { key: "ai.tools",        ar: "أدوات الذكاء الاصطناعي", en: "AI Tools" },
    ],
  },
] as const;

type PermKey = typeof SECTIONS[number]["items"][number]["key"];

// Default permissions per role
const DEFAULTS: Record<RoleKey, PermKey[]> = {
  editor_in_chief: [
    "articles.view","articles.create","articles.edit","articles.delete","articles.publish",
    "breaking.manage","comments.manage","tags.manage",
    "users.view","subscribers.view",
    "ads.view","ads.manage",
    "analytics.view","settings.view","categories.manage","pages.manage","ai.tools",
  ],
  journalist: [
    "articles.view","articles.create","comments.manage","tags.manage","subscribers.view",
  ],
  ads_manager: [
    "articles.view","ads.view","ads.manage","analytics.view",
  ],
};

type Matrix = Record<RoleKey, Set<PermKey>>;

const PermissionManagement = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<Matrix>(() => {
    const m: any = {};
    ROLES.forEach(r => { m[r.key] = new Set(DEFAULTS[r.key]); });
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved permissions from DB
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("role_permissions" as any)
        .select("role, permission");
      if (data && data.length > 0) {
        const m: any = {};
        ROLES.forEach(r => { m[r.key] = new Set<PermKey>(); });
        data.forEach((row: any) => {
          if (m[row.role]) m[row.role].add(row.permission);
        });
        setMatrix(m);
      }
      setLoading(false);
    })();
  }, []);

  const toggle = (role: RoleKey, perm: PermKey) => {
    setMatrix(prev => {
      const next = { ...prev, [role]: new Set(prev[role]) };
      if (next[role].has(perm)) next[role].delete(perm);
      else next[role].add(perm);
      return next;
    });
  };

  const toggleAll = (perm: PermKey) => {
    const allChecked = ROLES.every(r => matrix[r.key].has(perm));
    setMatrix(prev => {
      const next = { ...prev };
      ROLES.forEach(r => {
        next[r.key] = new Set(prev[r.key]);
        if (allChecked) next[r.key].delete(perm);
        else next[r.key].add(perm);
      });
      return next;
    });
  };

  const toggleRole = (role: RoleKey) => {
    const allPerms = SECTIONS.flatMap(s => s.items.map(i => i.key)) as PermKey[];
    const allChecked = allPerms.every(p => matrix[role].has(p));
    setMatrix(prev => ({
      ...prev,
      [role]: allChecked ? new Set() : new Set(allPerms),
    }));
  };

  const resetToDefaults = () => {
    const m: any = {};
    ROLES.forEach(r => { m[r.key] = new Set(DEFAULTS[r.key]); });
    setMatrix(m);
    toast({ title: t("تم إعادة الضبط للافتراضي", "Reset to defaults") });
  };

  const save = async () => {
    setSaving(true);
    // Upsert all permissions
    const rows: any[] = [];
    ROLES.forEach(r => {
      matrix[r.key].forEach(perm => {
        rows.push({ role: r.key, permission: perm });
      });
    });

    // Delete all then insert (cleanest approach)
    await supabase.from("role_permissions" as any).delete().neq("role", "super_admin");
    if (rows.length > 0) {
      const { error } = await supabase.from("role_permissions" as any).insert(rows);
      if (error) {
        // Table might not exist yet — show SQL to create it
        toast({
          title: t("⚠️ جدول الصلاحيات غير موجود", "⚠️ Permissions table missing"),
          description: t("شغّل migration في Supabase SQL Editor", "Run migration in Supabase SQL Editor"),
          variant: "destructive"
        });
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    toast({ title: t("✅ تم حفظ الصلاحيات", "✅ Permissions saved") });
  };

  const allPerms = SECTIONS.flatMap(s => s.items.map(i => i.key)) as PermKey[];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t("نظام الصلاحيات", "Permission Management")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("تحكم في صلاحيات كل دور — super_admin لديه كل الصلاحيات دائماً",
               "Control permissions per role — super_admin always has full access")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults} className="text-xs h-8">
            {t("إعادة للافتراضي", "Reset Defaults")}
          </Button>
          <Button size="sm" onClick={save} disabled={saving} className="text-xs h-8 gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t("حفظ الصلاحيات", "Save Permissions")}
          </Button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-start px-4 py-3 font-bold text-xs text-muted-foreground w-52">
                  {t("الصلاحية", "Permission")}
                </th>
                {ROLES.map(role => (
                  <th key={role.key} className="px-3 py-3 text-center min-w-[120px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <Badge className={`text-[10px] px-2 py-0.5 rounded-md border-0 font-bold ${role.color}`}>
                        {language === "ar" ? role.ar : role.en}
                      </Badge>
                      {/* Toggle entire role */}
                      <button
                        onClick={() => toggleRole(role.key)}
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                        title={t("تحديد الكل", "Select all")}
                      >
                        {allPerms.every(p => matrix[role.key].has(p))
                          ? <CheckSquare className="h-4 w-4 text-primary" />
                          : allPerms.some(p => matrix[role.key].has(p))
                          ? <Minus className="h-4 w-4 text-amber-500" />
                          : <Square className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-center min-w-[80px]">
                  <span className="text-[10px] text-muted-foreground">{t("الكل", "All")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((section, si) => (
                <>
                  {/* Section header row */}
                  <tr key={`group-${si}`} className="bg-primary/5 border-y border-border">
                    <td colSpan={ROLES.length + 2} className="px-4 py-2">
                      <span className="text-[11px] font-black text-primary uppercase tracking-wider">
                        {language === "ar" ? section.group : section.groupEn}
                      </span>
                    </td>
                  </tr>
                  {/* Permission rows */}
                  {section.items.map((perm, pi) => {
                    const allChecked = ROLES.every(r => matrix[r.key].has(perm.key as PermKey));
                    const someChecked = ROLES.some(r => matrix[r.key].has(perm.key as PermKey));
                    return (
                      <tr
                        key={perm.key}
                        className={`border-b border-border/50 transition-colors hover:bg-muted/20 ${pi % 2 === 0 ? "" : "bg-muted/10"}`}
                      >
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-medium text-foreground">
                            {language === "ar" ? perm.ar : perm.en}
                          </span>
                          <span className="block text-[10px] text-muted-foreground/60 font-mono">{perm.key}</span>
                        </td>
                        {ROLES.map(role => {
                          const checked = matrix[role.key].has(perm.key as PermKey);
                          return (
                            <td key={role.key} className="px-3 py-2.5 text-center">
                              <button
                                onClick={() => toggle(role.key, perm.key as PermKey)}
                                className={`w-5 h-5 rounded flex items-center justify-center mx-auto transition-all border-2 ${
                                  checked
                                    ? "bg-primary border-primary text-white"
                                    : "border-border hover:border-primary/50 bg-background"
                                }`}
                              >
                                {checked && (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            </td>
                          );
                        })}
                        {/* Toggle all for this perm */}
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => toggleAll(perm.key as PermKey)}
                            className={`w-5 h-5 rounded flex items-center justify-center mx-auto transition-all border-2 ${
                              allChecked
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : someChecked
                                ? "bg-amber-400 border-amber-400 text-white"
                                : "border-border hover:border-emerald-400 bg-background"
                            }`}
                          >
                            {allChecked && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            {!allChecked && someChecked && <Minus className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-primary border-2 border-primary flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          {t("مسموح", "Allowed")}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2 border-border bg-background" />
          {t("ممنوع", "Denied")}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          {t("تحديد الكل في هذا الصف", "Select all in row")}
        </div>
        <div className="ms-auto text-[11px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
          🔒 super_admin = {t("كل الصلاحيات دائماً", "all permissions always")}
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;
