import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function MyAccount() {
  const [user, setUser]           = useState(null)
  const [username, setUsername]   = useState('')
  const [displayName, setDisplayName] = useState('')
  const [oldPass, setOldPass]     = useState('')
  const [newPass, setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [msg, setMsg]             = useState(null)
  const [saving, setSaving]       = useState(false)
  const [tab, setTab]             = useState('profile')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        const meta = data.user.user_metadata || {}
        setUsername(meta.username || '')
        setDisplayName(meta.display_name || '')
      }
    })
  }, [])

  function passStrength(p) {
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }
  const strength = passStrength(newPass)
  const strengthLabel = ['', 'ضعيف', 'متوسط', 'جيد', 'قوي جداً'][strength]
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strength]

  async function saveProfile() {
    if (!username.trim()) { setMsg({ type:'error', text:'اسم المستخدم مطلوب' }); return }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setMsg({ type:'error', text:'اسم المستخدم: حروف إنجليزية صغيرة وأرقام و _ فقط (3-20 حرف)' })
      return
    }
    setSaving(true); setMsg(null)
    const { error } = await supabase.auth.updateUser({
      data: { username, display_name: displayName }
    })
    if (error) setMsg({ type:'error', text: error.message })
    else setMsg({ type:'success', text:'✅ تم حفظ الملف الشخصي' })
    setSaving(false)
  }

  async function changePassword() {
    if (!newPass) { setMsg({ type:'error', text:'أدخل الباسورد الجديد' }); return }
    if (newPass !== confirmPass) { setMsg({ type:'error', text:'الباسورد غير متطابق' }); return }
    if (strength < 2) { setMsg({ type:'error', text:'الباسورد ضعيف جداً' }); return }
    setSaving(true); setMsg(null)

    // تحقق من الباسورد القديم بإعادة تسجيل الدخول
    const { error: reErr } = await supabase.auth.signInWithPassword({
      email: user.email, password: oldPass
    })
    if (reErr) { setMsg({ type:'error', text:'الباسورد الحالي غلط' }); setSaving(false); return }

    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) setMsg({ type:'error', text: error.message })
    else {
      setMsg({ type:'success', text:'✅ تم تغيير الباسورد بنجاح' })
      setOldPass(''); setNewPass(''); setConfirmPass('')
    }
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-lg mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">حسابي</h1>

      {/* User Info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-2xl font-black text-rose-600">
          {(username || 'U')[0].toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-gray-800">@{username || '...'}</div>
          <div className="text-sm text-gray-400">{user?.email}</div>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm text-center ${msg.type==='success'?'bg-green-50 text-green-700':'bg-red-50 text-red-600'}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl mb-4">
        {[['profile','👤 الملف الشخصي'],['password','🔐 الباسورد']].map(([id,label]) => (
          <button key={id} onClick={() => { setTab(id); setMsg(null) }}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition ${tab===id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        {tab === 'profile' && <>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">اسم المستخدم</label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input value={username} onChange={e => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
                className="w-full border border-gray-200 rounded-xl pr-8 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
            </div>
            <p className="text-xs text-gray-400 mt-1">حروف إنجليزية صغيرة وأرقام و _ فقط</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">الاسم الظاهر</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder="د. محمد جوهر"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">الإيميل (للعرض فقط)</label>
            <input value={user?.email || ''} disabled
              className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold hover:bg-rose-700 disabled:opacity-50 transition">
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </>}

        {tab === 'password' && <>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">الباسورد الحالي</label>
            <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">الباسورد الجديد</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
            {newPass && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{strengthLabel}</span>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">تأكيد الباسورد</label>
            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
              placeholder="••••••••"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${confirmPass && confirmPass !== newPass ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-rose-200'}`} />
            {confirmPass && confirmPass !== newPass && (
              <p className="text-xs text-red-500 mt-1">الباسورد غير متطابق</p>
            )}
          </div>
          <button onClick={changePassword} disabled={saving}
            className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold hover:bg-rose-700 disabled:opacity-50 transition">
            {saving ? 'جاري التغيير...' : '🔐 تغيير الباسورد'}
          </button>
        </>}
      </div>
    </div>
  )
}
