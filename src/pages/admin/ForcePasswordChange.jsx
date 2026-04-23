import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ForcePasswordChange() {
  const [pwd,    setPwd]    = useState('')
  const [pwd2,   setPwd2]   = useState('')
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState(null)
  const [user,   setUser]   = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate('/egstreet-admin')
      else setUser(user)
    })
  }, [])

  const strength = pwd.length === 0 ? 0 : pwd.length < 6 ? 1 : pwd.length < 8 ? 2 : pwd.length < 12 ? 3 : 4
  const strengthLabel = ['','ضعيفة جداً','ضعيفة','متوسطة','قوية ✅'][strength]
  const strengthColor = ['','bg-red-500','bg-orange-400','bg-yellow-400','bg-green-500'][strength]

  async function handleSubmit(e) {
    e.preventDefault()
    if (pwd.length < 8)  { setErr('كلمة السر أقل من 8 أحرف'); return }
    if (pwd !== pwd2)    { setErr('كلمتا السر غير متطابقتين'); return }
    setSaving(true); setErr(null)

    const { error } = await supabase.auth.updateUser({ password: pwd })
    if (error) { setErr(error.message); setSaving(false); return }

    await supabase.from('profiles')
      .update({ force_password_change: false })
      .eq('user_id', user.id)

    navigate('/egstreet-admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-gray-100 grid place-items-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl grid place-items-center mx-auto mb-4 text-3xl">🔑</div>
          <h1 className="text-2xl font-bold text-gray-800">تغيير كلمة السر</h1>
          <p className="text-gray-500 text-sm mt-1">يجب تغيير كلمة السر قبل المتابعة</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} required
            placeholder="كلمة السر الجديدة (8 أحرف+)"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          {pwd.length > 0 && (
            <div>
              <div className="flex gap-1 mb-1">
                {[1,2,3,4].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? strengthColor : 'bg-gray-200'}`} />)}
              </div>
              <p className="text-xs text-gray-400">{strengthLabel}</p>
            </div>
          )}
          <input type="password" value={pwd2} onChange={e=>setPwd2(e.target.value)} required
            placeholder="تأكيد كلمة السر"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          {err && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{err}</div>}
          <button type="submit" disabled={saving}
            className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold hover:bg-rose-700 transition disabled:opacity-50">
            {saving ? 'جاري الحفظ...' : 'حفظ والدخول ←'}
          </button>
        </form>
      </div>
    </div>
  )
}
