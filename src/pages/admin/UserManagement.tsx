import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users, Plus, Pencil, Trash2, Eye, EyeOff,
  ToggleLeft, ToggleRight, RefreshCw, Loader2, Check,
  X, Search, Key, Shield, Camera, Save, RotateCcw
} from "lucide-react";
import { ALL_PERMISSIONS, PERM_LABELS, type PermissionKey } from "@/contexts/PermissionsContext";

// ─── All permissions grouped by section ───────────────────
const PERM_SECTIONS: { label: string; keys: PermissionKey[] }[] = [
  { label: "الرئيسي",           keys: ["dashboard"] },
  { label: "المقالات",           keys: ["articles","articles.write","articles.publish","articles.review","articles.delete"] },
  { label: "المحتوى",            keys: ["categories","tags","breaking_news","pages"] },
  { label: "الوسائط",            keys: ["media.upload","media.delete"] },
  { label: "التواصل",            keys: ["comments","comments.approve","subscribers"] },
  { label: "الإعلانات",          keys: ["ads","ads.create","ads.delete"] },
  { label: "التحليلات",          keys: ["analytics"] },
  { label: "الذكاء الاصطناعي",  keys: ["scraper","scraper.run","ai_tools","ai_tools.generate","automation","automation.rules"] },
  { label: "الإدارة",            keys: ["users","users.create","users.delete","permissions","settings","backup"] },
];

type UserRow = {
  id: string; email: string; display_name: string; username: string;
  avatar_url: string | null; phone: string | null; is_active: boolean;
  must_change_password: boolean; created_at: string; articles_count: number;
};

const BLANK = { email:"", display_name:"", username:"", phone:"", password:"", confirm_pw:"" };

export default function UserManagement() {
  const [users,    setUsers]    = useState<UserRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [delId,    setDelId]    = useState<string|null>(null);

  const [modal,    setModal]    = useState<"create"|"edit"|"pw"|null>(null);
  const [editUser, setEditUser] = useState<UserRow|null>(null);
  const [form,     setForm]     = useState({ ...BLANK });
  const [showPw,   setShowPw]   = useState(false);

  // Permissions panel
  const [permsOpen,    setPermsOpen]    = useState<string|null>(null);
  const [perms,        setPerms]        = useState<Set<PermissionKey>>(new Set());
  const [permsLoading, setPermsLoading] = useState(false);
  const [permsSaving,  setPermsSaving]  = useState(false);

  // Avatar
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  // ─── Load users ──────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,display_name,username,avatar_url,phone,is_active,must_change_password,created_at,email")
      .order("created_at", { ascending: false });
    const { data: arts } = await supabase.from("articles").select("author_id");
    const artCount: Record<string, number> = {};
    (arts || []).forEach(a => { if (a.author_id) artCount[a.author_id] = (artCount[a.author_id] || 0) + 1; });
    setUsers((profiles || []).map(p => ({
      id: p.id, email: p.email || "", display_name: p.display_name || p.username || "",
      username: p.username || "", avatar_url: p.avatar_url, phone: p.phone,
      is_active: p.is_active ?? true, must_change_password: p.must_change_password ?? false,
      created_at: p.created_at, articles_count: artCount[p.id] || 0,
    })));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  // ─── Permissions panel ───────────────────────────────────
  const openPerms = async (user: UserRow) => {
    if (permsOpen === user.id) { setPermsOpen(null); return; }
    setPermsOpen(user.id);
    setPermsLoading(true);
    const { data } = await supabase.from("user_permissions").select("permission").eq("user_id", user.id);
    setPerms(new Set((data || []).map(d => d.permission as PermissionKey)));
    setPermsLoading(false);
  };

  const togglePerm = (k: PermissionKey) => {
    setPerms(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  };

  const toggleSection = (keys: PermissionKey[], allOn: boolean) => {
    setPerms(prev => {
      const n = new Set(prev);
      allOn ? keys.forEach(k => n.delete(k)) : keys.forEach(k => n.add(k));
      return n;
    });
  };

  const savePerms = async (userId: string, name: string) => {
    setPermsSaving(true);
    await supabase.from("user_permissions").delete().eq("user_id", userId);
    if (perms.size > 0) {
      const { error } = await supabase.from("user_permissions").insert(
        Array.from(perms).map(p => ({ user_id: userId, permission: p }))
      );
      if (error) { toast.error("فشل الحفظ: " + error.message); setPermsSaving(false); return; }
    }
    toast.success(`✅ تم حفظ ${perms.size} صلاحية لـ ${name}`);
    setPermsSaving(false);
  };

  // ─── Create user ─────────────────────────────────────────
  // IMPORTANT: supabase.auth.signUp() auto-logins the new user.
  // We MUST save & restore the admin session to prevent logout.
  const createUser = async () => {
    if (!form.email || !form.display_name || !form.password) { toast.error("أكمل الحقول المطلوبة"); return; }
    if (form.password !== form.confirm_pw) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    if (form.password.length < 6) { toast.error("كلمة المرور 6 أحرف على الأقل"); return; }
    setSaving(true);
    try {
      // ── Save admin session BEFORE signUp ──
      const { data: { session: adminSession } } = await supabase.auth.getSession();

      const { data: su, error: se } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { display_name: form.display_name, username: form.username || form.display_name } }
      });

      // ── Immediately restore admin session ──
      if (adminSession?.access_token && adminSession?.refresh_token) {
        await supabase.auth.setSession({
          access_token:  adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        });
      }

      if (se) throw se;
      const uid = su?.user?.id;
      if (!uid) throw new Error("فشل إنشاء الحساب في النظام");
      await supabase.from("profiles").upsert({
        id: uid, email: form.email, display_name: form.display_name,
        username: form.username || form.display_name, phone: form.phone || null,
        is_active: true, must_change_password: false,
      }, { onConflict: "id" });
      await supabase.from("user_permissions").insert([{ user_id: uid, permission: "dashboard" }]).maybeSingle();
      toast.success(`✅ تم إنشاء ${form.display_name} — حدد صلاحياته من قائمة الصلاحيات`);
      setModal(null); setForm({ ...BLANK }); load();
    } catch (e: any) { toast.error("خطأ: " + (e.message || "")); }
    setSaving(false);
  };

  // ─── Update user ─────────────────────────────────────────
  const updateUser = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        display_name: form.display_name,
        username: form.username || form.display_name,
        phone: form.phone || null,
      }).eq("id", editUser.id);
      if (error) throw error;
      toast.success("✅ تم تحديث بيانات المستخدم");
      setModal(null); setEditUser(null); load();
    } catch (e: any) { toast.error("خطأ: " + (e.message || "")); }
    setSaving(false);
  };

  // ─── Change password ─────────────────────────────────────
  const changePw = async () => {
    if (!editUser) return;
    if (!form.password || form.password.length < 6) { toast.error("6 أحرف على الأقل"); return; }
    if (form.password !== form.confirm_pw) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    setSaving(true);
    const { error } = await supabase.rpc("admin_update_user", {
      p_user_id: editUser.id, p_new_password: form.password,
      p_display_name: null, p_username: null, p_phone: null,
      p_role: null, p_is_active: null, p_must_change_pw: null,
    });
    if (error) toast.error("فشل التغيير — شغّل SQL أولاً");
    else { toast.success("✅ تم تغيير كلمة المرور"); setModal(null); setEditUser(null); }
    setSaving(false);
  };

  // ─── Toggle active ────────────────────────────────────────
  const toggleActive = async (user: UserRow) => {
    const v = !user.is_active;
    await supabase.from("profiles").update({ is_active: v }).eq("id", user.id);
    setUsers(p => p.map(u => u.id === user.id ? { ...u, is_active: v } : u));
    toast.success(v ? `✅ تم تفعيل ${user.display_name}` : `⛔ تم تعطيل ${user.display_name}`);
  };

  // ─── Upload avatar ────────────────────────────────────────
  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editUser) return;
    setAvatarBusy(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${editUser.id}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (error) { toast.error("فشل رفع الصورة"); setAvatarBusy(false); return; }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", editUser.id);
    setForm(f => ({ ...f, avatar_url: data.publicUrl } as any));
    setUsers(p => p.map(u => u.id === editUser.id ? { ...u, avatar_url: data.publicUrl } : u));
    toast.success("✅ تم تحديث الصورة");
    setAvatarBusy(false);
    e.target.value = "";
  };

  // ─── Delete user ──────────────────────────────────────────
  const deleteUser = async (userId: string) => {
    const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
    if (error) {
      await supabase.from("user_permissions").delete().eq("user_id", userId);
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);
      toast.info("تم حذف البيانات (شغّل SQL للحذف الكامل من auth)");
    } else {
      toast.success("✅ تم حذف المستخدم نهائياً");
    }
    setDelId(null); load();
  };

  const filtered = users.filter(u =>
    u.display_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const closeModal = () => { setModal(null); setEditUser(null); setForm({ ...BLANK }); };

  // ═══════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-5 max-w-4xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Users className="w-6 h-6 text-primary"/> إدارة المستخدمين
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {users.length} مستخدم &bull; {users.filter(u => u.is_active).length} نشط
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <RefreshCw className="w-4 h-4"/>
          </button>
          <button onClick={() => { setForm({ ...BLANK }); setModal("create"); }}
            className="flex items-center gap-2 bg-primary text-white text-sm font-black px-4 py-2 rounded-xl hover:bg-primary/85 shadow-sm">
            <Plus className="w-4 h-4"/> مستخدم جديد
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ابحث باسم أو إيميل..."
          className="w-full pr-10 pl-4 py-2.5 text-sm bg-muted rounded-xl border border-border focus:border-primary focus:outline-none" dir="rtl"/>
      </div>

      {/* Users */}
      {loading
        ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
        : <div className="space-y-3">
            {filtered.map(user => {
              const isOpen = permsOpen === user.id;
              const initials = (user.display_name?.[0] || user.email?.[0] || "؟").toUpperCase();
              return (
                <div key={user.id}
                  className={`bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? "border-primary/50 shadow-lg shadow-primary/5" : "border-border"} ${!user.is_active ? "opacity-55" : ""}`}>

                  {/* ── User bar ── */}
                  <div className="flex items-center gap-3 p-3 sm:p-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-black text-lg flex items-center justify-center shrink-0 overflow-hidden border border-primary/20">
                      {user.avatar_url
                        ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover"/>
                        : initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm truncate leading-tight">{user.display_name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground/70">{user.articles_count} مقال</span>
                        {user.must_change_password && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">يحتاج تغيير كلمة مرور</span>
                        )}
                        {!user.is_active && (
                          <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">معطّل</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Toggle active */}
                      <button onClick={() => toggleActive(user)}
                        title={user.is_active ? "تعطيل" : "تفعيل"}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${user.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-600 hover:bg-red-200"}`}>
                        {user.is_active ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>}
                      </button>

                      {/* Edit info */}
                      <button
                        onClick={() => { setEditUser(user); setForm({ ...BLANK, display_name: user.display_name, username: user.username, phone: user.phone || "" } as any); setModal("edit"); }}
                        title="تعديل البيانات"
                        className="w-8 h-8 rounded-xl bg-muted hover:bg-blue-100 hover:text-blue-700 flex items-center justify-center transition-colors">
                        <Pencil className="w-3.5 h-3.5"/>
                      </button>

                      {/* Change password */}
                      <button onClick={() => { setEditUser(user); setForm({ ...BLANK }); setModal("pw"); }}
                        title="تغيير كلمة المرور"
                        className="w-8 h-8 rounded-xl bg-muted hover:bg-amber-100 hover:text-amber-700 flex items-center justify-center transition-colors">
                        <Key className="w-3.5 h-3.5"/>
                      </button>

                      {/* Permissions toggle */}
                      <button onClick={() => openPerms(user)}
                        title="الصلاحيات"
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isOpen ? "bg-primary text-white shadow-sm" : "bg-muted hover:bg-primary/15 hover:text-primary"}`}>
                        <Shield className="w-3.5 h-3.5"/>
                      </button>

                      {/* Delete */}
                      {delId === user.id
                        ? <div className="flex items-center gap-1">
                            <button onClick={() => deleteUser(user.id)}
                              className="h-8 px-2.5 rounded-xl bg-red-500 text-white text-xs font-black hover:bg-red-600 transition-colors">
                              تأكيد
                            </button>
                            <button onClick={() => setDelId(null)}
                              className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/70">
                              <X className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        : <button onClick={() => setDelId(user.id)} title="حذف"
                            className="w-8 h-8 rounded-xl bg-muted hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                      }
                    </div>
                  </div>

                  {/* ── Permissions panel ── */}
                  {isOpen && (
                    <div className="border-t border-border/60 bg-muted/10 p-4">
                      {permsLoading
                        ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary"/></div>
                        : <>
                            {/* Panel header */}
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                              <p className="text-sm font-black flex items-center gap-2">
                                <Shield className="w-4 h-4 text-primary"/>
                                صلاحيات {user.display_name}
                                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  {perms.size}/{ALL_PERMISSIONS.length} مفعّلة
                                </span>
                              </p>
                              <div className="flex gap-1.5">
                                <button onClick={() => setPerms(new Set(ALL_PERMISSIONS))}
                                  className="text-[11px] px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors font-bold">
                                  تحديد الكل
                                </button>
                                <button onClick={() => setPerms(new Set(["dashboard"] as PermissionKey[]))}
                                  className="text-[11px] px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors">
                                  إلغاء الكل
                                </button>
                              </div>
                            </div>

                            {/* Permission sections grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                              {PERM_SECTIONS.map(section => {
                                const allOn  = section.keys.every(k => perms.has(k));
                                const someOn = section.keys.some(k => perms.has(k));
                                return (
                                  <div key={section.label}
                                    className={`rounded-xl border p-3 transition-colors ${allOn ? "border-primary/40 bg-primary/5" : someOn ? "border-border bg-card" : "border-border/50 bg-card"}`}>

                                    {/* Section toggle header */}
                                    <div className="flex items-center justify-between mb-2.5">
                                      <span className="text-xs font-black">{section.label}</span>
                                      <button onClick={() => toggleSection(section.keys, allOn)}
                                        className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${allOn ? "bg-primary" : someOn ? "bg-primary/30" : "bg-muted"}`}>
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${allOn ? "right-0.5" : "left-0.5"}`}/>
                                      </button>
                                    </div>

                                    {/* Individual checkboxes */}
                                    <div className="space-y-2">
                                      {section.keys.map(k => (
                                        <label key={k} onClick={() => togglePerm(k)}
                                          className="flex items-center gap-2 cursor-pointer group">
                                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${perms.has(k) ? "bg-primary border-primary" : "border-border group-hover:border-primary/60"}`}>
                                            {perms.has(k) && <Check className="w-2.5 h-2.5 text-white"/>}
                                          </div>
                                          <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                                            {PERM_LABELS[k]}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Save bar */}
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                التغييرات لن تُطبّق حتى تضغط حفظ
                              </p>
                              <button onClick={() => savePerms(user.id, user.display_name)} disabled={permsSaving}
                                className="flex items-center gap-2 bg-primary text-white text-sm font-black px-5 py-2 rounded-xl hover:bg-primary/85 disabled:opacity-50 transition-colors shadow-sm shadow-primary/20">
                                {permsSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
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

            {filtered.length === 0 && !loading && (
              <div className="text-center py-16 text-muted-foreground space-y-2">
                <Users className="w-10 h-10 mx-auto opacity-20"/>
                <p className="text-sm font-bold">لا يوجد مستخدمون</p>
              </div>
            )}
          </div>
      }

      {/* ══ Modals ══ */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl" dir="rtl">

            {/* ── Create / Edit modal ── */}
            {(modal === "create" || modal === "edit") && (
              <>
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-black text-base">
                    {modal === "create" ? "إضافة مستخدم جديد" : "تعديل بيانات المستخدم"}
                  </h2>
                  <button onClick={closeModal} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/70">
                    <X className="w-4 h-4"/>
                  </button>
                </div>

                <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                  {/* Avatar upload (edit only) */}
                  {modal === "edit" && editUser && (
                    <div className="flex items-center gap-3 pb-3 border-b border-border">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        {((form as any).avatar_url || editUser.avatar_url)
                          ? <img src={(form as any).avatar_url || editUser.avatar_url || ""} alt="" className="w-full h-full object-cover"/>
                          : <span className="text-xl font-black text-primary">{(editUser.display_name?.[0] || "؟").toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <button onClick={() => avatarRef.current?.click()} disabled={avatarBusy}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-border hover:bg-muted transition-colors">
                          {avatarBusy ? <Loader2 className="w-3 h-3 animate-spin"/> : <Camera className="w-3 h-3"/>}
                          {avatarBusy ? "جاري الرفع..." : "تغيير الصورة"}
                        </button>
                        <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar}/>
                        <p className="text-[10px] text-muted-foreground mt-1">JPG · PNG · WEBP</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">الاسم الكامل *</label>
                    <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                      placeholder="مثال: محمد علي"
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:border-primary focus:outline-none"/>
                  </div>

                  {modal === "create" && (
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">البريد الإلكتروني *</label>
                      <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="example@email.com" type="email" dir="ltr"
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:border-primary focus:outline-none"/>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">اسم المستخدم</label>
                    <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="username" dir="ltr"
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:border-primary focus:outline-none"/>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">رقم الهاتف</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="01xxxxxxxxx" dir="ltr"
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:border-primary focus:outline-none"/>
                  </div>

                  {modal === "create" && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">كلمة المرور *</label>
                        <div className="relative">
                          <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            type={showPw ? "text" : "password"} placeholder="6 أحرف على الأقل" dir="ltr"
                            className="w-full px-3 py-2.5 pl-10 text-sm border border-border rounded-xl bg-background focus:border-primary focus:outline-none"/>
                          <button type="button" onClick={() => setShowPw(p => !p)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">تأكيد كلمة المرور *</label>
                        <input value={form.confirm_pw} onChange={e => setForm(f => ({ ...f, confirm_pw: e.target.value }))}
                          type={showPw ? "text" : "password"} placeholder="أعد الكتابة" dir="ltr"
                          className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:border-primary focus:outline-none"/>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>تنبيه:</strong> سيحصل المستخدم على صلاحية "لوحة التحكم" فقط. حدد باقي الصلاحيات من زرار <Shield className="w-3 h-3 inline mx-0.5"/> بعد الإنشاء.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 p-5 border-t border-border">
                  <button onClick={modal === "create" ? createUser : updateUser} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-black py-2.5 rounded-xl hover:bg-primary/85 disabled:opacity-50 transition-colors">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                    {modal === "create" ? "إنشاء المستخدم" : "حفظ التعديلات"}
                  </button>
                  <button onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm transition-colors">
                    إلغاء
                  </button>
                </div>
              </>
            )}

            {/* ── Change Password modal ── */}
            {modal === "pw" && editUser && (
              <>
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-black text-base flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-500"/> تغيير كلمة المرور
                  </h2>
                  <button onClick={closeModal} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                    <X className="w-4 h-4"/>
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary">
                      {editUser.avatar_url
                        ? <img src={editUser.avatar_url} alt="" className="w-full h-full object-cover rounded-xl"/>
                        : (editUser.display_name?.[0] || "؟").toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{editUser.display_name}</p>
                      <p className="text-xs text-muted-foreground">{editUser.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        type={showPw ? "text" : "password"} placeholder="6 أحرف على الأقل" dir="ltr"
                        className="w-full px-3 py-2.5 pl-10 text-sm border border-border rounded-xl bg-background focus:border-primary focus:outline-none"/>
                      <button type="button" onClick={() => setShowPw(p => !p)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">تأكيد كلمة المرور</label>
                    <input value={form.confirm_pw} onChange={e => setForm(f => ({ ...f, confirm_pw: e.target.value }))}
                      type={showPw ? "text" : "password"} placeholder="أعد الكتابة" dir="ltr"
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:border-primary focus:outline-none"/>
                  </div>
                </div>
                <div className="flex gap-2 p-5 border-t border-border">
                  <button onClick={changePw} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white font-black py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Key className="w-4 h-4"/>}
                    تغيير كلمة المرور
                  </button>
                  <button onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm transition-colors">
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
