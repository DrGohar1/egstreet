import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Loader2, Save, RotateCcw, Shield } from "lucide-react";
import { ALL_PERMISSIONS, PERM_LABELS, ROLE_DEFAULTS, type PermissionKey } from "@/contexts/PermissionsContext";

const PERM_SECTIONS: { title: string; keys: PermissionKey[] }[] = [
  { title: "المقالات", keys: ["articles","articles.write","articles.publish","articles.review","articles.delete"] },
  { title: "المحتوى",  keys: ["categories","tags","breaking_news","pages"] },
  { title: "الوسائط",  keys: ["media.upload","media.delete"] },
  { title: "التواصل",  keys: ["comments","comments.approve","subscribers"] },
  { title: "الإعلانات",keys: ["ads","ads.create","ads.delete"] },
  { title: "التحليل",  keys: ["analytics"] },
  { title: "الذكاء الاصطناعي", keys: ["scraper","scraper.run","ai_tools","ai_tools.generate","automation","automation.rules"] },
  { title: "الإدارة",  keys: ["users","users.create","users.delete","permissions","settings","backup"] },
];

interface Props {
  userId: string;
  userRole: string;
  userName: string;
}

export default function UserPermissionsPanel({ userId, userRole, userName }: Props) {
  const [enabled, setEnabled] = useState<Set<PermissionKey>>(new Set());
  const [saving, setSaving] = useState(false);
  const [hasCustom, setHasCustom] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(true);

  const load = useCallback(async () => {
    setLoadingPerms(true);
    const { data } = await supabase.from("user_permissions").select("permission").eq("user_id", userId);
    if (data && data.length > 0) {
      setEnabled(new Set(data.map(d => d.permission as PermissionKey)));
      setHasCustom(true);
    } else {
      // Load role defaults
      const defaults = ROLE_DEFAULTS[userRole] || ["dashboard"];
      setEnabled(new Set(defaults));
      setHasCustom(false);
    }
    setLoadingPerms(false);
  }, [userId, userRole]);

  useEffect(() => { load(); }, [load]);

  const toggle = (key: PermissionKey) => {
    setEnabled(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    // Delete existing then insert all
    await supabase.from("user_permissions").delete().eq("user_id", userId);
    if (enabled.size > 0) {
      await supabase.from("user_permissions").insert(
        Array.from(enabled).map(p => ({ user_id: userId, permission: p }))
      );
    }
    setHasCustom(true);
    toast.success(`✅ تم حفظ صلاحيات ${userName}`);
    setSaving(false);
  };

  const resetToRole = async () => {
    const defaults = ROLE_DEFAULTS[userRole] || ["dashboard"];
    setEnabled(new Set(defaults));
    setSaving(true);
    await supabase.from("user_permissions").delete().eq("user_id", userId);
    setHasCustom(false);
    toast.success("✅ تمت إعادة التعيين لصلاحيات الدور");
    setSaving(false);
  };

  if (loadingPerms) return (
    <div className="flex items-center gap-2 py-3 px-4 text-xs text-muted-foreground">
      <Loader2 className="w-3.5 h-3.5 animate-spin"/> تحميل الصلاحيات...
    </div>
  );

  if (userRole === "super_admin") return (
    <div className="px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
      <Shield className="w-3.5 h-3.5 text-red-500"/> المدير العام لديه كل الصلاحيات تلقائياً
    </div>
  );

  return (
    <div className="border-t border-border/50 bg-muted/20 px-4 py-4" dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary"/>
          <span className="text-xs font-black">صلاحيات {userName}</span>
          {hasCustom && (
            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">مخصصة</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={resetToRole} disabled={saving}
            className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground">
            <RotateCcw className="w-3 h-3"/> إعادة تعيين
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/85 transition-colors font-bold">
            {saving ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
            حفظ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PERM_SECTIONS.map(section => (
          <div key={section.title} className="space-y-1">
            <p className="text-[9px] font-black uppercase text-muted-foreground/60 pb-1">{section.title}</p>
            {section.keys.map(key => (
              <label key={key} className="flex items-center gap-1.5 cursor-pointer group">
                <div onClick={() => toggle(key)}
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 cursor-pointer
                    ${enabled.has(key)
                      ? "bg-primary border-primary text-white"
                      : "border-border bg-background hover:border-primary/50"
                    }`}>
                  {enabled.has(key) && <Check className="w-2.5 h-2.5"/>}
                </div>
                <span className="text-[10px] group-hover:text-foreground text-muted-foreground transition-colors leading-tight">
                  {PERM_LABELS[key]}
                </span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
