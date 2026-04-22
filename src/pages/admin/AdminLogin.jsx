import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

// ── الرابط السري: /egstreet-admin ──
export default function AdminLogin() {
  const [email,   setEmail]   = useState('')
  const [pwd,     setPwd]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [showPwd, setShowPwd] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: pwd })
    if (err) { setError('بيانات غلط، حاول تاني'); setLoading(false); return }

    // Check role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single()

    const allowedRoles = ['super_admin','admin','editor','author']
    if (!roleData || !allowedRoles.includes(roleData.role)) {
      await supabase.auth.signOut()
      setError('ليس لديك صلاحية الوصول')
      setLoading(false)
      return
    }

    // Check force_password_change
    const { data: profile } = await supabase
      .from('profiles')
      .select('force_password_change')
      .eq('user_id', data.user.id)
      .single()

    if (profile?.force_password_change) {
      navigate('/egstreet-admin/change-password')
    } else {
      navigate('/egstreet-admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-2xl font-bold text-xl mb-3">
            <span>🗞️</span> الشارع المصري
          </div>
          <p className="text-gray-500 text-sm">لوحة التحكم — للمصرح لهم فقط</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-gray-600"
              required
            />
          </div>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)}
              placeholder="كلمة السر"
              className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-gray-600"
              required
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm">
              {showPwd ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 text-center">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-2xl font-semibold transition disabled:opacity-50 mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                جاري التحقق...
              </span>
            ) : 'دخول →'}
          </button>
        </form>

        <p className="text-center text-gray-700 text-xs mt-8">
          هذه الصفحة مخصصة لفريق العمل فقط
        </p>
      </div>
    </div>
  )
}
