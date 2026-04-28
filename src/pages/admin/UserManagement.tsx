import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users, Plus, Pencil, Trash2, Shield, Eye, EyeOff,
  ToggleLeft, ToggleRight, RefreshCw, Loader2, Check,
  X, Search, UserCheck, UserX, Key, ChevronDown,
  Crown, PenLine, BarChart, Megaphone, ChevronUp, SlidersHorizontal
} from "lucide-react";
import UserPermissionsPanel from "@/components/admin/UserPermissionsPanel";

// ── Role config ──
const ROLES = [
  { key:"super_admin",     label:"مدير عام",         icon: <Crown    className="w-3.5 h-3.5"/>, color:"bg-red-100 text-red-700 border-red-200"    },
  { key:"editor_in_chief", label:"رئيس تحرير",        icon: <Shield   className="w-3.5 h-3.5"/>, color:"bg-purple-100 text-purple-700 border-purple-200" },
  { key:"journalist",      label:"صحفي",              icon: <PenLine  className="w-3.5 h-3.5"/>, color:"bg-blue-100 text-blue-700 border-blue-200"  },
  { key:"analyst",         label:"محلل",              icon: <BarChart className="w-3.5 h-3.5"/>, color:"bg-green-100 text-green-700 border-green-200" },
  { key:"ads_manager",     label:"مدير إعلانات",      icon: <Megaphone className="w-3.5 h-3.5"/>, color:"bg-amber-100 text-amber-700 border-amber-200" },
];

type RoleKey = typeof ROLES[number]["key"];

type User = {
  id: string;
  email: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  last_sign_in: string | null;
  role: RoleKey;
  articles_count: number;
};

const BLANK_FORM = {
  email:"", display_name:"", username:"", phone:"",
  password:"", confirm_pw:"", role:"journalist" as RoleKey,
};

const getRoleInfo = (key: string) => ROLES.find(r => r.key === key) || ROLES[2];

export default function UserManagement() {
  const [users,      setUsers]      = useState<User[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [modal,      setModal]      = useState<"create"|"edit"|"pw"|null>(null);
  const [editUser,   setEditUser]   = useState<User|null>(null);
  const [form,       setForm]       = useState({ ...BLANK_FORM });
  const [showPw,     setShowPw]     = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<string|null>(null);
  const [confirmDel, setConfirmDel] = useState<string|null>(null);
  const [roleDropdown, setRoleDropdown] = useState<string|null>(null);  // userId with open dropdown
  const [savingRole, setSavingRole]     = useState<string|null>(null);  // userId being saved
  const [openPermsId, setOpenPermsId]   = useState<string|null>(null);  // userId with open permissions panel

  // ── Fetch all users via RPC ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_get_users");
    if (error) {
      // Fallback: load from profiles + user_roles (if RPC not yet created)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name,username,avatar_url,phone,is_active,must_change_password,created_at,email,articles_count");
      const { data: roles } = await supabase.from("user_roles").select("user_id,role");
      const roleMap: Record<string,string> = {};
      (roles||[]).forEach(r => roleMap[r.user_id] = r.role);
      setUsers((profiles||[]).map(p => ({
        id: p.id, email: p.email||"", display_name: p.display_name||p.username||"",
        username: p.username||"", avatar_url: p.avatar_url, phone: p.phone,
        is_active: p.is_active ?? true, must_change_password: p.must_change_password ?? false,
        created_at: p.created_at, last_sign_in: null,
        role: (roleMap[p.id] || "journalist") as RoleKey,
        articles_count: p.articles_count || 0,
      })));
    } else {
      setUsers((data||[]).map((u:User) => ({ ...u, role: (u.role||"journalist") as RoleKey })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Create User ──
  const handleCreate = async () => {
    if (!form.email || !form.password || !form.display_name) {
      toast.error("أدخل الإيميل والاسم وكلمة المرور"); return;
    }
    if (form.password !== form.confirm_pw) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    if (form.password.length < 6) { toast.error("كلمة المرور 6 أحرف على الأقل"); return; }
    setSaving(true);
    try {
      // 1. Create auth user via admin API (server-side via RPC or direct)
      const { data: signUpData, error: signUpErr } = await supabase.auth.admin
        ? (supabase.auth as any).admin.createUser({
            email: form.email, password: form.password, email_confirm: true,
            user_metadata: { display_name: form.display_name, username: form.username || form.display_name },
          })
        : { data: null, error: new Error("Need service role") };

      let userId: string | null = signUpData?.user?.id || null;

      // Fallback: signUp then update
      if (!userId) {
        const { data: su } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { display_name: form.display_name, username: form.username } }
        });
        userId = su?.user?.id || null;
      }

      if (!userId) { toast.error("فشل إنشاء المستخدم — تحقق من الإيميل"); setSaving(false); return; }

      // 2. Insert/update profile
      await supabase.from("profiles").upsert({
        id: userId, email: form.email, display_name: form.display_name,
        username: form.username || form.display_name, phone: form.phone || null,
        is_active: true, must_change_password: false,
      }, { onConflict: "id" });

      // 3. Assign role
      await supabase.from("user_roles").upsert({ user_id: userId, role: form.role }, { onConflict: "user_id" });

      toast.success(`✅ تم إنشاء ${form.display_name} بنجاح`);
      setModal(null); setForm({ ...BLANK_FORM });
      fetchUsers();
    } catch (e) {
      toast.error("خطأ — " + (e as Error).message);
    }
    setSaving(false);
  };

  // ── Update User ──
  const handleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      // Try RPC first
      const { error } = await supabase.rpc("admin_update_user", {
        p_user_id:       editUser.id,
        p_display_name:  form.display_name || null,
        p_username:      form.username     || null,
        p_phone:         form.phone        || null,
        p_role:          form.role         || null,
        p_new_password:  null,
        p_is_active:     null,
        p_must_change_pw:null,
      });

      if (error) {
        // Fallback: direct update
        await supabase.from("profiles").update({
          display_name: form.display_name, username: form.username, phone: form.phone,
        }).eq("id", editUser.id);
        await supabase.from("user_roles").upsert({ user_id: editUser.id, role: form.role }, { onConflict: "user_id" });
      }

      toast.success("✅ تم تحديث بيانات المستخدم");
      setModal(null); setEditUser(null);
      fetchUsers();
    } catch (e) { toast.error("خطأ — " + (e as Error).message); }
    setSaving(false);
  };

  // ── Change Password ──
  const handleChangePw = async () => {
    if (!editUser) return;
    if (!form.password || form.password.length < 6) { toast.error("كلمة مرور 6 أحرف على الأقل"); return; }
    if (form.password !== form.confirm_pw) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    setSaving(true);
    const { error } = await supabase.rpc("admin_update_user", {
      p_user_id: editUser.id, p_display_name: null, p_username: null,
      p_phone: null, p_role: null, p_new_password: form.password,
      p_is_active: null, p_must_change_pw: null,
    });
    if (error) toast.error("فشل تغيير كلمة المرور — تأكد من تشغيل SQL");
    else { toast.success("✅ تم تغيير كلمة المرور"); setModal(null); }
    setSaving(false);
  };

  // ── Toggle Active ──
  const handleToggle = async (user: User) => {
    const newActive = !user.is_active;
    const { error } = await supabase.rpc("admin_toggle_active", {
      p_user_id: user.id, p_active: newActive
    });
    if (error) {
      // Fallback
      await supabase.from("profiles").update({ is_active: newActive }).eq("id", user.id);
    }
    toast.success(newActive ? `✅ تم تفعيل ${user.display_name}` : `⛔ تم تعطيل ${user.display_name}`);
    fetchUsers();
  };

  // ── Delete User ──
  const handleDelete = async (userId: string) => {
    setDeletingId(userId);
    const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
    if (error) {
      // Fallback
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);
      toast.info("تم حذف من الـ profiles — للحذف الكامل شغّل SQL أولاً");
    } else {
      toast.success("✅ تم حذف المستخدم نهائياً من قاعدة البيانات");
    }
    setDeletingId(null); setConfirmDel(null);
    fetchUsers();
  };

  // ── Inline Quick Role Change (direct in table) ──
  const handleInlineRole = async (userId: string, newRole: RoleKey) => {
    setSavingRole(userId);
    setRoleDropdown(null);

    // Direct DB write — always works regardless of RPC
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id" });

    if (error) {
      toast.error("❌ فشل تغيير الدور — " + error.message);
    } else {
      // Update local state immediately
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success("✅ تم تغيير الدور إلى: " + getRoleInfo(newRole).label);
    }
    setSavingRole(null);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({ ...BLANK_FORM, display_name: user.display_name, username: user.username,
               phone: user.phone||"", role: user.role });
    setModal("edit");
  };

  const openPw = (user: User) => {
    setEditUser(user);
    setForm({ ...BLANK_FORM });
    setModal("pw");
  };

  const filtered = users.filter(u =>
    u.display_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.includes(search)
  );

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════
  return (
    <div className="space-y-5 max-w-6xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Users className="w-7 h-7 text-primary"/>
            إدارة المستخدمين
          </h1>
          <p className="text-sm text-muted-foreground">
            {users.length} مستخدم • {users.filter(u=>u.is_active).length} نشط
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors">
            <RefreshCw className="w-3.5 h-3.5"/>
          </button>
          <button onClick={() => { setForm({...BLANK_FORM}); setModal("create"); }}
            className="flex items-center gap-2 bg-primary text-white text-sm font-black px-4 py-2 rounded-xl hover:bg-primary/85 transition-colors shadow-sm">
            <Plus className="w-4 h-4"/> مستخدم جديد
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ابحث باسم أو إيميل أو دور..."
          className="w-full pl-4 pr-10 py-2.5 text-sm bg-muted rounded-xl border border-border focus:border-primary focus:outline-none transition-colors"
          dir="rtl"/>
      </div>

      {/* Users Table */}
      {loading
        ? <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin"/>
          </div>
        : <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                    <th className="text-right py-3 px-4 font-bold">المستخدم</th>
                    <th className="text-right py-3 px-4 font-bold">الدور</th>
                    <th className="text-right py-3 px-4 font-bold hidden md:table-cell">مقالات</th>
                    <th className="text-right py-3 px-4 font-bold hidden lg:table-cell">آخر دخول</th>
                    <th className="text-right py-3 px-4 font-bold">الحالة</th>
                    <th className="text-right py-3 px-4 font-bold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(user => {
                    const role = getRoleInfo(user.role);
                    return (
                      <tr key={user.id} className={`hover:bg-muted/30 transition-colors ${!user.is_active ? "opacity-50" : ""}`}>
                        {/* User info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0 overflow-hidden border border-primary/20">
                              {user.avatar_url
                                ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover"/>
                                : (user.display_name?.[0] || user.email?.[0] || "؟").toUpperCase()
                              }
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold truncate max-w-[140px]">{user.display_name || user.username}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[140px]">{user.email}</div>
                              {user.must_change_password && (
                                <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">يحتاج تغيير كلمة مرور</span>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Role — inline dropdown */}
                        <td className="py-3 px-4 relative">
                          {savingRole === user.id ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Loader2 className="w-3 h-3 animate-spin"/> جارٍ...
                            </span>
                          ) : (
                            <div className="relative inline-block">
                              <button
                                onClick={(e) => { e.stopPropagation(); setRoleDropdown(roleDropdown === user.id ? null : user.id); }}
                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all hover:shadow-md cursor-pointer ${role.color}`}
                              >
                                {role.icon}{role.label}
                                <ChevronDown className="w-3 h-3 opacity-70"/>
                              </button>
                              {roleDropdown === user.id && (
                                <div className="absolute top-full mt-1 right-0 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-w-[170px]">
                                  <div className="px-3 py-2 text-[10px] font-black text-muted-foreground border-b border-border">اختر الدور</div>
                                  {ROLES.map(r => (
                                    <button
                                      key={r.key}
                                      onClick={(e) => { e.stopPropagation(); handleInlineRole(user.id, r.key as RoleKey); }}
                                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-muted/80 transition-colors
                                        ${user.role === r.key ? "bg-primary/10 text-primary" : "text-foreground"}`}
                                    >
                                      {r.icon}
                                      <span className="flex-1 text-right">{r.label}</span>
                                      {user.role === r.key && <Check className="w-3 h-3 text-primary shrink-0"/>}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        {/* Articles */}
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="font-bold">{user.articles_count}</span>
                        </td>
                        {/* Last login */}
                        <td className="py-3 px-4 hidden lg:table-cell text-xs text-muted-foreground">
                          {user.last_sign_in
                            ? new Date(user.last_sign_in).toLocaleDateString("ar-EG")
                            : "—"}
                        </td>
                        {/* Status toggle */}
                        <td className="py-3 px-4">
                          <button onClick={() => handleToggle(user)}
                            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full transition-colors
                              ${user.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
                            {user.is_active ? <ToggleRight className="w-3.5 h-3.5"/> : <ToggleLeft className="w-3.5 h-3.5"/>}
                            {user.is_active ? "نشط" : "معطّل"}
                          </button>
                        </td>
                        {/* Actions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(user)}
                              className="w-8 h-8 rounded-lg bg-muted hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors" title="تعديل">
                              <Pencil className="w-3.5 h-3.5"/>
                            </button>
                            <button onClick={() => openPw(user)}
                              className="w-8 h-8 rounded-lg bg-muted hover:bg-amber-100 hover:text-amber-700 flex items-center justify-center transition-colors" title="تغيير كلمة المرور">
                              <Key className="w-3.5 h-3.5"/>
                            </button>
                            {confirmDel === user.id
                              ? <div className="flex items-center gap-1">
                                  <button onClick={() => handleDelete(user.id)} disabled={!!deletingId}
                                    className="w-8 h-8 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 flex items-center justify-center transition-colors">
                                    {deletingId === user.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3.5 h-3.5"/>}
                                  </button>
                                  <button onClick={() => setConfirmDel(null)}
                                    className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors">
                                    <X className="w-3.5 h-3.5"/>
                                  </button>
                                </div>
                              : <button onClick={() => setConfirmDel(user.id)}
                                  className="w-8 h-8 rounded-lg bg-muted hover:bg-red-100 hover:text-red-700 flex items-center justify-center transition-colors" title="حذف">
                                  <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                            }
                          </div>
                        </td>
                      </tr>
                      {openPermsId === user.id && (
                        <tr key={`perms-${user.id}`}>
                          <td colSpan={6} className="p-0">
                            <UserPermissionsPanel
                              userId={user.id}
                              userRole={user.role}
                              userName={user.display_name || user.email}
                            />
                          </td>
                        </tr>
                      )}
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">لا يوجد مستخدمون</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      }

      {/* ══════ MODALS ══════ */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary"/>
                {modal === "create" ? "مستخدم جديد" : `تعديل: ${editUser?.display_name}`}
              </h2>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-muted-foreground">الاسم الكامل *</label>
                <input value={form.display_name} onChange={e => setForm(f=>({...f,display_name:e.target.value}))}
                  className="w-full mt-1 px-3 py-2.5 text-sm rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors" dir="rtl"/>
              </div>
              {/* Username */}
              <div>
                <label className="text-xs font-bold text-muted-foreground">اسم المستخدم</label>
                <input value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))}
                  className="w-full mt-1 px-3 py-2.5 text-sm rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors font-mono"/>
              </div>
              {/* Email (create only) */}
              {modal === "create" && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground">البريد الإلكتروني *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
                    className="w-full mt-1 px-3 py-2.5 text-sm rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors font-mono"/>
                </div>
              )}
              {/* Phone */}
              <div>
                <label className="text-xs font-bold text-muted-foreground">رقم الهاتف</label>
                <input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))}
                  className="w-full mt-1 px-3 py-2.5 text-sm rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors font-mono"/>
              </div>
              {/* Role */}
              <div>
                <label className="text-xs font-bold text-muted-foreground">الدور الوظيفي *</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {ROLES.map(r => (
                    <button key={r.key} onClick={() => setForm(f=>({...f,role:r.key}))}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-bold transition-all text-right
                        ${form.role === r.key ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>
                      {r.icon}{r.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Password (create only) */}
              {modal === "create" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">كلمة المرور *</label>
                    <div className="relative mt-1">
                      <input type={showPw ? "text" : "password"}
                        value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}
                        className="w-full px-3 py-2.5 pl-10 text-sm rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors font-mono"/>
                      <button onClick={() => setShowPw(s=>!s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">تأكيد كلمة المرور *</label>
                    <input type="password" value={form.confirm_pw} onChange={e => setForm(f=>({...f,confirm_pw:e.target.value}))}
                      className="w-full mt-1 px-3 py-2.5 text-sm rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors font-mono"/>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={modal === "create" ? handleCreate : handleUpdate} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-black py-3 rounded-xl hover:bg-primary/85 transition-colors disabled:opacity-60 shadow-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                {modal === "create" ? "إنشاء المستخدم" : "حفظ التعديلات"}
              </button>
              <button onClick={() => setModal(null)} className="px-5 py-3 rounded-xl border border-border hover:bg-muted font-bold text-sm transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {modal === "pw" && editUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-primary"/>
                تغيير كلمة مرور: {editUser.display_name}
              </h2>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground">كلمة المرور الجديدة</label>
                <div className="relative mt-1">
                  <input type={showPw ? "text" : "password"}
                    value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}
                    placeholder="6 أحرف على الأقل"
                    className="w-full px-3 py-2.5 pl-10 text-sm rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors font-mono"/>
                  <button onClick={() => setShowPw(s=>!s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">تأكيد كلمة المرور</label>
                <input type="password" value={form.confirm_pw} onChange={e => setForm(f=>({...f,confirm_pw:e.target.value}))}
                  className="w-full mt-1 px-3 py-2.5 text-sm rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors font-mono"/>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleChangePw} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white font-black py-3 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Key className="w-4 h-4"/>}
                تغيير كلمة المرور
              </button>
              <button onClick={() => setModal(null)} className="px-5 py-3 rounded-xl border border-border hover:bg-muted font-bold text-sm transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
