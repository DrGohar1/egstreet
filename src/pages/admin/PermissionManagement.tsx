import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, ALL_PERMISSIONS, ROLE_DEFAULTS, PermissionKey } from "@/contexts/PermissionsContext";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, Save, RefreshCw, Info, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/AdminGuard";

const ROLES = [
  { id: "editor_in_chief", label: "رئيس التحرير",  color: "bg-blue-500"   },
  { id: "journalist",      label: "صحفي",           color: "bg-green-500"  },
  { id: "ads_manager",     label: "مدير إعلانات",   color: "bg-yellow-500" },
];

const PERM_GROUPS = [
  {
    label: "الرئيسية",
    perms: [
      { key: "dashboard",  label: "لوحة التحكم" },
      { key: "analytics",  label: "التحليلات"    },
    ],
  },
  {
    label: "المقالات",
    perms: [
      { key: "articles",         label: "عرض المقالات"    },
      { key: "articles.write",   label: "كتابة مقال"      },
      { key: "articles.publish", label: "نشر / إلغاء نشر" },
      { key: "articles.review",  label: "مراجعة المقالات" },
      { key: "articles.delete",  label: "حذف مقال"        },
    ],
  },
  {
    label: "المحتوى",
    perms: [
      { key: "categories",  label: "الأقسام"          },
      { key: "tags",        label: "الوسوم"           },
      { key: "breaking_news", label: "أخبار عاجلة"   },
      { key: "pages",       label: "الصفحات الثابتة" },
    ],
  },
  {
    label: "الوسائط",
    perms: [
      { key: "media.upload", label: "رفع ملفات" },
      { key: "media.delete", label: "حذف ملفات" },
    ],
  },
  {
    label: "التواصل والإعلانات",
    perms: [
      { key: "comments",        label: "عرض التعليقات"    },
      { key: "comments.approve", label: "اعتماد التعليقات" },
      { key: "subscribers",     label: "المشتركون"         },
      { key: "ads",             label: "عرض الإعلانات"    },
      { key: "ads.create",      label: "إضافة إعلان"      },
      { key: "ads.delete",      label: "حذف إعلان"        },
    ],
  },
  {
    label: "الذكاء الاصطناعي والأتمتة",
    perms: [
      { key: "scraper",         label: "قراءة RSS"         },
      { key: "scraper.run",     label: "تشغيل سحب RSS"     },
      { key: "ai_tools",        label: "عرض أدوات AI"      },
      { key: "ai_tools.generate", label: "توليد محتوى AI"  },
      { key: "automation",      label: "عرض الأتمتة"       },
      { key: "automation.rules", label: "تعديل قواعد الأتمتة" },
    ],
  },
  {
    label: "الإدارة",
    perms: [
      { key: "users",         label: "إدارة المستخدمين" },
      { key: "users.create",  label: "إنشاء مستخدم"    },
      { key: "users.delete",  label: "حذف مستخدم"      },
      { key: "permissions",   label: "إدارة الصلاحيات" },
      { key: "settings",      label: "إعدادات الموقع"  },
      { key: "backup",        label: "النسخ الاحتياطي" },
    ],
  },
];

type PermMatrix = Record<string, Set<string>>;

export default function PermissionManagement() {
  const { isSuperAdmin } = usePermissions();
  const [matrix, setMatrix]   = useState<PermMatrix>({});
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty]     = useState(false);

  const fetchPerms = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("role_permissions").select("role, permission");

    const m: PermMatrix = {};
    ROLES.forEach(r => { m[r.id] = new Set(ROLE_DEFAULTS[r.id] || []); });

    if (data && data.length > 0) {
      ROLES.forEach(r => { m[r.id] = new Set(); });
      (data || []).forEach((row: any) => { if (m[row.role]) m[row.role].add(row.permission); });
    }

    setMatrix(m);
    setLoading(false);
    setDirty(false);
  }, []);

  useEffect(() => { fetchPerms(); }, [fetchPerms]);

  const toggle = (role: string, perm: string) => {
    if (!isSuperAdmin) return;
    setMatrix(prev => {
      const next = { ...prev, [role]: new Set(prev[role]) };
      if (next[role].has(perm)) next[role].delete(perm);
      else next[role].add(perm);
      return next;
    });
    setDirty(true);
  };

  const toggleAll = (role: string) => {
    if (!isSuperAdmin) return;
    const allOn = ALL_PERMISSIONS.every(p => matrix[role]?.has(p));
    setMatrix(prev => ({ ...prev, [role]: allOn ? new Set() : new Set(ALL_PERMISSIONS) }));
    setDirty(true);
  };

  const save = async () => {
    if (!isSuperAdmin) return;
    setSaving(true);
    try {
      await (supabase as any).from("role_permissions").delete().in("role", ROLES.map(r => r.id));
      const rows: { role: string; permission: string }[] = [];
      Object.entries(matrix).forEach(([role, perms]) => {
        perms.forEach(perm => rows.push({ role, permission: perm }));
      });
      if (rows.length > 0) {
        const { error } = await (supabase as any).from("role_permissions").insert(rows);
        if (error) throw error;
      }
      toast.success("تم حفظ الصلاحيات ✅");
      setDirty(false);
    } catch (e: any) {
      toast.error(e.message || "فشل الحفظ");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-8 h-8 animate-spin text-primary"/>
    </div>
  );

  return (
    <AdminGuard permission="permissions">
      <div className="space-y-6 p-1" dir="rtl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary"/>
            </div>
            <div>
              <h1 className="text-xl font-black">إدارة الصلاحيات</h1>
              <p className="text-xs text-muted-foreground">حدد صلاحيات كل دور — {ALL_PERMISSIONS.length} صلاحية متاحة</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchPerms} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4"/> تحديث
            </button>
            {isSuperAdmin && (
              <button onClick={save} disabled={saving || !dirty}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-colors">
                {saving ? <><RefreshCw className="w-4 h-4 animate-spin"/>حفظ...</> : <><Save className="w-4 h-4"/>حفظ التغييرات</>}
              </button>
            )}
          </div>
        </div>

        {!isSuperAdmin && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-700">
            <Info className="w-4 h-4 shrink-0"/>
            عرض فقط — التعديل متاح لـ Super Admin
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-right px-4 py-3 font-bold text-muted-foreground w-52">الصلاحية</th>
                {ROLES.map(role => (
                  <th key={role.id} className="px-4 py-3 text-center min-w-[130px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[10px] text-white px-2 py-0.5 rounded-full font-bold ${role.color}`}>{role.label}</span>
                      {isSuperAdmin && (
                        <button onClick={() => toggleAll(role.id)} className="text-[9px] text-muted-foreground hover:text-primary underline">
                          {ALL_PERMISSIONS.every(p => matrix[role.id]?.has(p)) ? "إلغاء الكل" : "تحديد الكل"}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERM_GROUPS.map(group => (
                <>
                  <tr key={`g-${group.label}`} className="bg-muted/20">
                    <td colSpan={ROLES.length + 1} className="px-4 py-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </td>
                  </tr>
                  {group.perms.map(perm => (
                    <motion.tr key={perm.key} initial={{opacity:0}} animate={{opacity:1}}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground/80">
                        <span>{perm.label}</span>
                        <span className="block text-[10px] text-muted-foreground/50 font-mono">{perm.key}</span>
                      </td>
                      {ROLES.map(role => {
                        const granted = matrix[role.id]?.has(perm.key) ?? false;
                        return (
                          <td key={role.id} className="px-4 py-2.5 text-center">
                            <button onClick={() => toggle(role.id, perm.key)} disabled={!isSuperAdmin}
                              className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all duration-200
                                ${granted ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-muted text-muted-foreground hover:bg-muted/70"}
                                ${!isSuperAdmin ? "cursor-default" : "cursor-pointer"}`}>
                              {granted ? <CheckCircle2 className="w-5 h-5"/> : <XCircle className="w-5 h-5 opacity-40"/>}
                            </button>
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500"/> مسموح</div>
          <div className="flex items-center gap-1.5"><XCircle className="w-4 h-4 opacity-40"/> محجوب</div>
          <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-red-500"/> Super Admin — كل الصلاحيات دائماً</div>
        </div>
      </div>
    </AdminGuard>
  );
}
