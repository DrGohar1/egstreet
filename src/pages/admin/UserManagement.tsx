import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users, Plus, Pencil, Trash2, Eye, EyeOff,
  ToggleLeft, ToggleRight, RefreshCw, Loader2, Check,
  X, Search, Key, ChevronDown, ChevronUp,
  Crown, PenLine, BarChart, Megaphone, Shield,
  Camera, Save, RotateCcw
} from "lucide-react";
import { ALL_PERMISSIONS, PERM_LABELS, ROLE_DEFAULTS, type PermissionKey } from "@/contexts/PermissionsContext";

// ─── Role config ───────────────────────────────────────────
const ROLES = [
  { key:"super_admin",     label:"مدير عام",      color:"bg-red-100 text-red-700 border-red-200",       icon:<Crown     className="w-3 h-3"/> },
  { key:"editor_in_chief", label:"رئيس تحرير",   color:"bg-purple-100 text-purple-700 border-purple-200", icon:<Shield    className="w-3 h-3"/> },
  { key:"journalist",      label:"صحفي",          color:"bg-blue-100 text-blue-700 border-blue-200",    icon:<PenLine   className="w-3 h-3"/> },
  { key:"analyst",         label:"محلل",          color:"bg-green-100 text-green-700 border-green-200", icon:<BarChart  className="w-3 h-3"/> },
  { key:"ads_manager",     label:"مدير إعلانات",  color:"bg-amber-100 text-amber-700 border-amber-200", icon:<Megaphone className="w-3 h-3"/> },
];
const roleInfo = (k:string) => ROLES.find(r=>r.key===k)||ROLES[2];

// ─── Permissions by section ────────────────────────────────
const PERM_SECTIONS = [
  { label:"الرئيسي",          keys:["dashboard"] as PermissionKey[] },
  { label:"المقالات",          keys:["articles","articles.write","articles.publish","articles.review","articles.delete"] as PermissionKey[] },
  { label:"المحتوى",           keys:["categories","tags","breaking_news","pages"] as PermissionKey[] },
  { label:"الوسائط",           keys:["media.upload","media.delete"] as PermissionKey[] },
  { label:"التواصل",           keys:["comments","comments.approve","subscribers"] as PermissionKey[] },
  { label:"الإعلانات",         keys:["ads","ads.create","ads.delete"] as PermissionKey[] },
  { label:"التحليلات",         keys:["analytics"] as PermissionKey[] },
  { label:"الذكاء الاصطناعي", keys:["scraper","scraper.run","ai_tools","ai_tools.generate","automation","automation.rules"] as PermissionKey[] },
  { label:"الإدارة",           keys:["users","users.create","users.delete","permissions","settings","backup"] as PermissionKey[] },
];

type UserRow = {
  id:string; email:string; display_name:string; username:string;
  avatar_url:string|null; phone:string|null; is_active:boolean;
  must_change_password:boolean; created_at:string; last_sign_in:string|null;
  role:string; articles_count:number;
};

const BLANK = { email:"", display_name:"", username:"", phone:"", password:"", confirm_pw:"", role:"journalist", avatar_url:"" };

export default function UserManagement() {
  const [users,      setUsers]      = useState<UserRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [saving,     setSaving]     = useState(false);
  const [delId,      setDelId]      = useState<string|null>(null);

  // Modals: "create" | "edit" | "pw" | null
  const [modal,      setModal]      = useState<"create"|"edit"|"pw"|null>(null);
  const [editUser,   setEditUser]   = useState<UserRow|null>(null);
  const [form,       setForm]       = useState({...BLANK});
  const [showPw,     setShowPw]     = useState(false);

  // Expanded permissions panel per user
  const [permsOpen,  setPermsOpen]  = useState<string|null>(null);
  const [perms,      setPerms]      = useState<Set<PermissionKey>>(new Set());
  const [permsLoading, setPermsLoading] = useState(false);
  const [permsSaving,  setPermsSaving]  = useState(false);

  // Avatar upload
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ─── Fetch users ────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,display_name,username,avatar_url,phone,is_active,must_change_password,created_at,email");
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const { data: arts  } = await supabase.from("articles").select("author_id");

    const roleMap: Record<string,string> = {};
    (roles||[]).forEach(r => roleMap[r.user_id] = r.role);
    const artCount: Record<string,number> = {};
    (arts||[]).forEach(a => { if(a.author_id) artCount[a.author_id]=(artCount[a.author_id]||0)+1; });

    setUsers((profiles||[]).map(p => ({
      id:p.id, email:p.email||"", display_name:p.display_name||p.username||"",
      username:p.username||"", avatar_url:p.avatar_url, phone:p.phone,
      is_active:p.is_active??true, must_change_password:p.must_change_password??false,
      created_at:p.created_at, last_sign_in:null,
      role:roleMap[p.id]||"journalist", articles_count:artCount[p.id]||0,
    })));
    setLoading(false);
  }, []);
  useEffect(()=>{ load(); },[load]);

  // ─── Load permissions for a user ───────────────────────
  const loadPerms = async (userId:string, role:string) => {
    setPermsLoading(true);
    const { data } = await supabase.from("user_permissions").select("permission").eq("user_id",userId);
    if (data && data.length > 0) {
      setPerms(new Set(data.map(d=>d.permission as PermissionKey)));
    } else {
      setPerms(new Set(ROLE_DEFAULTS[role] || ["dashboard"]));
    }
    setPermsLoading(false);
  };

  const togglePermsPanel = async (user: UserRow) => {
    if (permsOpen === user.id) { setPermsOpen(null); return; }
    setPermsOpen(user.id);
    await loadPerms(user.id, user.role);
  };

  // ─── Save permissions ───────────────────────────────────
  const savePerms = async (userId:string, name:string) => {
    setPermsSaving(true);
    await supabase.from("user_permissions").delete().eq("user_id",userId);
    if (perms.size > 0) {
      await supabase.from("user_permissions").insert(
        Array.from(perms).map(p => ({ user_id:userId, permission:p }))
      );
    }
    toast.success(`✅ تم حفظ صلاحيات ${name}`);
    setPermsSaving(false);
  };

  const resetPermsToRole = (role:string) => {
    setPerms(new Set(ROLE_DEFAULTS[role]||["dashboard"]));
    toast.info("تم إعادة الضبط — اضغط حفظ للتأكيد");
  };

  // ─── Toggle section ──────────────────────────────────────
  const toggleSection = (keys:PermissionKey[], all:boolean) => {
    setPerms(prev => {
      const n = new Set(prev);
      if (all) keys.forEach(k=>n.delete(k));
      else     keys.forEach(k=>n.add(k));
      return n;
    });
  };

  // ─── Create user ────────────────────────────────────────
  const createUser = async () => {
    if (!form.email||!form.display_name||!form.password) { toast.error("أكمل البيانات المطلوبة"); return; }
    if (form.password!==form.confirm_pw) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    if (form.password.length<6) { toast.error("كلمة المرور 6 أحرف على الأقل"); return; }
    setSaving(true);
    try {
      const { data:su } = await supabase.auth.signUp({
        email:form.email, password:form.password,
        options:{ data:{ display_name:form.display_name, username:form.username||form.display_name } }
      });
      const uid = su?.user?.id;
      if (!uid) throw new Error("فشل إنشاء المستخدم");
      await supabase.from("profiles").upsert({
        id:uid, email:form.email, display_name:form.display_name,
        username:form.username||form.display_name, phone:form.phone||null,
        is_active:true, must_change_password:false,
      },{ onConflict:"id" });
      await supabase.from("user_roles").upsert({ user_id:uid, role:form.role },{ onConflict:"user_id" });
      // Set default permissions from role
      const defs = ROLE_DEFAULTS[form.role]||["dashboard"];
      await supabase.from("user_permissions").insert(defs.map(p=>({ user_id:uid, permission:p })));
      toast.success(`✅ تم إنشاء ${form.display_name}`);
      setModal(null); setForm({...BLANK}); load();
    } catch(e:any){ toast.error("خطأ: "+(e.message||"")); }
    setSaving(false);
  };

  // ─── Update user info ────────────────────────────────────
  const updateUser = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        display_name:form.display_name, username:form.username||form.display_name,
        phone:form.phone||null,
      }).eq("id",editUser.id);
      await supabase.from("user_roles").upsert({ user_id:editUser.id, role:form.role },{ onConflict:"user_id" });
      // If role changed, reset permissions to new role defaults
      if (form.role !== editUser.role) {
        await supabase.from("user_permissions").delete().eq("user_id",editUser.id);
        const defs = ROLE_DEFAULTS[form.role]||["dashboard"];
        await supabase.from("user_permissions").insert(defs.map(p=>({ user_id:editUser.id, permission:p })));
        toast.success("✅ تم تحديث البيانات وإعادة ضبط الصلاحيات حسب الدور الجديد");
      } else {
        toast.success("✅ تم تحديث بيانات المستخدم");
      }
      setModal(null); setEditUser(null); load();
    } catch(e:any){ toast.error("خطأ: "+(e.message||"")); }
    setSaving(false);
  };

  // ─── Change password via RPC ─────────────────────────────
  const changePw = async () => {
    if (!editUser) return;
    if (!form.password||form.password.length<6) { toast.error("6 أحرف على الأقل"); return; }
    if (form.password!==form.confirm_pw) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    setSaving(true);
    const { error } = await supabase.rpc("admin_update_user",{
      p_user_id:editUser.id, p_new_password:form.password,
      p_display_name:null,p_username:null,p_phone:null,p_role:null,p_is_active:null,p_must_change_pw:null,
    });
    if (error) toast.error("فشل تغيير كلمة المرور — تأكد من تشغيل SQL");
    else { toast.success("✅ تم تغيير كلمة المرور"); setModal(null); }
    setSaving(false);
  };

  // ─── Toggle active ───────────────────────────────────────
  const toggleActive = async (user:UserRow) => {
    const v = !user.is_active;
    await supabase.from("profiles").update({is_active:v}).eq("id",user.id);
    setUsers(p=>p.map(u=>u.id===user.id?{...u,is_active:v}:u));
    toast.success(v?`✅ تم تفعيل ${user.display_name}`:`⛔ تم تعطيل ${user.display_name}`);
  };

  // ─── Avatar upload ────────────────────────────────────────
  const uploadAvatar = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file||!editUser) return;
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${editUser.id}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path,file,{upsert:true});
    if (error) { toast.error("فشل رفع الصورة"); setAvatarUploading(false); return; }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url:data.publicUrl }).eq("id",editUser.id);
    setForm(f=>({...f,avatar_url:data.publicUrl}));
    setUsers(p=>p.map(u=>u.id===editUser.id?{...u,avatar_url:data.publicUrl}:u));
    toast.success("✅ تم تحديث الصورة الشخصية");
    setAvatarUploading(false);
    e.target.value="";
  };

  // ─── Delete user ─────────────────────────────────────────
  const deleteUser = async (userId:string) => {
    const { error } = await supabase.rpc("admin_delete_user",{ p_user_id:userId });
    if (error) {
      await supabase.from("user_permissions").delete().eq("user_id",userId);
      await supabase.from("user_roles").delete().eq("user_id",userId);
      await supabase.from("profiles").delete().eq("id",userId);
      toast.info("تم حذف بيانات المستخدم من الـ profiles (شغّل SQL للحذف الكامل من auth)");
    } else {
      toast.success("✅ تم حذف المستخدم نهائياً");
    }
    setDelId(null); load();
  };

  // ─── Helpers ─────────────────────────────────────────────
  const filtered = users.filter(u=>
    u.display_name.toLowerCase().includes(search.toLowerCase())||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const openEdit = (u:UserRow) => {
    setEditUser(u); setForm({...BLANK,display_name:u.display_name,username:u.username,phone:u.phone||"",role:u.role,avatar_url:u.avatar_url||""});
    setModal("edit");
  };
  const openPw = (u:UserRow) => { setEditUser(u); setForm({...BLANK}); setModal("pw"); };

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  return (
    <div className="space-y-5 max-w-5xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Users className="w-6 h-6 text-primary"/> إدارة المستخدمين
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {users.length} مستخدم ← {users.filter(u=>u.is_active).length} نشط
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <RefreshCw className="w-4 h-4"/>
          </button>
          <button onClick={()=>{ setForm({...BLANK}); setModal("create"); }}
            className="flex items-center gap-2 bg-primary text-white text-sm font-black px-4 py-2 rounded-xl hover:bg-primary/85 shadow-sm">
            <Plus className="w-4 h-4"/> مستخدم جديد
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث باسم أو إيميل..."
          className="w-full pr-10 pl-4 py-2.5 text-sm bg-muted rounded-xl border border-border focus:border-primary focus:outline-none" dir="rtl"/>
      </div>

      {/* Users list */}
      {loading
        ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
        : <div className="space-y-3">
            {filtered.map(user => {
              const ri = roleInfo(user.role);
              const isPermsOpen = permsOpen === user.id;
              return (
                <div key={user.id} className={`bg-card border rounded-2xl overflow-hidden transition-all ${!user.is_active?"opacity-60":""} ${isPermsOpen?"border-primary/40 shadow-md":"border-border"}`}>
                  {/* ─ User row ─ */}
                  <div className="flex items-center gap-3 p-3 sm:p-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary font-black text-base flex items-center justify-center shrink-0 overflow-hidden border border-primary/20">
                      {user.avatar_url
                        ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover"/>
                        : (user.display_name?.[0]||user.email?.[0]||"?").toUpperCase()
                      }
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm truncate">{user.display_name||user.email}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${ri.color}`}>
                          {ri.icon}{ri.label}
                        </span>
                        {user.must_change_password && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">يحتاج تغيير كلمة مرور</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">{user.articles_count} مقال</div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Status toggle */}
                      <button onClick={()=>toggleActive(user)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${user.is_active?"bg-green-100 text-green-700 hover:bg-green-200":"bg-red-100 text-red-700 hover:bg-red-200"}`}
                        title={user.is_active?"تعطيل":"تفعيل"}>
                        {user.is_active?<ToggleRight className="w-4 h-4"/>:<ToggleLeft className="w-4 h-4"/>}
                      </button>
                      {/* Edit */}
                      <button onClick={()=>openEdit(user)}
                        className="w-8 h-8 rounded-lg bg-muted hover:bg-blue-100 hover:text-blue-700 flex items-center justify-center transition-colors" title="تعديل">
                        <Pencil className="w-3.5 h-3.5"/>
                      </button>
                      {/* Password */}
                      <button onClick={()=>openPw(user)}
                        className="w-8 h-8 rounded-lg bg-muted hover:bg-amber-100 hover:text-amber-700 flex items-center justify-center transition-colors" title="كلمة المرور">
                        <Key className="w-3.5 h-3.5"/>
                      </button>
                      {/* Permissions */}
                      <button onClick={()=>togglePermsPanel(user)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isPermsOpen?"bg-primary text-white":"bg-muted hover:bg-primary/10 hover:text-primary"}`}
                        title="الصلاحيات">
                        <Shield className="w-3.5 h-3.5"/>
                      </button>
                      {/* Delete */}
                      {delId===user.id
                        ? <div className="flex items-center gap-1">
                            <button onClick={()=>deleteUser(user.id)}
                              className="h-8 px-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600">حذف؟</button>
                            <button onClick={()=>setDelId(null)}
                              className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
                              <X className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        : <button onClick={()=>setDelId(user.id)}
                            className="w-8 h-8 rounded-lg bg-muted hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors" title="حذف">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                      }
                    </div>
                  </div>

                  {/* ─ Permissions Panel (expanded) ─ */}
                  {isPermsOpen && (
                    <div className="border-t border-border/60 bg-muted/20 p-4">
                      {permsLoading
                        ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary"/></div>
                        : <>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-black flex items-center gap-2">
                                <Shield className="w-4 h-4 text-primary"/> صلاحيات {user.display_name}
                              </p>
                              <div className="flex gap-2">
                                <button onClick={()=>resetPermsToRole(user.role)}
                                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors">
                                  <RotateCcw className="w-3 h-3"/> إعادة ضبط حسب الدور
                                </button>
                                <button onClick={()=>{ setPerms(new Set(ALL_PERMISSIONS)); }}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors">
                                  تحديد الكل
                                </button>
                                <button onClick={()=>{ setPerms(new Set()); }}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors">
                                  إلغاء الكل
                                </button>
                              </div>
                            </div>

                            {/* Permissions grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                              {PERM_SECTIONS.map(section => {
                                const allOn = section.keys.every(k=>perms.has(k));
                                const someOn = section.keys.some(k=>perms.has(k));
                                return (
                                  <div key={section.label} className="bg-card border border-border rounded-xl p-3">
                                    {/* Section header with "toggle all" */}
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-black text-foreground">{section.label}</span>
                                      <button onClick={()=>toggleSection(section.keys,allOn)}
                                        className={`w-8 h-4 rounded-full transition-colors relative ${allOn?"bg-primary":someOn?"bg-primary/40":"bg-muted"}`}>
                                        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${allOn?"right-0.5":"left-0.5"}`}/>
                                      </button>
                                    </div>
                                    {/* Individual permissions */}
                                    <div className="space-y-1.5">
                                      {section.keys.map(k=>(
                                        <label key={k} className="flex items-center gap-2 cursor-pointer group">
                                          <div onClick={()=>{ const n=new Set(perms); n.has(k)?n.delete(k):n.add(k); setPerms(n); }}
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${perms.has(k)?"bg-primary border-primary":"border-border group-hover:border-primary/50"}`}>
                                            {perms.has(k)&&<Check className="w-2.5 h-2.5 text-white"/>}
                                          </div>
                                          <span className="text-[11px] text-muted-foreground">{PERM_LABELS[k]}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Save bar */}
                            <div className="flex justify-between items-center pt-3 border-t border-border">
                              <span className="text-xs text-muted-foreground">{perms.size} صلاحية مفعّلة من {ALL_PERMISSIONS.length}</span>
                              <button onClick={()=>savePerms(user.id,user.display_name)} disabled={permsSaving}
                                className="flex items-center gap-2 bg-primary text-white text-sm font-black px-5 py-2 rounded-xl hover:bg-primary/85 disabled:opacity-50">
                                {permsSaving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}
                                حفظ الصلاحيات
                              </button>
                            </div>
                          </>
                      }
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length===0&&!loading&&(
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-20"/>
                <p className="text-sm">لا يوجد مستخدمون</p>
              </div>
            )}
          </div>
      }

      {/* ═══ Modals ═══ */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e=>{if(e.target===e.currentTarget){setModal(null);setEditUser(null);}}}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl" dir="rtl">

            {/* Modal: Create / Edit */}
            {(modal==="create"||modal==="edit") && (
              <>
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-black text-lg">{modal==="create"?"مستخدم جديد":"تعديل المستخدم"}</h2>
                  <button onClick={()=>{setModal(null);setEditUser(null);}} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"><X className="w-4 h-4"/></button>
                </div>
                <div className="p-5 space-y-4">
                  {/* Avatar (edit mode only) */}
                  {modal==="edit"&&editUser&&(
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        {form.avatar_url||editUser.avatar_url
                          ? <img src={form.avatar_url||editUser.avatar_url||""} alt="" className="w-full h-full object-cover"/>
                          : <span className="text-xl font-black text-primary">{(editUser.display_name?.[0]||"?").toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <button onClick={()=>avatarRef.current?.click()}
                          disabled={avatarUploading}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                          {avatarUploading?<Loader2 className="w-3 h-3 animate-spin"/>:<Camera className="w-3 h-3"/>}
                          {avatarUploading?"جاري الرفع...":"تغيير الصورة"}
                        </button>
                        <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar}/>
                        <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WEBP</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">الاسم الكامل *</label>
                    <input value={form.display_name} onChange={e=>setForm(f=>({...f,display_name:e.target.value}))}
                      placeholder="محمد علي" className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none"/>
                  </div>
                  {modal==="create"&&(
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">البريد الإلكتروني *</label>
                      <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                        placeholder="example@email.com" dir="ltr"
                        className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none"/>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">اسم المستخدم</label>
                    <input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}
                      placeholder="username" dir="ltr"
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">رقم الهاتف</label>
                    <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                      placeholder="01xxxxxxxxx" dir="ltr"
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">الدور</label>
                    <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none">
                      {ROLES.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </div>
                  {modal==="create"&&(
                    <>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">كلمة المرور *</label>
                        <div className="relative">
                          <input value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                            type={showPw?"text":"password"} placeholder="6 أحرف على الأقل" dir="ltr"
                            className="w-full px-3 py-2 pl-9 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none"/>
                          <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">تأكيد كلمة المرور *</label>
                        <input value={form.confirm_pw} onChange={e=>setForm(f=>({...f,confirm_pw:e.target.value}))}
                          type={showPw?"text":"password"} placeholder="أعد كتابة كلمة المرور" dir="ltr"
                          className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none"/>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2 p-5 border-t border-border">
                  <button onClick={modal==="create"?createUser:updateUser} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-black py-2.5 rounded-xl hover:bg-primary/85 disabled:opacity-50">
                    {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}
                    {modal==="create"?"إنشاء المستخدم":"حفظ التعديلات"}
                  </button>
                  <button onClick={()=>{setModal(null);setEditUser(null);}} className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm">إلغاء</button>
                </div>
              </>
            )}

            {/* Modal: Change Password */}
            {modal==="pw"&&editUser&&(
              <>
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-black text-lg flex items-center gap-2"><Key className="w-5 h-5 text-amber-500"/> تغيير كلمة المرور</h2>
                  <button onClick={()=>{setModal(null);setEditUser(null);}} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><X className="w-4 h-4"/></button>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-sm text-muted-foreground">تغيير كلمة مرور: <strong>{editUser.display_name}</strong></p>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <input value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                        type={showPw?"text":"password"} placeholder="6 أحرف على الأقل" dir="ltr"
                        className="w-full px-3 py-2 pl-9 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none"/>
                      <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">تأكيد كلمة المرور</label>
                    <input value={form.confirm_pw} onChange={e=>setForm(f=>({...f,confirm_pw:e.target.value}))}
                      type={showPw?"text":"password"} placeholder="أعد كتابة كلمة المرور" dir="ltr"
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none"/>
                  </div>
                </div>
                <div className="flex gap-2 p-5 border-t border-border">
                  <button onClick={changePw} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white font-black py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-50">
                    {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Key className="w-4 h-4"/>} تغيير كلمة المرور
                  </button>
                  <button onClick={()=>{setModal(null);setEditUser(null);}} className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm">إلغاء</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
