import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Shield, Edit, Trash2, Check, X, Eye, EyeOff, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  { id: "super_admin", label: "سوبر أدمن", color: "bg-red-500", desc: "صلاحيات كاملة" },
  { id: "editor_in_chief", label: "رئيس التحرير", color: "bg-blue-500", desc: "تحرير وإدارة المحتوى" },
  { id: "journalist", label: "صحفي", color: "bg-green-500", desc: "كتابة المقالات فقط" },
  { id: "ads_manager", label: "مدير إعلانات", color: "bg-yellow-500", desc: "إدارة الإعلانات والإحصائيات" },
];

const PERM_LABELS: Record<string, string> = {
  articles: "المقالات", categories: "الأقسام", breaking: "الأخبار العاجلة",
  users: "المستخدمون", settings: "الإعدادات", ads: "الإعلانات",
  analytics: "التحليلات", pages: "الصفحات", subscribers: "المشتركون",
  comments: "التعليقات", ai: "أدوات AI & RSS", backup: "النسخ الاحتياطي",
  tags: "الوسوم", permissions: "الصلاحيات",
};

const UserManagement = () => {
  const { t } = useLanguage();
  const { isSuperAdmin } = usePermissions();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ email: "", password: "", displayName: "", role: "journalist" });
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [customPerms, setCustomPerms] = useState<Record<string, boolean>>({});

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("id,display_name,created_at");
    const { data: roles } = await supabase.from("user_roles").select("user_id,role,permissions");
    const merged = (profiles || []).map(p => ({
      ...p,
      roleData: (roles || []).find(r => r.user_id === p.id),
    }));
    setUsers(merged);
    setLoading(false);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    const perms = u.roleData?.permissions;
    const p = typeof perms === "string" ? JSON.parse(perms) : (perms || {});
    setCustomPerms(p);
  };

  const savePerms = async () => {
    if (!editUser?.roleData) return;
    setSaving(true);
    const { error } = await supabase.from("user_roles")
      .update({ permissions: JSON.stringify(customPerms) })
      .eq("user_id", editUser.id);
    if (!error) { toast.success("تم حفظ الصلاحيات"); setEditUser(null); loadUsers(); }
    else toast.error("فشل حفظ الصلاحيات");
    setSaving(false);
  };

  const changeRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("user_roles")
      .update({ role }).eq("user_id", userId);
    if (!error) { toast.success("تم تغيير الدور"); loadUsers(); }
  };

  const addUser = async () => {
    if (!form.email || !form.password) return toast.error("أدخل الإيميل وكلمة المرور");
    setSaving(true);
    try {
      // Create user via admin API
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ email: form.email, password: form.password, email_confirm: true }),
      });
      const data = await res.json();
      if (data.id) {
        // Add profile
        await supabase.from("profiles").insert({ id: data.id, display_name: form.displayName || form.email });
        // Add role
        await supabase.from("user_roles").insert({ user_id: data.id, role: form.role });
        toast.success(`✅ تم إنشاء المستخدم ${form.email}`);
        setShowAdd(false);
        setForm({ email: "", password: "", displayName: "", role: "journalist" });
        loadUsers();
      } else {
        toast.error(data.msg || "فشل إنشاء المستخدم");
      }
    } catch (e) { toast.error("خطأ في الاتصال"); }
    setSaving(false);
  };

  return (
    <div className="space-y-6 p-1" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><Users className="text-primary" /> {t("المستخدمون", "Users")}</h1>
          <p className="text-muted-foreground text-sm">{t("إدارة المستخدمين وصلاحياتهم", "Manage users and their permissions")}</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> {t("مستخدم جديد", "New User")}
          </button>
        )}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-lg">إضافة مستخدم جديد</h2>
                <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold mb-1 block">الاسم</label>
                  <input value={form.displayName} onChange={e => setForm(f => ({...f, displayName: e.target.value}))}
                    placeholder="الاسم الكامل" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-sm font-bold mb-1 block">البريد الإلكتروني</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                    placeholder="user@example.com" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-sm font-bold mb-1 block">كلمة المرور</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}
                      placeholder="••••••••" className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background pe-9" />
                    <button onClick={() => setShowPass(!showPass)} className="absolute top-2.5 end-3 text-muted-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold mb-1 block">الدور</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r => (
                      <button key={r.id} onClick={() => setForm(f => ({...f, role: r.id}))}
                        className={`p-2.5 rounded-xl border-2 text-start transition-all ${form.role === r.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <div className={`w-2 h-2 rounded-full ${r.color} mb-1`} />
                        <div className="text-xs font-bold">{r.label}</div>
                        <div className="text-[10px] text-muted-foreground">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={addUser} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 mt-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  إنشاء المستخدم
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Permissions Modal */}
      <AnimatePresence>
        {editUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-lg">صلاحيات: {editUser.display_name}</h2>
                <button onClick={() => setEditUser(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {Object.entries(PERM_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => setCustomPerms(p => ({...p, [key]: !p[key]}))}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${customPerms[key] ? "border-primary bg-primary/5 text-primary font-bold" : "border-border text-muted-foreground"}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${customPerms[key] ? "bg-primary border-primary" : "border-border"}`}>
                      {customPerms[key] && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={savePerms} disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ الصلاحيات
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-start px-4 py-3 font-bold">المستخدم</th>
                <th className="text-start px-4 py-3 font-bold">الدور</th>
                <th className="text-start px-4 py-3 font-bold">الصلاحيات</th>
                <th className="text-start px-4 py-3 font-bold">تاريخ الإنشاء</th>
                {isSuperAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {users.map(u => {
                const roleInfo = ROLES.find(r => r.id === u.roleData?.role);
                const perms = u.roleData?.permissions;
                const p = typeof perms === "string" ? JSON.parse(perms) : (perms || {});
                const permCount = Object.values(p).filter(Boolean).length;
                return (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {(u.display_name || "?")[0]}
                        </div>
                        <div>
                          <div className="font-bold">{u.display_name || "—"}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[160px]">{u.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isSuperAdmin ? (
                        <select value={u.roleData?.role || ""} onChange={e => changeRole(u.id, e.target.value)}
                          className="text-xs border border-border rounded-lg px-2 py-1 bg-background">
                          {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span className={`text-xs text-white px-2 py-0.5 rounded-full ${roleInfo?.color || "bg-gray-500"}`}>
                          {roleInfo?.label || u.roleData?.role || "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{permCount} صلاحية</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("ar-EG") : "—"}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        <button onClick={() => openEdit(u)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Shield className="w-3.5 h-3.5" /> تعديل
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
