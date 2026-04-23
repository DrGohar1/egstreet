import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    if (!username || !password) { setError('أدخل اسم المستخدم والباسورد'); return }
    setLoading(true); setError('')

    // البحث عن الإيميل عبر user_metadata.username
    // نجيب كل اليوزرات اللي username بتاعهم يطابق المدخل
    const { data: { session }, error: sessErr } = await supabase.auth.getSession()

    // محاولة 1: login مباشر بـ username كإيميل (لو الـ username هو الإيميل)
    let emailToTry = username.includes('@') ? username : null

    if (!emailToTry) {
      // محاولة 2: جيب الإيميل من profiles via username في user_metadata
      // نجرب نعمل sign in بـ username@egstreet.com
      const guessEmail = username + '@egstreet.com'
      const { error: e1 } = await supabase.auth.signInWithPassword({ email: guessEmail, password })
      if (!e1) {
        navigate('/egstreet-admin/dashboard')
        return
      }
    }

    // محاولة 3: نجرب كل الـ domains المعروفة
    const domains = ['@egstreet.com', '@gohar.com']
    let loggedIn = false
    for (const domain of domains) {
      const tryEmail = username.includes('@') ? username : (username + domain)
      const { data, error: signErr } = await supabase.auth.signInWithPassword({
        email: tryEmail, password
      })
      if (!signErr && data.session) {
        loggedIn = true
        navigate('/egstreet-admin/dashboard')
        break
      }
    }

    if (!loggedIn) {
      setError('اسم المستخدم أو الباسورد غلط')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-600 rounded-2xl mb-4 shadow-lg shadow-rose-900/40">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h2" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white">لوحة التحكم</h1>
          <p className="text-gray-500 text-sm mt-1">الشارع المصري</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800 space-y-4">

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">اسم المستخدم</label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-lg">@</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().trim())}
                placeholder="drgohar"
                autoComplete="username"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pr-9 pl-4 py-3 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">الباسورد</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pr-4 pl-10 py-3 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-gray-600"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                جاري الدخول...
              </span>
            ) : 'دخول →'}
          </button>
        </form>

        <p className="text-center text-gray-700 text-xs mt-6">
          © {new Date().getFullYear()} جريدة الشارع المصري
        </p>
      </div>
    </div>
  )
}
