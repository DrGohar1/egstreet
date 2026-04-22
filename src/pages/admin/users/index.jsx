import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const ROLES = [
  { value: 'super_admin', label: 'سوبر أدمن', color: 'bg-red-100 text-red-700' },
  { value: 'admin',       label: 'أدمن',       color: 'bg-orange-100 text-orange-700' },
  { value: 'editor',      label: 'محرر',        color: 'bg-blue-100 text-blue-700' },
  { value: 'author',      label: 'كاتب',        color: 'bg-green-100 text-green-700' },
  { value: 'reader',      label: 'قارئ',        color: 'bg-gray-100 text-gray-600' },
]

export default function UsersManager() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState(null) // 'add' | 'edit' | 'password'
  const [current, setCurrent] = useState(null)
  const [form,    setForm]    = useState({ email:'', display_name:'', role:'reader', password:'', notes:'' })
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role, permissions')

    const rolesMap = {}
    roles?.forEach(r => { rolesMap[r.user_id] = r })

    const merged = profiles?.map(p => ({
      ...p,
      role:        rolesMap[p.user_id]?.role || 'reader',
      permissions: rolesMap[p.user_id]?.permissions || [],
    })) || []

    setUsers(merged)
    setLoading(false)
  }

  const filtered = users.filter(u =>
    u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() {
    setForm({ email:'', display_name:'', role:'reader', password:'', notes:'' })
    setModal('add')
  }
  function openEdit(u) {
    setForm({ email: u.email||'', display_name: u.display_name||'', role: u.role||'reader', notes: u.notes||'', password:'' })
    setCurrent(u)
    setModal('edit')
  }
  function openPassword(u) {
    setForm(f => ({...f, password:''}))
    setCurrent(u)
    setModal('password')
  }

  async function handleAdd() {
    setSaving(true)
    setMsg(null)
    const { data, error } = await supabase.auth.admin.createUser({
      email:    form.email,
      password: form.password || Math.random().toString(36).slice(2,10),
      email_confirm: true,
      user_metadata: { display_name: form.display_name }
    })
    if (error) { setMsg({ type:'error', text: error.message }); setSaving(false); return }

    // set role
    await supabase.from('user_roles').upsert({
      user_id: data.user.id,
      role:    form.role
    }, { onConflict: 'user_id' })

    // set notes
    if (form.notes) {
      await supabase.from('profiles')
        .update({ notes: form.notes })
        .eq('user_id', data.user.id)
    }

    setMsg({ type:'success', text: 'تم إضافة المستخدم بنجاح ✅' })
    setSaving(false)
    setModal(null)
    fetchUsers()
  }

  async function handleEditSave() {
    setSaving(true)
    setMsg(null)

    // update profile
    await supabase.from('profiles')
      .update({ display_name: form.display_name, notes: form.notes })
      .eq('user_id', current.user_id)

    // update role
    await supabase.from('user_roles').upsert({
      user_id: current.user_id,
      role:    form.role
    }, { onConflict: 'user_id' })

    setMsg({ type:'success', text: 'تم التحديث بنجاح ✅' })
    setSaving(false)
    setModal(null)
    fetchUsers()
  }

  async function handlePasswordChange() {
    setSaving(true)
    setMsg(null)
    const { error } = await supabase.auth.admin.updateUserById(current.user_id, {
      password: form.password
    })
    if (error) { setMsg({ type:'error', text: error.message }); setSaving(false); return }
    setMsg({ type:'success', text: 'تم تغيير كلمة السر ✅' })
    setSaving(false)
    setModal(null)
  }

  async function toggleActive(u) {
    await supabase.from('profiles')
      .update({ is_active: !u.is_active })
      .eq('user_id', u.user_id)
    fetchUsers()
  }

  async function handleDelete(u) {
    if (!confirm(`هتحذف ${u.display_name}؟`)) return
    await supabase.auth.admin.deleteUser(u.user_id)
    fetchUsers()
  }

  function roleInfo(role) {
    return ROLES.find(r => r.value === role) || ROLES[4]
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} مستخدم مسجل</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition">
          <span className="text-xl">+</span> إضافة مستخدم
        </button>
      </div>

      {/* Alert */}
      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type==='success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text" placeholder="ابحث بالاسم، الإيميل، أو الدور..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
        <span className="absolute top-3 right-3 text-gray-400">🔍</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r.value).length
          return (
            <div key={r.value} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${r.color}`}>{r.label}</div>
              <div className="text-2xl font-bold text-gray-800">{count}</div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">المستخدم</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الدور</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">آخر دخول</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => (
                <tr key={u.user_id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm overflow-hidden">
                        {u.avatar_url
                          ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                          : (u.display_name?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{u.display_name || '—'}</div>
                        <div className="text-xs text-gray-400">{u.email || u.user_id?.slice(0,8)+'...'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleInfo(u.role).color}`}>
                      {roleInfo(u.role).label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.last_login
                      ? new Date(u.last_login).toLocaleDateString('ar-EG')
                      : 'لم يدخل بعد'}
                    {u.login_count > 0 && <span className="mr-1 text-gray-300">({u.login_count}×)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(u)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition ${u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                      {u.is_active !== false ? '● نشط' : '○ موقوف'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)}
                        title="تعديل" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition">✏️</button>
                      <button onClick={() => openPassword(u)}
                        title="تغيير باسورد" className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-500 transition">🔑</button>
                      <button onClick={() => handleDelete(u)}
                        title="حذف" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">لا يوجد مستخدمين</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" dir="rtl">

            {/* Add User */}
            {modal === 'add' && (<>
              <h2 className="text-lg font-bold mb-4 text-gray-800">➕ إضافة مستخدم جديد</h2>
              <div className="space-y-3">
                <input placeholder="الاسم الكامل *" value={form.display_name}
                  onChange={e => setForm(f=>({...f, display_name:e.target.value}))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
                <input placeholder="البريد الإلكتروني *" value={form.email} type="email"
                  onChange={e => setForm(f=>({...f, email:e.target.value}))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
                <input placeholder="كلمة السر (اتركها فارغة لتوليد تلقائي)" value={form.password} type="password"
                  onChange={e => setForm(f=>({...f, password:e.target.value}))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
                <select value={form.role} onChange={e => setForm(f=>({...f, role:e.target.value}))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <textarea placeholder="ملاحظات (اختياري)" value={form.notes}
                  onChange={e => setForm(f=>({...f, notes:e.target.value}))} rows={2}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none" />
              </div>
            </>)}

            {/* Edit User */}
            {modal === 'edit' && (<>
              <h2 className="text-lg font-bold mb-4 text-gray-800">✏️ تعديل: {current?.display_name}</h2>
              <div className="space-y-3">
                <input placeholder="الاسم الكامل" value={form.display_name}
                  onChange={e => setForm(f=>({...f, display_name:e.target.value}))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
                <select value={form.role} onChange={e => setForm(f=>({...f, role:e.target.value}))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <textarea placeholder="ملاحظات" value={form.notes}
                  onChange={e => setForm(f=>({...f, notes:e.target.value}))} rows={2}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none" />
              </div>
            </>)}

            {/* Change Password */}
            {modal === 'password' && (<>
              <h2 className="text-lg font-bold mb-4 text-gray-800">🔑 تغيير باسورد: {current?.display_name}</h2>
              <input placeholder="كلمة السر الجديدة *" value={form.password} type="password"
                onChange={e => setForm(f=>({...f, password:e.target.value}))}
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
              <p className="text-xs text-gray-400 mt-2">✅ يتم التغيير فوراً بدون إيميل تأكيد</p>
            </>)}

            {/* Buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={modal==='add' ? handleAdd : modal==='edit' ? handleEditSave : handlePasswordChange}
                disabled={saving}
                className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-medium hover:bg-rose-700 transition disabled:opacity-50">
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button onClick={() => setModal(null)}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
