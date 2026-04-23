import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Shield, Edit2, Trash2, X,
  Loader2, Mail, Crown, UserCheck, Megaphone,
  Key, CheckCircle2, Copy, Eye, EyeOff, Lock,
  ChevronDown, Terminal, User, AlertCircle, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

/* ── Role hierarchy: developer > super_admin > editor_in_chief > journalist > ads_manager ── */
const ALL_ROLES = [
  { id:"developer",       label:"Developer",        color:"bg-purple-600",  icon:Terminal,  desc:"وصول كامل + ميزات مخفية عن الباقين",   devOnly:true  },
  { id:"super_admin",     label:"سوبر أدمن",        color:"bg-red-500",     icon:Crown,     desc:"صلاحيات كاملة على كل شيء",             devOnly:false },
  { id:"editor_in_chief", label:"رئيس التحرير",     color:"bg-blue-500",    icon:UserCheck, desc:"تحرير وإدارة كل المحتوى",              devOnly:false },
  { id:"journalist",      label:"صحفي",             color:"bg-green-500",   icon:Users,     desc:"كتابة وتعديل مقالاته فقط",             devOnly:false },
  { id:"ads_manager",     label:"مدير إعلانات",     color:"bg-yellow-500",  icon:Megaphone, desc:"إدارة الإعلانات والإحصائيات",          devOnly:false },
];

const PERM_KEYS: Record<string,string> = {
  articles:"المقالات", categories:"الأقسام", breaking:"الأخبار العاجلة",
  users:"المستخدمون", settings:"الإعدادات", ads:"الإعلانات",
  analytics:"التحليلات", pages:"الصفحات", subscribers:"المشتركون",
  comments:"التعليقات", ai:"أدوات AI / RSS", backup:"النسخ الاحتياطي",
  tags:"الوسوم", permissions:"الصلاحيات",
};

const ROLE_DEFAULTS: Record<string,Record<string,boolean>> = {
  developer:       Object.fromEntries(Object.keys(PERM_KEYS).map(k=>[k,true])),
  super_admin:     Object.fromEntries(Object.keys(PERM_KEYS).map(k=>[k,true])),
  editor_in_chief: Object.fromEntries(Object.keys(PERM_KEYS).map(k=>[k,!["users","settings","backup","permissions"].includes(k)])),
  journalist:      Object.fromEntries(Object.keys(PERM_KEYS).map(k=>[k,["articles","tags","comments"].includes(k)])),
  ads_manager:     Object.fromEntries(Object.keys(PERM_KEYS).map(k=>[k,["ads","analytics"].includes(k)])),
};

function genPassword(len=12) {
  const chars="abcdefghijklmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$!";
  return Array.from({length:len},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
}

export default function UserManagement() {
  const { t } = useLanguage();
  const { user: me } = useAuth();
  const { role: myRole, isSuperAdmin } = usePermissions();

  const isDeveloper = myRole === "developer";
  const canManage   = isDeveloper || isSuperAdmin;

  /* ── visible roles based on current user level ── */
  const visibleRoles = ALL_ROLES.filter(r => isDeveloper || !r.devOnly);

  const [users,     setUsers]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [editUser,  setEditUser]  = useState<any>(null);
  const [saving,    setSaving]    = useState(false);
  const [delConfirm,setDelConfirm]= useState<string|null>(null);

  /* Add form */
  const [form, setForm] = useState({ email:"", displayName:"", username:"", role:"journalist", password:"", autoPass:true, avatarUrl:"" });
  const [showPass, setShowPass]   = useState(false);
  const [addStep,  setAddStep]    = useState<"form"|"done">("form");
  const [createdInfo, setCreatedInfo] = useState<{email:string;password:string;role:string}|null>(null);

  /* Edit form */
  const [editForm, setEditForm]   = useState<any>({});
  const [editPerms, setEditPerms] = useState<Record<string,boolean>>({});
  const [editShowPass, setEditShowPass] = useState(false);

  useEffect(()=>{ loadUsers(); },[]);

  const loadUsers = async () => {
    setLoading(true);
    const [{ data:profiles }, { data:roles }] = await Promise.all([
      supabase.from("profiles").select("id,user_id,display_name,username,created_at,email"),
      supabase.from("user_roles").select("user_id,role,permissions"),
    ]);
    const merged = (profiles||[])
      .map(p=>({...p, roleData:(roles||[]).find(r=>r.user_id===p.user_id)}))
      /* hide developer accounts from non-developers */
      .filter(u => isDeveloper || u.roleData?.role !== "developer")
      /* hide my own account from the list to avoid self-sabotage */
      .filter(u => u.user_id !== me?.id || isDeveloper);
    setUsers(merged);
    setLoading(false);
  };

  /* ── Create user with password ── */
  const handleCreate = async () => {
    if (!form.email.trim()) return toast.error("أدخل البريد الإلكتروني");
    const password = form.autoPass ? genPassword() : form.password;
    if (!password || password.length < 8) return toast.error("كلمة المرور قصيرة جداً (8 أحرف على الأقل)");

    setSaving(true);
    try {
      /* Use Supabase signUp from admin – creates user in auth.users */
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password,
        options: {
          data: {
            display_name: form.displayName || form.email.split("@")[0],
            username: form.username || form.email.split("@")[0].toLowerCase().replace(/\s+/g,"_"),
            force_password_change: true,
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("فشل إنشاء الحساب");

      const uid = data.user.id;

      /* Save profile */
      await supabase.from("profiles").upsert({
        user_id: uid,
        display_name: form.displayName || form.email.split("@")[0],
        username: form.username || form.email.split("@")[0].toLowerCase().replace(/\s+/g,"_"),
        email: form.email.trim(),
      }, { onConflict:"user_id" });

      /* Save role + permissions */
      const perms = ROLE_DEFAULTS[form.role] || ROLE_DEFAULTS.journalist;
      await supabase.from("user_roles").upsert({
        user_id: uid, role: form.role,
        permissions: JSON.stringify(perms),
      }, { onConflict:"user_id" });

      setCreatedInfo({ email: form.email.trim(), password, role: form.role });
      setAddStep("done");
      toast.success("✅ تم إنشاء الحساب");
      loadUsers();
    } catch(err:any) {
      toast.error("فشل الإنشاء: " + (err.message || "خطأ غير معروف"));
    }
    setSaving(false);
  };

  /* ── Save user edits ── */
  const saveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    const uid = editUser.user_id || editUser.id;
    try {
      await supabase.from("profiles").update({
        display_name: editForm.displayName,
        username: editForm.username,
        email: editForm.email,
      }).eq("user_id", uid);

      await supabase.from("user_roles").upsert({
        user_id: uid, role: editForm.role,
        permissions: JSON.stringify(editPerms),
      }, { onConflict:"user_id" });

      if (editForm.newPassword && editForm.newPassword.length >= 8) {
        /* Update via admin API using service key env var if available */
        toast.info("تغيير الباسورد يحتاج صلاحية Admin API – تم حفظ البيانات الأخرى");
      }

      toast.success("✅ تم حفظ التعديلات");
      setSaving(false); setEditUser(null); loadUsers();
    } catch(err:any) {
      toast.error("خطأ: " + (err.message||""));
      setSaving(false);
    }
  };

  /* ── Delete user ── */
  const deleteUser = async (userId:string) => {
    await supabase.from("user_roles").delete().eq("user_id",userId);
    await supabase.from("profiles").delete().eq("user_id",userId);
    toast.success("تم حذف المستخدم");
    setDelConfirm(null); loadUsers();
  };

  const openEdit = (u:any) => {
    setEditUser(u);
    setEditForm({
      displayName: u.display_name||"",
      username: u.username||"",
      email: u.email||"",
      role: u.roleData?.role||"journalist",
      newPassword: "",
    });
    const p = u.roleData?.permissions;
    setEditPerms(typeof p==="string"?JSON.parse(p):(p||{}));
  };

  if (!canManage) return (
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
            <Users className="text-primary w-6 h-6"/> إدارة المستخدمين
            {isDeveloper && <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">Developer Mode</span>}
          </h1>
          <p className="text-sm text-muted-foreground">{users.length} مستخدم مسجّل</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadUsers} className="w-9 h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors">
            <RefreshCw className="w-4 h-4"/>
          </button>
          <button onClick={()=>{setShowAdd(true);setAddStep("form");setForm({email:"",displayName:"",username:"",role:"journalist",password:"",autoPass:true});setCreatedInfo(null);}}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4"/> إضافة مستخدم
          </button>
        </div>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-2">
        {visibleRoles.map(r=>(
          <span key={r.id} className={`text-[10px] text-white px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${r.color}`}>
            <r.icon className="w-2.5 h-2.5"/>{r.label}
          </span>
        ))}
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
      ) : (
        <div className="space-y-2.5">
          {users.map((u,i)=>{
            const roleObj = ALL_ROLES.find(r=>r.id===u.roleData?.role);
            const Icon = roleObj?.icon||User;
            return (
              <motion.div key={u.id||u.user_id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.04}}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 sm:gap-4">
                <div className={`w-11 h-11 rounded-full ${roleObj?.color||"bg-primary"} flex items-center justify-center text-white font-black text-lg shrink-0`}>
                  {(u.display_name||u.email||"?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{u.display_name||"—"}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{u.email||u.username||u.user_id?.slice(0,12)+"..."}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {roleObj && (
                      <span className={`text-[9px] text-white px-2 py-0.5 rounded-full font-bold ${roleObj.color}`}>{roleObj.label}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString("ar-EG")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={()=>openEdit(u)} title="تعديل"
                    className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                    <Edit2 className="w-3.5 h-3.5"/>
                  </button>
                  {isDeveloper && u.user_id !== me?.id && (
                    <button onClick={()=>setDelConfirm(u.user_id||u.id)} title="حذف"
                      className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  )}
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

      {/* ─── Add User Modal ─── */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/60 z-50" onClick={()=>!saving&&setShowAdd(false)}/>
            <motion.div initial={{opacity:0,scale:.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.95}}
              className="fixed inset-x-3 top-1/2 -translate-y-1/2 z-50 bg-card rounded-3xl p-5 shadow-2xl max-w-md mx-auto border border-border overflow-y-auto max-h-[90vh]">

              {addStep==="done" && createdInfo ? (
                <div className="text-center py-4 space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto"/>
                  <div>
                    <h3 className="text-xl font-black">تم إنشاء الحساب!</h3>
                    <p className="text-sm text-muted-foreground mt-1">احتفظ ببيانات الدخول</p>
                  </div>
                  <div className="bg-muted rounded-2xl p-4 text-start space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">البريد الإلكتروني</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-bold bg-background rounded-lg px-3 py-2 border border-border">{createdInfo.email}</code>
                        <button onClick={()=>{navigator.clipboard.writeText(createdInfo.email);toast.success("نُسخ");}}
                          className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"><Copy className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">كلمة المرور الأولية</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-bold bg-background rounded-lg px-3 py-2 border border-border font-mono">{createdInfo.password}</code>
                        <button onClick={()=>{navigator.clipboard.writeText(createdInfo.password);toast.success("نُسخت");}}
                          className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"><Copy className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/>
                      <p className="text-xs text-amber-700 dark:text-amber-300">المستخدم سيُطلب منه تغيير كلمة المرور عند أول دخول</p>
                    </div>
                  </div>
                  <button onClick={()=>setShowAdd(false)}
                    className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm">حسناً</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <Plus className="w-5 h-5 text-primary"/> إضافة مستخدم جديد
                    </h3>
                    <button onClick={()=>setShowAdd(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <X className="w-4 h-4"/>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1.5 block">البريد الإلكتروني *</label>
                      <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                        placeholder="user@example.com" disabled={saving}
                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40 disabled:opacity-50"/>
                    </div>
                    {/* Name */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الاسم</label>
                        <input type="text" value={form.displayName} onChange={e=>setForm(f=>({...f,displayName:e.target.value}))}
                          placeholder="الاسم الكامل" disabled={saving}
                          className="w-full bg-muted border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40 disabled:opacity-50"/>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1.5 block">اسم المستخدم</label>
                        <input type="text" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value.toLowerCase().replace(/\s+/g,"_")}))}
                          placeholder="username" disabled={saving}
                          className="w-full bg-muted border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40 disabled:opacity-50 font-mono"/>
                      </div>
                    </div>
                    {/* Avatar */}
                    <div className="space-y-2">
                      <Label>صورة المستخدم</Label>
                      <div className="flex items-center gap-3">
                        <Input value={form.avatarUrl} onChange={e=>setForm(f=>({...f,avatarUrl:e.target.value}))} placeholder="رابط الصورة أو ارفع من المقالات" />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-muted-foreground">كلمة المرور</label>
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="checkbox" checked={form.autoPass} onChange={e=>setForm(f=>({...f,autoPass:e.target.checked}))}
                            className="w-3.5 h-3.5 rounded accent-primary"/>
                          توليد تلقائي
                        </label>
                      </div>
                      {!form.autoPass && (
                        <div className="relative">
                          <input type={showPass?"text":"password"} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                            placeholder="8 أحرف على الأقل" disabled={saving}
                            className="w-full bg-muted border border-border rounded-xl px-4 pr-4 pl-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 font-mono"/>
                          <button type="button" onClick={()=>setShowPass(s=>!s)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                          </button>
                        </div>
                      )}
                      {form.autoPass && (
                        <div className="bg-muted border border-dashed border-primary/30 rounded-xl px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                          <Key className="w-3.5 h-3.5 text-primary shrink-0"/>
                          سيتم توليد كلمة مرور عشوائية آمنة
                        </div>
                      )}
                    </div>
                    {/* Role */}
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-2 block">الدور الوظيفي</label>
                      <div className="grid grid-cols-2 gap-2">
                        {visibleRoles.map(role=>(
                          <button key={role.id} onClick={()=>setForm(f=>({...f,role:role.id}))}
                            className={`p-3 rounded-xl border-2 text-start transition-all ${form.role===role.id?"border-primary bg-primary/5":"border-border hover:border-primary/30"}`}>
                            <div className={`w-7 h-7 ${role.color} rounded-lg flex items-center justify-center mb-1.5`}>
                              <role.icon className="w-3.5 h-3.5 text-white"/>
                            </div>
                            <div className="text-xs font-black leading-tight">{role.label}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{role.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={handleCreate} disabled={saving||!form.email}
                      className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-all active:scale-95">
                      {saving?<><Loader2 className="w-4 h-4 animate-spin"/>جاري الإنشاء...</>:<><Plus className="w-4 h-4"/>إنشاء الحساب</>}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Edit User Bottom Sheet ─── */}
      <AnimatePresence>
        {editUser && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/60 z-50" onClick={()=>!saving&&setEditUser(null)}/>
            <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
              transition={{type:"spring",damping:30,stiffness:300}}
              className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-5">
                <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-4"/>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-black flex items-center gap-2"><Edit2 className="w-4 h-4 text-primary"/> تعديل المستخدم</h3>
                  <button onClick={()=>setEditUser(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><X className="w-4 h-4"/></button>
                </div>

                <div className="space-y-4">
                  {/* Basic info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">الاسم</label>
                      <input value={editForm.displayName||""} onChange={e=>setEditForm((f:any)=>({...f,displayName:e.target.value}))}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">اسم المستخدم</label>
                      <input value={editForm.username||""} onChange={e=>setEditForm((f:any)=>({...f,username:e.target.value}))}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">البريد الإلكتروني</label>
                    <input type="email" value={editForm.email||""} onChange={e=>setEditForm((f:any)=>({...f,email:e.target.value}))}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                  </div>

                  {/* New password */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block flex items-center gap-1"><Lock className="w-3 h-3"/>تغيير كلمة المرور (اختياري)</label>
                    <div className="relative">
                      <input type={editShowPass?"text":"password"} value={editForm.newPassword||""}
                        onChange={e=>setEditForm((f:any)=>({...f,newPassword:e.target.value}))}
                        placeholder="اتركه فارغاً للإبقاء على الحالي"
                        className="w-full bg-muted border border-border rounded-xl px-4 pl-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono placeholder:font-sans"/>
                      <button type="button" onClick={()=>setEditShowPass(s=>!s)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {editShowPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-2 block">الدور</label>
                    <div className="flex flex-wrap gap-2">
                      {visibleRoles.map(r=>(
                        <button key={r.id} onClick={()=>{setEditForm((f:any)=>({...f,role:r.id}));setEditPerms(ROLE_DEFAULTS[r.id]||{});}}
                          className={`text-xs px-3 py-1.5 rounded-xl border-2 font-bold transition-all ${editForm.role===r.id?"border-primary bg-primary/5 text-primary":"border-border hover:border-primary/30 text-muted-foreground"}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-2 block flex items-center gap-1"><Shield className="w-3 h-3"/>الصلاحيات المخصصة</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(PERM_KEYS).map(([key,label])=>(
                        <button key={key} onClick={()=>setEditPerms(p=>({...p,[key]:!p[key]}))}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-bold transition-all text-start ${editPerms[key]?"border-primary bg-primary/5 text-primary":"border-border text-muted-foreground hover:border-primary/30"}`}>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${editPerms[key]?"bg-primary":"bg-muted-foreground/30"}`}/>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={saveEdit} disabled={saving}
                    className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-all active:scale-95 mt-2">
                    {saving?<><Loader2 className="w-4 h-4 animate-spin"/>جاري الحفظ...</>:<>حفظ التعديلات</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm ─── */}
      <AnimatePresence>
        {delConfirm && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/60 z-50" onClick={()=>setDelConfirm(null)}/>
            <motion.div initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.9,opacity:0}}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl p-6 shadow-2xl max-w-sm mx-auto border border-border text-center">
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3"/>
              <h3 className="font-black text-lg">تأكيد الحذف</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-5">هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع.</p>
              <div className="flex gap-3">
                <button onClick={()=>setDelConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-muted transition-colors">إلغاء</button>
                <button onClick={()=>deleteUser(delConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-colors">حذف</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
