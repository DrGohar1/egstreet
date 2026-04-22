import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Shield, Edit2, Trash2, Check, X,
  Loader2, Save, Mail, Crown, UserCheck, Megaphone,
  ChevronDown, Key, AlertCircle, CheckCircle2, Copy
} from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  { id:"super_admin",     label:"سوبر أدمن",       color:"bg-red-500",    icon:Crown,       desc:"صلاحيات كاملة على كل شيء" },
  { id:"editor_in_chief", label:"رئيس التحرير",     color:"bg-blue-500",   icon:UserCheck,   desc:"تحرير وإدارة كل المحتوى" },
  { id:"journalist",      label:"صحفي",             color:"bg-green-500",  icon:Users,       desc:"كتابة وتعديل مقالاته فقط" },
  { id:"ads_manager",     label:"مدير إعلانات",     color:"bg-yellow-500", icon:Megaphone,   desc:"إدارة الإعلانات والإحصائيات" },
];

const PERMS: Record<string,string> = {
  articles:"المقالات", categories:"الأقسام", breaking:"الأخبار العاجلة",
  users:"المستخدمون", settings:"الإعدادات", ads:"الإعلانات",
  analytics:"التحليلات", pages:"الصفحات", subscribers:"المشتركون",
  comments:"التعليقات", ai:"أدوات AI / RSS", backup:"النسخ الاحتياطي",
  tags:"الوسوم", permissions:"الصلاحيات",
};

const ROLE_DEFAULTS: Record<string,Record<string,boolean>> = {
  super_admin:     Object.fromEntries(Object.keys(PERMS).map(k=>[k,true])),
  editor_in_chief: Object.fromEntries(Object.keys(PERMS).map(k=>[k,!["users","settings","backup","permissions"].includes(k)])),
  journalist:      Object.fromEntries(Object.keys(PERMS).map(k=>[k,["articles","tags"].includes(k)])),
  ads_manager:     Object.fromEntries(Object.keys(PERMS).map(k=>[k,["ads","analytics"].includes(k)])),
};

export default function UserManagement() {
  const { t } = useLanguage();
  const { isSuperAdmin } = usePermissions();
  const [users,    setUsers]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [saving,   setSaving]   = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteDone, setInviteDone] = useState(false);
  const [form, setForm] = useState({ email:"", displayName:"", role:"journalist" });
  const [customPerms, setCustomPerms] = useState<Record<string,boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null);

  useEffect(()=>{ loadUsers(); },[]);

  const loadUsers = async () => {
    setLoading(true);
    const [{ data:profiles }, { data:roles }] = await Promise.all([
      supabase.from("profiles").select("id,user_id,display_name,created_at"),
      supabase.from("user_roles").select("user_id,role,permissions"),
    ]);
    const merged = (profiles||[]).map(p=>({
      ...p,
      roleData: (roles||[]).find(r=>r.user_id===p.user_id),
    }));
    setUsers(merged);
    setLoading(false);
  };

  /* ── Invite by Email ── */
  const handleInvite = async () => {
    if (!form.email.trim()) return toast.error("أدخل البريد الإلكتروني");
    setInviting(true);
    try {
      // Use Supabase Admin API via service role
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: form.email,
            email_confirm: true,
            user_metadata: { display_name: form.displayName || form.email.split("@")[0] },
          }),
        }
      );
      const created = await res.json();

      if (created.id) {
        // Set profile display name
        await supabase.from("profiles").upsert({
          user_id: created.id,
          display_name: form.displayName || form.email.split("@")[0],
        }, { onConflict:"user_id" });

        // Set role
        const perms = ROLE_DEFAULTS[form.role] || ROLE_DEFAULTS.journalist;
        await supabase.from("user_roles").upsert({
          user_id: created.id,
          role: form.role,
          permissions: JSON.stringify(perms),
        }, { onConflict:"user_id" });

        // Send invite email via Supabase auth
        await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        setInviteDone(true);
        toast.success(`✅ تم إرسال دعوة إلى ${form.email}`);
        setTimeout(()=>{ setInviteDone(false); setShowAdd(false); setForm({email:"",displayName:"",role:"journalist"}); loadUsers(); }, 3000);
      } else {
        throw new Error(created.msg || created.error_description || "فشل الإنشاء");
      }
    } catch(err:any) {
      // Fallback: just send password reset link
      try {
        await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setInviteDone(true);
        toast.success(`✅ تم إرسال رابط الدعوة إلى ${form.email}`);
        setTimeout(()=>{ setInviteDone(false); setShowAdd(false); setForm({email:"",displayName:"",role:"journalist"}); loadUsers(); }, 3000);
      } catch(e:any) {
        toast.error("فشل الإرسال: " + (err.message || "خطأ غير معروف"));
      }
    }
    setInviting(false);
  };

  /* ── Edit permissions ── */
  const openEdit = (u:any) => {
    setEditUser(u);
    const p = u.roleData?.permissions;
    setCustomPerms(typeof p==="string"?JSON.parse(p):(p||{}));
  };

  const savePerms = async () => {
    if (!editUser) return;
    setSaving(true);
    const uid = editUser.user_id || editUser.id;
    await supabase.from("user_roles").upsert({
      user_id: uid, role: editUser.roleData?.role || "journalist",
      permissions: JSON.stringify(customPerms),
    }, { onConflict:"user_id" });
    await supabase.from("profiles").update({ display_name: editUser.display_name })
      .eq("user_id", uid);
    toast.success("✅ تم حفظ الصلاحيات");
    setSaving(false); setEditUser(null); loadUsers();
  };

  const changeRole = async (userId:string, role:string) => {
    const perms = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.journalist;
    await supabase.from("user_roles").upsert({
      user_id: userId, role,
      permissions: JSON.stringify(perms),
    }, { onConflict:"user_id" });
    toast.success("تم تغيير الدور");
    loadUsers();
  };

  const togglePerm = (key:string) =>
    setCustomPerms(p=>({...p,[key]:!p[key]}));

  if (!isSuperAdmin) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Shield className="w-12 h-12 text-muted-foreground/30"/>
      <p className="text-muted-foreground font-bold">غير مصرح لك بالوصول</p>
    </div>
  );

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Users className="text-primary"/> إدارة المستخدمين
          </h1>
          <p className="text-sm text-muted-foreground">{users.length} مستخدم مسجل</p>
        </div>
        <button onClick={()=>setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm">
          <Mail className="w-4 h-4"/> دعوة مستخدم جديد
        </button>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary"/>
        </div>
      ) : (
        <div className="grid gap-3">
          {users.map((u,i)=>{
            const role = ROLES.find(r=>r.id===u.roleData?.role);
            const Icon = role?.icon || Users;
            return (
              <motion.div key={u.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.04}}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full ${role?.color||"bg-primary"} flex items-center justify-center text-white font-black text-lg shrink-0`}>
                  {(u.display_name||u.id||"?")[0].toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{u.display_name||"بدون اسم"}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {role && (
                      <span className={`text-[10px] text-white px-2 py-0.5 rounded-full font-bold ${role.color}`}>
                        {role.label}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                </div>
                {/* Role selector */}
                <div className="relative hidden sm:block">
                  <select
                    value={u.roleData?.role||"journalist"}
                    onChange={e=>changeRole(u.user_id||u.id, e.target.value)}
                    className="appearance-none text-xs bg-muted border border-border rounded-lg px-3 py-1.5 pe-7 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {ROLES.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute top-1/2 -translate-y-1/2 end-2 pointer-events-none text-muted-foreground"/>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={()=>openEdit(u)}
                    className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                    <Key className="w-4 h-4"/>
                  </button>
                </div>
              </motion.div>
            );
          })}
          {users.length===0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30"/>
              <p>لا يوجد مستخدمون بعد</p>
            </div>
          )}
        </div>
      )}

      {/* ── Invite Modal ── */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/60 z-50" onClick={()=>!inviting&&setShowAdd(false)}/>
            <motion.div initial={{opacity:0,scale:.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.95}}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-card rounded-3xl p-6 shadow-2xl max-w-md mx-auto border border-border">

              {inviteDone ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3"/>
                  <h3 className="text-xl font-black mb-1">تم الإرسال!</h3>
                  <p className="text-muted-foreground text-sm">تم إرسال رابط الدعوة إلى<br/><strong>{form.email}</strong></p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary"/> دعوة مستخدم جديد
                    </h3>
                    <button onClick={()=>setShowAdd(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70">
                      <X className="w-4 h-4"/>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1.5 block">البريد الإلكتروني *</label>
                      <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                        placeholder="user@example.com"
                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"/>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الاسم (اختياري)</label>
                      <input type="text" value={form.displayName} onChange={e=>setForm(f=>({...f,displayName:e.target.value}))}
                        placeholder="اسم المستخدم"
                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"/>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الدور الوظيفي</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ROLES.map(role=>(
                          <button key={role.id} onClick={()=>setForm(f=>({...f,role:role.id}))}
                            className={`p-3 rounded-xl border-2 text-start transition-all ${form.role===role.id?"border-primary bg-primary/5":"border-border hover:border-primary/30"}`}>
                            <div className={`w-7 h-7 ${role.color} rounded-lg flex items-center justify-center mb-1.5`}>
                              <role.icon className="w-3.5 h-3.5 text-white"/>
                            </div>
                            <div className="text-xs font-black">{role.label}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{role.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
                      <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"/>
                      <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        سيتلقى المستخدم بريداً إلكترونياً يحتوي على رابط لضبط كلمة المرور والدخول
                      </p>
                    </div>

                    <button onClick={handleInvite} disabled={inviting||!form.email}
                      className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-primary/90">
                      {inviting ? <><Loader2 className="w-4 h-4 animate-spin"/> جاري الإرسال...</> : <><Mail className="w-4 h-4"/> إرسال الدعوة</>}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Edit Permissions Modal ── */}
      <AnimatePresence>
        {editUser && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/60 z-50" onClick={()=>!saving&&setEditUser(null)}/>
            <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:40}}
              className="fixed inset-x-3 bottom-0 z-50 bg-card rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto border-t border-border">
              <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-4"/>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-black flex items-center gap-2"><Key className="w-4 h-4 text-primary"/> تعديل الصلاحيات</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{editUser.display_name||"مستخدم"}</p>
                </div>
                <button onClick={()=>setEditUser(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              {/* Role tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {ROLES.map(r=>(
                  <button key={r.id}
                    onClick={()=>{
                      setEditUser((u:any)=>({...u,roleData:{...u.roleData,role:r.id}}));
                      setCustomPerms(ROLE_DEFAULTS[r.id]||{});
                    }}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-bold border transition-all ${editUser.roleData?.role===r.id?"bg-primary text-white border-primary":"border-border hover:border-primary/40"}`}>
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Permissions grid */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {Object.entries(PERMS).map(([key,label])=>(
                  <button key={key} onClick={()=>togglePerm(key)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all text-start ${customPerms[key]?"border-primary bg-primary/5 text-primary":"border-border text-muted-foreground"}`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${customPerms[key]?"bg-primary border-primary":"border-muted-foreground/30"}`}>
                      {customPerms[key] && <Check className="w-3 h-3 text-white"/>}
                    </div>
                    {label}
                  </button>
                ))}
              </div>

              <button onClick={savePerms} disabled={saving}
                className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>جاري الحفظ...</> : <><Save className="w-4 h-4"/>حفظ الصلاحيات</>}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
