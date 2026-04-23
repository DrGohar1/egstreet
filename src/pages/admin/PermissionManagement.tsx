import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Shield, Save, Loader2, CheckSquare, Square, Minus,
  Plus, Trash2, X, Crown, Terminal, UserCheck, Users, Megaphone, Edit2
} from "lucide-react";

/* ─── Roles visible in permission management (not developer — has all always) ─── */
const MANAGED_ROLES = [
  { key:"super_admin",     label:"سوبر أدمن",       color:"text-red-500",    bg:"bg-red-500/10",    icon:Crown     },
  { key:"editor_in_chief", label:"رئيس التحرير",    color:"text-blue-500",   bg:"bg-blue-500/10",   icon:UserCheck },
  { key:"journalist",      label:"صحفي",             color:"text-green-500",  bg:"bg-green-500/10",  icon:Users     },
  { key:"ads_manager",     label:"مدير إعلانات",    color:"text-yellow-600", bg:"bg-yellow-500/10", icon:Megaphone },
] as const;
type RoleKey = typeof MANAGED_ROLES[number]["key"];

/* ─── Predefined permission sections ─── */
const SECTIONS = [
  { group:"المحتوى", items:[
    { key:"articles.view",    label:"عرض المقالات"          },
    { key:"articles.create",  label:"كتابة مقال جديد"       },
    { key:"articles.edit",    label:"تعديل مقالات الكل"     },
    { key:"articles.delete",  label:"حذف المقالات"          },
    { key:"articles.publish", label:"نشر / إيقاف"          },
    { key:"breaking.manage",  label:"أخبار عاجلة"           },
    { key:"comments.manage",  label:"التعليقات"             },
    { key:"tags.manage",      label:"الوسوم"                },
  ]},
  { group:"المستخدمون", items:[
    { key:"users.view",         label:"عرض المستخدمين"       },
    { key:"users.manage",       label:"إدارة المستخدمين"     },
    { key:"subscribers.view",   label:"المشتركون"            },
  ]},
  { group:"الإعلانات", items:[
    { key:"ads.view",   label:"عرض الإعلانات"  },
    { key:"ads.manage", label:"إدارة الإعلانات"},
  ]},
  { group:"النظام", items:[
    { key:"analytics.view",     label:"التحليلات"             },
    { key:"settings.view",      label:"عرض الإعدادات"        },
    { key:"settings.edit",      label:"تعديل الإعدادات"      },
    { key:"categories.manage",  label:"الأقسام"              },
    { key:"pages.manage",       label:"الصفحات"              },
    { key:"backup.access",      label:"النسخ الاحتياطي"      },
    { key:"ai.tools",           label:"أدوات AI"             },
    { key:"permissions.manage", label:"إدارة الصلاحيات"      },
  ]},
] as const;

type PermKey = typeof SECTIONS[number]["items"][number]["key"];
const ALL_PERM_KEYS = SECTIONS.flatMap(s=>s.items.map(i=>i.key)) as PermKey[];

const DEFAULTS: Record<RoleKey, PermKey[]> = {
  super_admin:     ALL_PERM_KEYS,
  editor_in_chief: ["articles.view","articles.create","articles.edit","articles.delete","articles.publish","breaking.manage","comments.manage","tags.manage","users.view","subscribers.view","ads.view","ads.manage","analytics.view","settings.view","categories.manage","pages.manage","ai.tools"] as PermKey[],
  journalist:      ["articles.view","articles.create","comments.manage","tags.manage","subscribers.view"] as PermKey[],
  ads_manager:     ["articles.view","ads.view","ads.manage","analytics.view"] as PermKey[],
};

type Matrix = Record<RoleKey, Set<PermKey>>;

/* ─── Custom permission type ─── */
interface CustomPerm { id:string; key:string; label:string; group:string; }

export default function PermissionManagement() {
  const { language } = useLanguage();
  const { role: myRole } = usePermissions();
  const isDeveloper = myRole === "developer";
  const isSuperAdmin = myRole === "super_admin" || isDeveloper;

  const [matrix,   setMatrix]   = useState<Matrix>(()=>{
    const m:any={};
    MANAGED_ROLES.forEach(r=>{m[r.key]=new Set(DEFAULTS[r.key]);});
    return m;
  });
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [activeTab, setActiveTab] = useState<RoleKey>("editor_in_chief");

  /* Custom permissions state */
  const [customPerms,    setCustomPerms]    = useState<CustomPerm[]>([]);
  const [showAddCustom,  setShowAddCustom]  = useState(false);
  const [newPerm,        setNewPerm]        = useState({ key:"", label:"", group:"مخصص" });

  /* Load from DB */
  useEffect(()=>{
    (async()=>{
      try {
        const { data } = await supabase
          .from("role_permissions" as any)
          .select("role,permission");
        if (data && data.length>0) {
          const m:any={};
          MANAGED_ROLES.forEach(r=>{m[r.key]=new Set<PermKey>();});
          data.forEach((row:any)=>{ if(m[row.role]) m[row.role].add(row.permission); });
          setMatrix(m);
        }
      } catch{}
      setLoading(false);
    })();
  },[]);

  const toggle = (role:RoleKey, perm:string) => {
    setMatrix(prev=>{
      const next={...prev,[role]:new Set(prev[role])};
      if((next[role] as Set<any>).has(perm)) (next[role] as Set<any>).delete(perm);
      else (next[role] as Set<any>).add(perm as any);
      return next;
    });
  };

  const toggleAll = (perm:string) => {
    const allChecked=MANAGED_ROLES.every(r=>(matrix[r.key] as Set<any>).has(perm));
    setMatrix(prev=>{
      const next={...prev};
      MANAGED_ROLES.forEach(r=>{
        next[r.key]=new Set(prev[r.key]);
        if(allChecked)(next[r.key] as Set<any>).delete(perm);
        else (next[r.key] as Set<any>).add(perm as any);
      });
      return next;
    });
  };

  const toggleRole = (role:RoleKey) => {
    const allPerms=[...ALL_PERM_KEYS,...customPerms.map(p=>p.key)];
    const allChecked=allPerms.every(p=>(matrix[role] as Set<any>).has(p));
    setMatrix(prev=>({
      ...prev,
      [role]:allChecked ? new Set() : new Set(allPerms as any),
    }));
  };

  const resetDefaults = () => {
    const m:any={};
    MANAGED_ROLES.forEach(r=>{m[r.key]=new Set(DEFAULTS[r.key]);});
    setMatrix(m);
    toast.success("تم إعادة الضبط للافتراضي");
  };

  const addCustomPerm = () => {
    if(!newPerm.key.trim()||!newPerm.label.trim()) return toast.error("أدخل المفتاح والتسمية");
    const key=newPerm.key.toLowerCase().replace(/\s+/g,".");
    if(customPerms.find(p=>p.key===key)||ALL_PERM_KEYS.includes(key as any))
      return toast.error("المفتاح موجود بالفعل");
    setCustomPerms(p=>[...p,{id:Date.now().toString(),key,label:newPerm.label,group:newPerm.group||"مخصص"}]);
    setNewPerm({key:"",label:"",group:"مخصص"});
    setShowAddCustom(false);
    toast.success("تمت إضافة الصلاحية");
  };

  const removeCustomPerm = (id:string) => {
    const perm=customPerms.find(p=>p.id===id);
    if(!perm) return;
    setCustomPerms(p=>p.filter(x=>x.id!==id));
    setMatrix(prev=>{
      const next={...prev};
      MANAGED_ROLES.forEach(r=>{
        next[r.key]=new Set(prev[r.key]);
        (next[r.key] as Set<any>).delete(perm.key);
      });
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const rows:any[]=[];
    MANAGED_ROLES.forEach(r=>{
      (matrix[r.key] as Set<any>).forEach((perm:string)=>{
        rows.push({role:r.key, permission:perm});
      });
    });
    try {
      await supabase.from("role_permissions" as any).delete().neq("role","developer");
      if(rows.length>0){
        const {error}=await supabase.from("role_permissions" as any).insert(rows);
        if(error) throw error;
      }
      toast.success("✅ تم حفظ الصلاحيات");
    } catch(err:any){
      toast.error("خطأ في الحفظ: "+(err.message||""));
    }
    setSaving(false);
  };

  if (!isSuperAdmin) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Shield className="w-12 h-12 text-muted-foreground/30"/>
      <p className="text-muted-foreground font-bold">غير مصرح لك بالوصول</p>
    </div>
  );

  const activeRole = MANAGED_ROLES.find(r=>r.key===activeTab)!;
  const Icon = activeRole?.icon||Shield;

  /* Combine built-in + custom for display */
  const allSections = [
    ...SECTIONS,
    ...(customPerms.length>0 ? [{
      group:"صلاحيات مخصصة",
      items: customPerms.map(p=>({key:p.key as any, label:p.label}))
    }] : [])
  ];

  return (
    <div className="space-y-5" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Shield className="text-primary w-6 h-6"/> نظام الصلاحيات
          </h1>
          <p className="text-sm text-muted-foreground">
            تحكم في صلاحيات كل دور — Developer و super_admin لديهم كل الصلاحيات دائماً
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetDefaults} className="text-xs px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors font-bold">
            إعادة للافتراضي
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}
            حفظ الصلاحيات
          </button>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {MANAGED_ROLES.map(r=>{
          const Ic=r.icon;
          return (
            <button key={r.key} onClick={()=>setActiveTab(r.key)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${activeTab===r.key?`border-primary bg-primary/5 text-primary`:`border-border hover:border-primary/30 ${r.color}`}`}>
              <Ic className="w-4 h-4 shrink-0"/>{r.label}
            </button>
          );
        })}
      </div>

      {/* Role header card */}
      <div className={`rounded-2xl p-4 border-2 border-primary/20 ${activeRole?.bg||""} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${activeRole?.color}`}/>
          </div>
          <div>
            <div className="font-black">{activeRole?.label}</div>
            <div className="text-xs text-muted-foreground">
              {Array.from(matrix[activeTab]).length} صلاحية من أصل {ALL_PERM_KEYS.length+customPerms.length}
            </div>
          </div>
        </div>
        <button onClick={()=>toggleRole(activeTab)}
          className="text-xs px-3 py-1.5 rounded-xl border border-border hover:bg-muted transition-colors font-bold">
          {ALL_PERM_KEYS.concat(customPerms.map(p=>p.key) as any[]).every(p=>(matrix[activeTab] as Set<any>).has(p))
            ? "إلغاء الكل" : "تحديد الكل"}
        </button>
      </div>

      {/* Permissions by section */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary"/>
        </div>
      ) : (
        <div className="space-y-5">
          {allSections.map(section=>(
            <div key={section.group} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="bg-muted/50 px-4 py-2.5 border-b border-border">
                <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-2">
                  {section.group==="صلاحيات مخصصة" && <Plus className="w-3 h-3"/>}
                  {section.group}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-border/50 sm:divide-y-0 sm:grid-rows-auto">
                {section.items.map((perm,pi)=>{
                  const checked=(matrix[activeTab] as Set<any>).has(perm.key);
                  const isCustom=customPerms.some(p=>p.key===perm.key);
                  return (
                    <div key={perm.key}
                      className={`flex items-center justify-between px-4 py-3 ${pi%2===0?"":"sm:border-r border-border/50"} hover:bg-muted/20 transition-colors`}>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{perm.label}</span>
                        <span className="block text-[10px] text-muted-foreground/50 font-mono">{perm.key}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isCustom && (
                          <button onClick={()=>removeCustomPerm(customPerms.find(p=>p.key===perm.key)!.id)}
                            className="w-5 h-5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors">
                            <Trash2 className="w-3 h-3"/>
                          </button>
                        )}
                        <button onClick={()=>toggle(activeTab,perm.key as any)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border-2 ${checked?"bg-primary border-primary text-white":"border-border hover:border-primary/40 bg-background"}`}>
                          {checked && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add custom permission */}
          <button onClick={()=>setShowAddCustom(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-bold text-sm hover:bg-primary/5 transition-colors">
            <Plus className="w-4 h-4"/> إضافة صلاحية مخصصة
          </button>
        </div>
      )}

      {/* Cross-role matrix toggle at bottom */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-sm font-black mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-primary"/>مقارنة الأدوار دفعة واحدة</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-2 px-3 font-bold text-muted-foreground w-48">الصلاحية</th>
                {MANAGED_ROLES.map(r=>(
                  <th key={r.key} className="py-2 px-2 text-center">
                    <span className={`text-[10px] font-black ${r.color}`}>{r.label}</span>
                  </th>
                ))}
                <th className="py-2 px-2 text-center text-[10px] text-muted-foreground">الكل</th>
              </tr>
            </thead>
            <tbody>
              {SECTIONS.flatMap(s=>s.items).slice(0,8).map((perm,i)=>(
                <tr key={perm.key} className={`border-b border-border/40 hover:bg-muted/20 ${i%2?"bg-muted/10":""}`}>
                  <td className="py-2 px-3 font-medium">{perm.label}</td>
                  {MANAGED_ROLES.map(r=>{
                    const checked=(matrix[r.key] as Set<any>).has(perm.key);
                    return (
                      <td key={r.key} className="py-2 px-2 text-center">
                        <button onClick={()=>toggle(r.key, perm.key as any)}
                          className={`w-5 h-5 rounded flex items-center justify-center mx-auto border-2 transition-all ${checked?"bg-primary border-primary text-white":"border-border hover:border-primary/40"}`}>
                          {checked&&<svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                        </button>
                      </td>
                    );
                  })}
                  <td className="py-2 px-2 text-center">
                    <button onClick={()=>toggleAll(perm.key as any)}
                      className={`w-5 h-5 rounded flex items-center justify-center mx-auto border-2 transition-all ${MANAGED_ROLES.every(r=>(matrix[r.key] as Set<any>).has(perm.key))?"bg-emerald-500 border-emerald-500 text-white":MANAGED_ROLES.some(r=>(matrix[r.key] as Set<any>).has(perm.key))?"bg-amber-400 border-amber-400 text-white":"border-border hover:border-emerald-400"}`}>
                      {MANAGED_ROLES.every(r=>(matrix[r.key] as Set<any>).has(perm.key))&&<svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      {!MANAGED_ROLES.every(r=>(matrix[r.key] as Set<any>).has(perm.key))&&MANAGED_ROLES.some(r=>(matrix[r.key] as Set<any>).has(perm.key))&&<Minus className="w-2.5 h-2.5"/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground mt-2 px-1">يعرض أول 8 صلاحيات فقط — استخدم تبويبات الأدوار أعلاه للتحكم الكامل</p>
        </div>
      </div>

      {/* Add custom permission modal */}
      <AnimatePresence>
        {showAddCustom && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/60 z-50" onClick={()=>setShowAddCustom(false)}/>
            <motion.div initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.95,opacity:0}}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl p-5 shadow-2xl max-w-sm mx-auto border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black flex items-center gap-2"><Plus className="w-4 h-4 text-primary"/> صلاحية مخصصة جديدة</h3>
                <button onClick={()=>setShowAddCustom(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><X className="w-4 h-4"/></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">المفتاح (key)</label>
                  <input value={newPerm.key} onChange={e=>setNewPerm(p=>({...p,key:e.target.value}))}
                    placeholder="custom.feature_name"
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">التسمية (بالعربي)</label>
                  <input value={newPerm.label} onChange={e=>setNewPerm(p=>({...p,label:e.target.value}))}
                    placeholder="وصف الصلاحية"
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">المجموعة</label>
                  <input value={newPerm.group} onChange={e=>setNewPerm(p=>({...p,group:e.target.value}))}
                    placeholder="مخصص"
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                </div>
                <button onClick={addCustomPerm}
                  className="w-full bg-primary text-white py-2.5 rounded-xl font-black text-sm hover:bg-primary/90 transition-all active:scale-95">
                  إضافة الصلاحية
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
