import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ForcePasswordChange() {
  const [pwd,    setPwd]    = useState('')
  const [pwd2,   setPwd2]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)
  const [user,   setUser]   = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/egstreet-admin'); return }
      setUser(user)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (pwd.length < 8)  { setError('كلمة السر يجب أن تكون 8 أحرف على الأقل'); return }
    if (pwd !== pwd2)    { setError('كلمتا السر غير متطابقتين'); return }
    setSaving(true)
    setError(null)

    const { error: err } = await supabase.auth.updateUser({ password: pwd })
    if (err) { setError(err.message); setSaving(false); return }

    // clear force_password_change flag
    await supabase.from('profiles')
      .update({ force_password_change: false })
      .eq('user_id', user.id)

    navigate('/egstreet-admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">تغيير كلمة السر</h1>
          <p className="text-gray-500 text-sm mt-2">يجب عليك تغيير كلمة السر قبل المتابعة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة السر الجديدة</label>
            <input
              type="password" value={pwd} onChange={e => setPwd(e.target.value)}
              placeholder="8 أحرف على الأقل"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-300"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة السر</label>
            <input
              type="password" value={pwd2} onChange={e => setPwd2(e.target.value)}
              placeholder="أعد كتابة كلمة السر"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-300"
              required
            />
          </div>

          {/* password strength indicator */}
          {pwd.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                    pwd.length >= (i+1)*2+2
                      ? i < 2 ? 'bg-red-400' : i < 3 ? 'bg-yellow-400' : 'bg-green-500'
                      : 'bg-gray-200'
                  }`} />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {pwd.length < 6 ? 'ضعيفة جداً' : pwd.length < 8 ? 'ضعيفة' : pwd.length < 12 ? 'متوسطة' : 'قوية ✅'}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700 transition disabled:opacity-50 mt-2">
            {saving ? 'جاري الحفظ...' : 'حفظ كلمة السر والدخول →'}
          </button>
        </form>
      </div>
    </div>
  )
}
