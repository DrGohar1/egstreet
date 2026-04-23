import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ShieldCheck, ShieldAlert, Star, Code2, Eye,
  Save, RefreshCw, Check, Minus, ChevronDown, Plus, Trash2, Loader2
} from "lucide-react";
import { toast } from "sonner";

/* Roles exactly match DB enum app_role */
const ROLES = [
  { id:"super_admin",    label:"سوبر أدمن",    color:"text-rose-500",   bg:"bg-rose-500/10",   icon:ShieldAlert },
  { id:"editor_in_chief",label:"رئيس التحرير", color:"text-amber-500",  bg:"bg-amber-500/10",  icon:ShieldCheck },
  { id:"journalist",     label:"صحفي",         color:"text-blue-500",   bg:"bg-blue-500/10",   icon:Shield      },
  { id:"ads_manager",    label:"مدير إعلانات", color:"text-green-500",  bg:"bg-green-500/10",  icon:Star        },
];

const SECTIONS = [
  { label:"المحتوى", perms:[
    { key:"articles",   label:"المقالات",   desc:"إنشاء وتعديل وحذف المقالات" },
    { key:"categories", label:"الأقسام",    desc:"إدارة أقسام الموقع" },
    { key:"tags",       label:"الوسوم",     desc:"إدارة الوسوم والتصنيفات" },
    { key:"breaking",   label:"عاجل",       desc:"نشر الأخبار العاجلة" },
  ]},
  { label:"الوسائط والإعلانات", perms:[
    { key:"media",      label:"الوسائط",    desc:"رفع وإدارة الصور والفيديو" },
    { key:"ads",        label:"الإعلانات",  desc:"إنشاء وتعديل الإعلانات" },
  ]},
  { label:"البيانات والنظام", perms:[
    { key:"analytics",   label:"التحليلات", desc:"عرض تقارير الزيارات والأداء" },
    { key:"users",       label:"المستخدمين",desc:"إضافة وتعديل المستخدمين" },
    { key:"settings",    label:"الإعدادات", desc:"إعدادات الموقع العامة" },
    { key:"permissions", label:"الصلاحيات", desc:"تعديل جدول الصلاحيات" },
  ]},
];
const ALL_PERM_KEYS = SECTIONS.flatMap(s=>s.perms.map(p=>p.key));

const DEFAULTS: Record<string,string[]> = {
  super_admin:    ALL_PERM_KEYS,
  editor_in_chief:["articles","categories","tags","breaking","media","analytics"],
  journalist:     ["articles","categories","tags","media"],
  ads_manager:    ["ads","media","analytics"],
};

type Matrix = Record<string, Set<string>>;

export default function PermissionManagement() {
  const { role:myRole } = usePermissions();
  const isSuperAdmin = myRole==="super_admin";

  const [matrix, setMatrix] = useState<Matrix>(()=>{
    const m:Matrix = {};
    ROLES.forEach(r=>{ m[r.id]=new Set(DEFAULTS[r.id]||[]); });
    return m;
  });
  const [activeTab, setActiveTab] = useState("editor_in_chief");
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [view,      setView]      = useState<"tabs"|"matrix">("tabs");

  /* ── Load from DB ── */
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("role_permissions" as any).select("role,permission");
      if (data && data.length > 0) {
        const m:Matrix = {};
        ROLES.forEach(r=>{ m[r.id]=new Set<string>(); });
        data.forEach((row:any)=>{ if(m[row.role]) m[row.role].add(row.permission); });
        setMatrix(m);
      }
    } catch {}
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  /* ── Toggle one perm for one role ── */
  const toggle = (roleId:string, perm:string) => {
    if (!isSuperAdmin) return;
    setMatrix(prev=>({
      ...prev,
      [roleId]: (() => {
        const next = new Set(prev[roleId]);
        if (next.has(perm)) next.delete(perm); else next.add(perm);
        return next;
      })()
    }));
  };

  /* ── Toggle all perms for a role ── */
  const toggleAll = (roleId:string) => {
    if (!isSuperAdmin) return;
    const allChecked = ALL_PERM_KEYS.every(p=>matrix[roleId]?.has(p));
    setMatrix(prev=>({ ...prev, [roleId]: allChecked ? new Set() : new Set(ALL_PERM_KEYS) }));
  };

  /* ── Toggle perm across all roles ── */
  const togglePerm = (perm:string) => {
    if (!isSuperAdmin) return;
    const allChecked = ROLES.every(r=>matrix[r.id]?.has(perm));
    const next = {...matrix};
    ROLES.forEach(r=>{ const s=new Set(matrix[r.id]); allChecked ? s.delete(perm) : s.add(perm); next[r.id]=s; });
    setMatrix(next);
  };

  /* ── Reset to defaults ── */
  const reset = () => {
    const m:Matrix = {};
    ROLES.forEach(r=>{ m[r.id]=new Set(DEFAULTS[r.id]||[]); });
    setMatrix(m);
    toast.info("تمت إعادة الضبط (لم تُحفظ بعد)");
  };

  /* ── Save ── */
  const save = async () => {
    setSaving(true);
    try {
      await supabase.from("role_permissions" as any).delete().in("role",["super_admin","editor_in_chief","journalist","ads_manager"]);
      const rows:any[] = [];
      ROLES.forEach(r=>{ matrix[r.id]?.forEach(p=>{ rows.push({role:r.id, permission:p}); }); });
      if (rows.length) {
        const { error } = await supabase.from("role_permissions" as any).insert(rows);
        if (error) throw error;
      }
      toast.success("تم حفظ الصلاحيات بنجاح");
    } catch(e:any){ toast.error(e.message||"فشل الحفظ"); }
    setSaving(false);
  };

  const activeRole = ROLES.find(r=>r.id===activeTab)!;
  const Icon = activeRole?.icon||Shield;
  const activePerms = matrix[activeTab]||new Set();
  const totalPerms = ALL_PERM_KEYS.length;
  const activeCount = activePerms.size;

  if (!isSuperAdmin) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
      <Shield className="w-16 h-16 opacity-10"/>
      <p className="font-bold text-lg">صلاحية مرفوضة</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-24" dir="rtl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary"/>إدارة الصلاحيات
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">تحكّم في صلاحيات كل دور بشكل تفصيلي</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl border border-border overflow-hidden text-xs font-bold">
            <button onClick={()=>setView("tabs")} className={`px-3 py-1.5 transition-colors ${view==="tabs"?"bg-primary text-white":"bg-card text-muted-foreground hover:bg-muted"}`}>
              أدوار
            </button>
            <button onClick={()=>setView("matrix")} className={`px-3 py-1.5 transition-colors ${view==="matrix"?"bg-primary text-white":"bg-card text-muted-foreground hover:bg-muted"}`}>
              مصفوفة
            </button>
          </div>
          <button onClick={reset} className="w-9 h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors" title="إعادة الضبط">
            <RefreshCw className="w-4 h-4 text-muted-foreground"/>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary/40"/></div>
      ) : (
        <>
          {/* ════════ TABS VIEW ════════ */}
          {view==="tabs" && (
            <>
              {/* Role tabs */}
              <div className="flex gap-1.5 flex-wrap">
                {ROLES.map(r=>(
                  <button key={r.id} onClick={()=>setActiveTab(r.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${activeTab===r.id?`${r.bg} ${r.color} border-current`:"border-border text-muted-foreground hover:border-primary/30"}`}>
                    <r.icon className="w-3 h-3"/>{r.label}
                    <span className="opacity-60">({matrix[r.id]?.size||0}/{totalPerms})</span>
                  </button>
                ))}
              </div>

              {/* Role header card */}
              <div className={`rounded-2xl p-4 border border-border ${activeRole.bg} flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-card/80 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${activeRole.color}`}/>
                  </div>
                  <div>
                    <p className={`font-black text-base ${activeRole.color}`}>{activeRole.label}</p>
                    <p className="text-xs text-muted-foreground">{activeCount} صلاحية من {totalPerms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Progress */}
                  <div className="w-20 bg-muted rounded-full h-2 hidden sm:block">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{width:`${(activeCount/totalPerms)*100}%`}}/>
                  </div>
                  <button onClick={()=>toggleAll(activeTab)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-current transition-all hover:bg-card/80">
                    {activeCount===totalPerms?"سلب الكل":"منح الكل"}
                  </button>
                </div>
              </div>

              {/* Permissions by section */}
              <div className="space-y-4">
                {SECTIONS.map(section=>(
                  <div key={section.label}>
                    <p className="text-xs font-black text-muted-foreground mb-2 flex items-center gap-2">
                      <span className="w-3 h-px bg-muted-foreground inline-block"/>
                      {section.label}
                      <span className="w-full h-px bg-border inline-block"/>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {section.perms.map(perm=>{
                        const has = activePerms.has(perm.key);
                        return (
                          <motion.button key={perm.key}
                            onClick={()=>toggle(activeTab, perm.key)}
                            whileTap={{scale:0.97}}
                            className={`flex items-center justify-between p-3.5 rounded-xl border-2 text-start transition-all ${has?"border-primary bg-primary/5":"border-border bg-card hover:border-primary/30"}`}>
                            <div className="min-w-0">
                              <p className={`text-sm font-bold ${has?"text-primary":"text-foreground"}`}>{perm.label}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{perm.desc}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ms-3 transition-all ${has?"bg-primary":"bg-muted"}`}>
                              {has && <Check className="w-3.5 h-3.5 text-white"/>}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ════════ MATRIX VIEW ════════ */}
          {view==="matrix" && (
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-start px-4 py-3 font-black text-muted-foreground min-w-[140px]">الصلاحية</th>
                      {ROLES.map(r=>(
                        <th key={r.id} className="px-3 py-3 text-center">
                          <button onClick={()=>toggleAll(r.id)} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity mx-auto">
                            <r.icon className={`w-4 h-4 ${r.color}`}/>
                            <span className={`font-black ${r.color} whitespace-nowrap`}>{r.label}</span>
                            <span className="text-muted-foreground font-normal">{matrix[r.id]?.size||0}/{totalPerms}</span>
                          </button>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-muted-foreground font-black">الكل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_PERM_KEYS.map((perm,pi)=>{
                      const label = SECTIONS.flatMap(s=>s.perms).find(p=>p.key===perm)?.label||perm;
                      const allChecked = ROLES.every(r=>matrix[r.id]?.has(perm));
                      const someChecked = ROLES.some(r=>matrix[r.id]?.has(perm));
                      return (
                        <tr key={perm} className={`border-b border-border/50 ${pi%2===0?"bg-card":"bg-muted/20"} hover:bg-primary/5 transition-colors`}>
                          <td className="px-4 py-3 font-bold text-foreground">{label}</td>
                          {ROLES.map(r=>{
                            const has = matrix[r.id]?.has(perm);
                            return (
                              <td key={r.id} className="px-3 py-3 text-center">
                                <button onClick={()=>toggle(r.id, perm)}
                                  className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center border-2 transition-all ${has?"border-primary bg-primary":"border-border hover:border-primary/40 bg-card"}`}>
                                  {has && <Check className="w-3.5 h-3.5 text-white"/>}
                                </button>
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-center">
                            <button onClick={()=>togglePerm(perm)}
                              className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center border-2 transition-all ${allChecked?"border-primary bg-primary":someChecked?"border-amber-400 bg-amber-400":"border-border hover:border-primary/40 bg-card"}`}>
                              {allChecked && <Check className="w-3.5 h-3.5 text-white"/>}
                              {!allChecked && someChecked && <Minus className="w-3 h-3 text-white"/>}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Sticky Save Bar ── */}
      <div className="fixed bottom-0 start-0 end-0 lg:start-64 bg-card/95 backdrop-blur-md border-t border-border p-3 z-30 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground hidden sm:block">
          التغييرات لم تُحفظ حتى تضغط حفظ ✓
        </p>
        <button onClick={save} disabled={saving}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/85 active:scale-95 text-white font-black px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>حفظ...</> : <><Save className="w-4 h-4"/>حفظ الصلاحيات</>}
        </button>
      </div>

    </div>
  );
}
