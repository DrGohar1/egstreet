import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { useLanguage } from "@/contexts/LanguageContext";
import ImageUploader from "@/components/ImageUploader";
import {
  Users, Plus, Search, X, Pencil, Trash2, Eye, EyeOff,
  Shield, ShieldCheck, ShieldAlert, Star, Loader2,
  Copy, RefreshCw, Check, Mail, Lock, UserCog, Image as ImageIcon, Key
} from "lucide-react";
import { toast } from "sonner";

/* ── Role hierarchy ── */
/* Roles exactly match the DB enum app_role: super_admin | editor_in_chief | journalist | ads_manager */
const ROLES = [
  { id:"super_admin",    label:"سوبر أدمن",    desc:"إدارة كاملة بما فيها المستخدمين", color:"bg-rose-600",   badge:"bg-rose-500/20 text-rose-400",    icon:ShieldAlert },
  { id:"editor_in_chief",label:"رئيس التحرير", desc:"نشر وإدارة المحتوى كاملاً",       color:"bg-amber-600",  badge:"bg-amber-500/20 text-amber-400",  icon:ShieldCheck },
  { id:"journalist",     label:"صحفي",         desc:"كتابة وتحرير المقالات",            color:"bg-blue-600",   badge:"bg-blue-500/20 text-blue-400",    icon:Shield      },
  { id:"ads_manager",    label:"مدير إعلانات", desc:"إدارة الإعلانات والعروض",          color:"bg-green-600",  badge:"bg-green-500/20 text-green-400",  icon:Star        },
];

const PERM_KEYS: Record<string,string> = {
  articles:"المقالات", categories:"الأقسام", tags:"الوسوم",
  breaking:"عاجل", media:"الوسائط", ads:"الإعلانات",
  analytics:"التحليلات", users:"المستخدمين",
  settings:"الإعدادات", permissions:"الصلاحيات",
};
const ROLE_DEFAULTS: Record<string,Record<string,boolean>> = {
  super_admin:    Object.fromEntries(Object.keys(PERM_KEYS).map(k=>[k,true])),
  editor_in_chief:Object.fromEntries(Object.keys(PERM_KEYS).map(k=>[k,!["users","settings","permissions"].includes(k)])),
  journalist:     { articles:true, categories:true, tags:true, breaking:false, media:true, ads:false, analytics:false, users:false, settings:false, permissions:false },
  ads_manager:    { articles:false, categories:false, tags:false, breaking:false, media:true, ads:true, analytics:true, users:false, settings:false, permissions:false },
};
function genPassword(len=14){ return Array.from(crypto.getRandomValues(new Uint8Array(len))).map(b=>"abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789@#$%"[b%60]).join(""); }
const fmt=(d:string)=>new Date(d).toLocaleDateString("ar-EG",{day:"2-digit",month:"short",year:"numeric"});

type UserRow = {
  id:string; email:string; created_at:string; last_sign_in_at?:string;
  display_name?:string; username?:string; avatar_url?:string;
  role:string; permissions:Record<string,boolean>;
};

export default function UserManagement() {
  const { role:myRole } = usePermissions();
  const { t, language } = useLanguage();
  const isSuperAdmin = myRole==="super_admin";
  if (!isSuperAdmin) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
      <Shield className="w-16 h-16 opacity-10"/>
      <p className="font-bold text-lg">صلاحية مرفوضة</p>
      <p className="text-sm">هذه الصفحة للمسؤولين فقط</p>
    </div>
  );

  const [users,      setUsers]      = useState<UserRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [panel,      setPanel]      = useState<"none"|"add"|"edit"|"permissions">("none");
  const [selected,   setSelected]   = useState<UserRow|null>(null);
  const [createdInfo,setCreatedInfo]= useState<{email:string;pass:string}|null>(null);
  const [delId,      setDelId]      = useState<string|null>(null);

  /* ── add form ── */
  const [addForm, setAddForm] = useState({ email:"", displayName:"", username:"", role:"journalist" as "super_admin"|"editor_in_chief"|"journalist"|"ads_manager", password:"", autoPass:true, avatarUrl:"", mustChangePass:true });
  const [addStep, setAddStep] = useState<"form"|"done">("form");
  const [addLoading, setAddLoading] = useState(false);
  const [addShowPass, setAddShowPass] = useState(false);

  /* ── edit form ── */
  const [editForm, setEditForm] = useState({ displayName:"", username:"", role:"journalist", newPassword:"", avatarUrl:"", permissions:{} as Record<string,boolean> });
  const [editShowPass, setEditShowPass] = useState(false);
  const [editLoading,  setEditLoading]  = useState(false);
  const [editAvatarMode, setEditAvatarMode] = useState(false);

  /* ── fetch ── */
  const fetchUsers = async () => {
    setLoading(true);
    const [{ data:profiles }, { data:roles }] = await Promise.all([
      supabase.from("profiles").select("id,user_id,email,created_at,display_name,username,avatar_url"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const merged = (profiles||[]).map(p=>({
      ...p,
      display_name: p.display_name||"",
      username: p.username||"",
      avatar_url: p.avatar_url||"",
      role: (roles||[]).find(r=>r.user_id===p.user_id)?.role||"journalist",
      permissions: ROLE_DEFAULTS[(roles||[]).find(r=>r.user_id===p.user_id)?.role||"journalist"] || ROLE_DEFAULTS["journalist"],
    }));
    setUsers(merged);
    setLoading(false);
  };
  useEffect(()=>{ fetchUsers(); },[]);

  /* ── filter ── */
  const filtered = users.filter(u=>{
    const q=search.toLowerCase();
    const matchQ = !q || u.email?.toLowerCase().includes(q) || u.display_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
    const matchR = roleFilter==="all" || u.role===roleFilter;
    return matchQ && matchR;
  });

  /* ── create user ── */
  const handleCreate = async () => {
    const pass = addForm.autoPass ? genPassword() : addForm.password;
    if (!addForm.email.includes("@")) return toast.error("أدخل بريد إلكتروني صحيح");
    if (pass.length < 8) return toast.error("كلمة المرور 8 أحرف على الأقل");
    setAddLoading(true);
    try {
      const { data: rpcData, error: rpcErr } = await (supabase as any).rpc("admin_create_user", {
        p_email: addForm.email.trim(),
        p_password: pass,
        p_display_name: addForm.displayName.trim() || addForm.email.split("@")[0],
        p_role: addForm.role,
        p_must_change_password: addForm.mustChangePass ?? true,
      });
      if (rpcErr) throw new Error(rpcErr.message);
      const uidFinal = rpcData?.user_id || rpcData;
      if (uidFinal && addForm.avatarUrl) {
        await supabase.from("profiles").update({ avatar_url: addForm.avatarUrl }).eq("user_id", uidFinal);
      }
      setCreatedInfo({ email: addForm.email.trim(), pass });
      setAddStep("done");
      fetchUsers();
      toast.success("تم إنشاء المستخدم بنجاح ✅");
    } catch(e:any) {
      toast.error(e.message || "فشل إنشاء المستخدم");
    } finally { setAddLoading(false); }
  };

  /* ── edit user ── */
  const openEdit = (u:UserRow) => {
    setSelected(u);
    setEditForm({ displayName:u.display_name||"", username:u.username||"", role:u.role, newPassword:"", avatarUrl:u.avatar_url||"", permissions:{...u.permissions} });
    setEditAvatarMode(false);
    setPanel("edit");
  };

  const handleEdit = async () => {
    if (!selected) return;
    setEditLoading(true);
    try {
      const uid = selected.user_id || selected.id;
      const { error: profErr } = await supabase.from("profiles").update({
        display_name: editForm.displayName.trim() || null,
        username: editForm.username.trim().toLowerCase() || null,
        avatar_url: editForm.avatarUrl || null,
      }).eq("user_id", uid);
      if (profErr) throw new Error(profErr.message);
      const { error: roleErr } = await supabase.from("user_roles")
        .upsert({ user_id: uid, role: editForm.role }, { onConflict: "user_id" });
      if (roleErr) throw new Error(roleErr.message);
      if (editForm.newPassword && editForm.newPassword.length >= 8) {
        await (supabase as any).rpc("admin_change_password", {
          target_user_id: uid, new_password: editForm.newPassword,
        }).catch(() => {});
      }
      toast.success("تم الحفظ ✅");
      setPanel("none");
      fetchUsers();
    } catch(e:any) {
      toast.error(e.message || "فشل الحفظ");
    } finally { setEditLoading(false); }
  };

  /* ── delete user ── */
  const handleDelete = async () => {
    if (!delId) return;
    try {
      await supabase.from("profiles").delete().eq("user_id",delId);
      await supabase.from("user_roles").delete().eq("user_id",delId);
      setUsers(u=>u.filter(x=>x.id!==delId));
      setDelId(null);
      toast.success("تم حذف المستخدم");
    } catch(e:any){ toast.error(e.message||"فشل الحذف"); }
  };

  /* ── stats ── */
  const stats = ROLES.map(r=>({ ...r, count:users.filter(u=>u.role===r.id).length }));
  const visibleRoles = ROLES;

  /* ── render ── */
  return (
    <div className="space-y-5 pb-20" dir="rtl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary"/>إدارة المستخدمين
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{users.length} مستخدم مسجّل</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} className="w-9 h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground"/>
          </button>
          <button onClick={()=>{ setPanel("add"); setAddStep("form"); setAddForm({email:"",displayName:"",username:"",role:"journalist",password:"",autoPass:true,avatarUrl:""}); setCreatedInfo(null); }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-black text-sm hover:bg-primary/85 transition-colors">
            <Plus className="w-4 h-4"/>مستخدم جديد
          </button>
        </div>
      </div>

      {/* ── Stats pills ── */}
      <div className="flex flex-wrap gap-2">
        {stats.map(r=>(
          <button key={r.id} onClick={()=>setRoleFilter(prev=>prev===r.id?"all":r.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${roleFilter===r.id?r.badge+" border-current":"border-border bg-card hover:bg-muted text-muted-foreground"}`}>
            <r.icon className="w-3 h-3"/>{r.label}
            <span className="opacity-70">({r.count})</span>
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو الإيميل..."
          className="w-full bg-card border border-border rounded-xl ps-9 pe-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
        {search && <button onClick={()=>setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground"/></button>}
      </div>

      {/* ── User table (desktop) / Cards (mobile) ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary/40"/>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-start px-4 py-3 text-xs font-black text-muted-foreground">المستخدم</th>
                    <th className="text-start px-4 py-3 text-xs font-black text-muted-foreground">البريد</th>
                    <th className="text-start px-4 py-3 text-xs font-black text-muted-foreground">الدور</th>
                    <th className="text-start px-4 py-3 text-xs font-black text-muted-foreground">الصلاحيات</th>
                    <th className="text-start px-4 py-3 text-xs font-black text-muted-foreground">تاريخ الإنشاء</th>
                    <th className="text-center px-4 py-3 text-xs font-black text-muted-foreground">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u,i)=>{
                    const roleObj = ROLES.find(r=>r.id===u.role)||ROLES[3];
                    const Icon = roleObj.icon;
                    const permCount = Object.values(u.permissions).filter(Boolean).length;
                    return (
                      <motion.tr key={u.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0,transition:{delay:i*0.02}}}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {u.avatar_url
                              ? <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-primary/10"/>
                              : <div className={`w-9 h-9 rounded-full ${roleObj.color} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                                  {(u.display_name||u.email||"?")[0].toUpperCase()}
                                </div>
                            }
                            <div>
                              <p className="font-bold text-foreground text-sm leading-tight">{u.display_name||"—"}</p>
                              {u.username && <p className="text-[10px] text-muted-foreground">@{u.username}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${roleObj.badge}`}>
                            <Icon className="w-3 h-3"/>{roleObj.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <div className="w-16 bg-muted rounded-full h-1.5">
                              <div className="bg-primary h-1.5 rounded-full transition-all" style={{width:`${(permCount/Object.keys(PERM_KEYS).length)*100}%`}}/>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{permCount}/{Object.keys(PERM_KEYS).length}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(u.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={()=>openEdit(u)}
                              className="w-7 h-7 rounded-lg hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors" title="تعديل">
                              <Pencil className="w-3.5 h-3.5"/>
                            </button>
                            <button onClick={()=>setDelId(u.id)} disabled={u.id===selected?.id}
                              className="w-7 h-7 rounded-lg hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-colors" title="حذف">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                  {filtered.length===0 && (
                    <tr><td colSpan={6} className="text-center py-16 text-muted-foreground text-sm">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-10"/>لا يوجد مستخدمون
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((u,i)=>{
              const roleObj=ROLES.find(r=>r.id===u.role)||ROLES[3];
              const Icon=roleObj.icon;
              return (
                <motion.div key={u.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0,transition:{delay:i*0.03}}}
                  className="bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3">
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-primary/10"/>
                    : <div className={`w-11 h-11 rounded-full ${roleObj.color} flex items-center justify-center text-white font-black text-base shrink-0`}>
                        {(u.display_name||u.email||"?")[0].toUpperCase()}
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight truncate">{u.display_name||u.email}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 ${roleObj.badge}`}>
                      <Icon className="w-2.5 h-2.5"/>{roleObj.label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={()=>openEdit(u)}
                      className="w-8 h-8 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors">
                      <Pencil className="w-3.5 h-3.5"/>
                    </button>
                    <button onClick={()=>setDelId(u.id)}
                      className="w-8 h-8 rounded-xl bg-muted hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-colors">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length===0 && (
              <div className="text-center py-16 text-muted-foreground text-sm">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-10"/>لا يوجد مستخدمون
              </div>
            )}
          </div>
        </>
      )}

      {/* ────── Slide-over Panel ────── */}
      <AnimatePresence>
        {panel!=="none" && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={()=>setPanel("none")}/>
            <motion.aside
              initial={{x:language==="ar"?"-100%":"100%"}} animate={{x:0}} exit={{x:language==="ar"?"-100%":"100%"}}
              transition={{type:"spring",stiffness:300,damping:30}}
              className="fixed inset-y-0 start-0 w-full max-w-md bg-card border-e border-border z-50 flex flex-col shadow-2xl overflow-y-auto"
              dir="rtl">

              {/* Panel header */}
              <div className="flex items-center justify-between p-5 border-b border-border shrink-0 sticky top-0 bg-card z-10">
                <h2 className="text-lg font-black flex items-center gap-2">
                  {panel==="add"
                    ? <><Plus className="w-5 h-5 text-primary"/>مستخدم جديد</>
                    : <><UserCog className="w-5 h-5 text-primary"/>تعديل: {selected?.display_name||selected?.email}</>
                  }
                </h2>
                <button onClick={()=>setPanel("none")} className="w-8 h-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              {/* ─── ADD FORM ─── */}
              {panel==="add" && (
                <div className="flex-1 p-5 space-y-4">
                  {addStep==="form" ? (
                    <>
                      {/* Email */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/>البريد الإلكتروني *</label>
                        <input type="email" value={addForm.email} onChange={e=>setAddForm(f=>({...f,email:e.target.value}))}
                          placeholder="user@egstreet.com"
                          className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                      </div>
                      {/* Display name */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">الاسم الكامل</label>
                        <input value={addForm.displayName} onChange={e=>setAddForm(f=>({...f,displayName:e.target.value}))}
                          placeholder="محمد أحمد"
                          className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                      </div>
                      {/* Username */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">اسم المستخدم</label>
                        <input value={addForm.username} onChange={e=>setAddForm(f=>({...f,username:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"")}))}
                          placeholder="m.ahmed" dir="ltr"
                          className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                      </div>
                      {/* Password */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1.5"><Key className="w-3.5 h-3.5"/>كلمة المرور</label>
                        <div className="flex items-center gap-2 mb-2">
                          <button onClick={()=>setAddForm(f=>({...f,autoPass:true}))}
                            className={`flex-1 text-xs py-1.5 rounded-xl border-2 font-bold transition-all ${addForm.autoPass?"border-primary bg-primary/5 text-primary":"border-border text-muted-foreground"}`}>
                            توليد تلقائي
                          </button>
                          <button onClick={()=>setAddForm(f=>({...f,autoPass:false}))}
                            className={`flex-1 text-xs py-1.5 rounded-xl border-2 font-bold transition-all ${!addForm.autoPass?"border-primary bg-primary/5 text-primary":"border-border text-muted-foreground"}`}>
                            تحديد يدوي
                          </button>
                        </div>
                        {!addForm.autoPass && (
                          <div className="relative">
                            <input type={addShowPass?"text":"password"} value={addForm.password}
                              onChange={e=>setAddForm(f=>({...f,password:e.target.value}))}
                              placeholder="8 أحرف على الأقل" dir="ltr"
                              className="w-full bg-muted border border-border rounded-xl px-4 pe-10 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                            <button type="button" onClick={()=>setAddShowPass(s=>!s)}
                              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {addShowPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Must change password toggle */}
                      <button type="button" onClick={()=>setAddForm(f=>({...f,mustChangePass:!f.mustChangePass}))}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${addForm.mustChangePass?"border-amber-500 bg-amber-500/10":"border-border hover:border-muted-foreground"}`}>
                        <div className="flex items-center gap-2 text-start">
                          <Key className={`w-4 h-4 ${addForm.mustChangePass?"text-amber-500":"text-muted-foreground"}`}/>
                          <div>
                            <p className={`text-xs font-bold ${addForm.mustChangePass?"text-amber-600":"text-muted-foreground"}`}>تغيير كلمة المرور عند أول دخول</p>
                            <p className="text-[10px] text-muted-foreground">المستخدم مجبور يغيّر الباسورد</p>
                          </div>
                        </div>
                        <div className={`w-8 h-4 rounded-full transition-all flex items-center px-0.5 ${addForm.mustChangePass?"bg-amber-500 justify-end":"bg-muted justify-start"}`}>
                          <div className="w-3 h-3 bg-white rounded-full shadow"/>
                        </div>
                      </button>
                      {/* Role */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-2 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5"/>الدور</label>
                        <div className="grid grid-cols-2 gap-2">
                          {visibleRoles.map(r=>(
                            <button key={r.id} onClick={()=>setAddForm(f=>({...f,role:r.id}))}
                              className={`p-3 rounded-xl border-2 text-start transition-all ${addForm.role===r.id?"border-primary bg-primary/5":"border-border hover:border-primary/30"}`}>
                              <div className={`w-6 h-6 ${r.color} rounded-lg flex items-center justify-center mb-1.5`}>
                                <r.icon className="w-3.5 h-3.5 text-white"/>
                              </div>
                              <div className="text-xs font-black leading-tight">{r.label}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{r.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Avatar URL or upload */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5"/>صورة الملف الشخصي</label>
                        <input value={addForm.avatarUrl} onChange={e=>setAddForm(f=>({...f,avatarUrl:e.target.value}))}
                          placeholder="https://... (اختياري)"
                          className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-2" dir="ltr"/>
                        <ImageUploader
                          bucket="media" folder="avatars"
                          onUploaded={url=>setAddForm(f=>({...f,avatarUrl:url}))}
                          label="أو ارفع صورة مباشرة"
                        />
                      </div>
                      {/* Submit */}
                      <button onClick={handleCreate} disabled={addLoading}
                        className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm hover:bg-primary/85 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                        {addLoading ? <><Loader2 className="w-4 h-4 animate-spin"/>جارٍ الإنشاء...</> : <>إنشاء المستخدم</>}
                      </button>
                    </>
                  ) : (
                    /* Done step */
                    <div className="flex flex-col items-center gap-5 py-8">
                      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="w-10 h-10 text-green-500"/>
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-black text-foreground mb-1">تم الإنشاء ✓</h3>
                        <p className="text-sm text-muted-foreground">احتفظ ببيانات الدخول</p>
                      </div>
                      <div className="w-full bg-muted rounded-2xl p-4 space-y-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">البريد الإلكتروني</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-sm font-mono bg-background border border-border rounded-xl px-3 py-2 text-foreground truncate">{createdInfo?.email}</code>
                            <button onClick={()=>{navigator.clipboard.writeText(createdInfo?.email||"");toast.success("نُسخ");}}
                              className="w-9 h-9 rounded-xl border border-border hover:bg-background flex items-center justify-center transition-colors shrink-0">
                              <Copy className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">كلمة المرور</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-sm font-mono bg-background border border-border rounded-xl px-3 py-2 text-foreground truncate">{createdInfo?.pass}</code>
                            <button onClick={()=>{navigator.clipboard.writeText(createdInfo?.pass||"");toast.success("نُسخت");}}
                              className="w-9 h-9 rounded-xl border border-border hover:bg-background flex items-center justify-center transition-colors shrink-0">
                              <Copy className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        </div>
                      </div>
                      <button onClick={()=>setPanel("none")} className="w-full bg-muted hover:bg-muted/70 py-2.5 rounded-xl font-bold text-sm transition-colors">
                        إغلاق
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ─── EDIT FORM ─── */}
              {panel==="edit" && selected && (
                <div className="flex-1 p-5 space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl">
                    {editForm.avatarUrl
                      ? <img src={editForm.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"/>
                      : <div className={`w-16 h-16 rounded-full ${ROLES.find(r=>r.id===selected.role)?.color||"bg-primary"} flex items-center justify-center text-white font-black text-2xl`}>
                          {(selected.display_name||selected.email||"?")[0].toUpperCase()}
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm truncate">{selected.display_name||"—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{selected.email}</p>
                      <button onClick={()=>setEditAvatarMode(m=>!m)}
                        className="mt-1.5 text-xs text-primary font-bold hover:underline flex items-center gap-1">
                        <ImageIcon className="w-3 h-3"/>تغيير الصورة
                      </button>
                    </div>
                  </div>

                  {editAvatarMode && (
                    <ImageUploader
                      currentUrl={editForm.avatarUrl}
                      bucket="media" folder="avatars"
                      onUploaded={url=>{ setEditForm(f=>({...f,avatarUrl:url})); setEditAvatarMode(false); }}
                      onCancel={()=>setEditAvatarMode(false)}
                    />
                  )}

                  {/* Display name */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">الاسم الكامل</label>
                    <input value={editForm.displayName} onChange={e=>setEditForm(f=>({...f,displayName:e.target.value}))}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                  </div>
                  {/* Username */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">اسم المستخدم</label>
                    <input value={editForm.username} dir="ltr"
                      onChange={e=>setEditForm(f=>({...f,username:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"")}))}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                  </div>
                  {/* New password */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5"/>كلمة مرور جديدة (اختياري)</label>
                    <div className="relative">
                      <input type={editShowPass?"text":"password"} value={editForm.newPassword}
                        onChange={e=>setEditForm(f=>({...f,newPassword:e.target.value}))}
                        placeholder="اترك فارغاً للإبقاء على الحالية" dir="ltr"
                        className="w-full bg-muted border border-border rounded-xl px-4 pe-10 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                      <button type="button" onClick={()=>setEditShowPass(s=>!s)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {editShowPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                  {/* Role */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">الدور</label>
                    <div className="flex flex-wrap gap-1.5">
                      {visibleRoles.map(r=>(
                        <button key={r.id} onClick={()=>{ setEditForm(f=>({...f,role:r.id,permissions:{...ROLE_DEFAULTS[r.id]}})); }}
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border-2 transition-all ${editForm.role===r.id?"border-primary bg-primary/5 text-primary":"border-border text-muted-foreground hover:border-primary/30"}`}>
                          <r.icon className="w-3 h-3"/>{r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Permissions */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">الصلاحيات التفصيلية</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(PERM_KEYS).map(([key,label])=>(
                        <button key={key}
                          onClick={()=>setEditForm(f=>({...f,permissions:{...f.permissions,[key]:!f.permissions[key]}}))}
                          className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border-2 font-bold transition-all ${editForm.permissions[key]?"border-primary bg-primary/5 text-primary":"border-border text-muted-foreground hover:border-primary/20"}`}>
                          {label}
                          <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${editForm.permissions[key]?"bg-primary":"bg-muted-foreground/20"}`}>
                            {editForm.permissions[key] && <Check className="w-2.5 h-2.5 text-white"/>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Submit */}
                  <button onClick={handleEdit} disabled={editLoading}
                    className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm hover:bg-primary/85 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {editLoading ? <><Loader2 className="w-4 h-4 animate-spin"/>جارٍ الحفظ...</> : <>حفظ التعديلات</>}
                  </button>
                </div>
              )}

            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Dialog ── */}
      <AnimatePresence>
        {delId && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/50 z-50" onClick={()=>setDelId(null)}/>
            <motion.div initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.9}}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-card rounded-2xl p-6 z-50 shadow-2xl border border-border">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-7 h-7 text-red-500"/>
                </div>
                <h3 className="font-black text-lg">تأكيد الحذف</h3>
                <p className="text-sm text-muted-foreground">سيتم حذف المستخدم وكل صلاحياته. هذا الإجراء لا يمكن التراجع عنه.</p>
                <div className="flex gap-2 pt-2">
                  <button onClick={()=>setDelId(null)} className="flex-1 border border-border py-2.5 rounded-xl font-bold text-sm hover:bg-muted transition-colors">إلغاء</button>
                  <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">نعم، احذف</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
