import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AdminLogin() {
  const [email,   setEmail]   = useState('')
  const [pwd,     setPwd]     = useState('')
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState(null)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setErr(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd })
    if (error) { setErr('بيانات غير صحيحة، حاول مجدداً'); setLoading(false); return }

    const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle(),
      supabase.from('profiles').select('force_password_change').eq('user_id', data.user.id).maybeSingle(),
    ])

    const allowed = ['super_admin','admin','editor','author']
    if (!roleRow || !allowed.includes(roleRow.role)) {
      await supabase.auth.signOut()
      setErr('ليس لديك صلاحية الوصول')
      setLoading(false); return
    }

    if (profileRow?.force_password_change) {
      navigate('/egstreet-admin/change-password')
    } else {
      navigate('/egstreet-admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-block bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-xl mb-3 tracking-tight">
            🗞️ الشارع المصري
          </div>
          <p className="text-gray-600 text-xs">لوحة التحكم — للمصرح لهم فقط</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-3">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
            placeholder="البريد الإلكتروني"
            className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3.5 text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500" />
          <div className="relative">
            <input type={show?'text':'password'} value={pwd} onChange={e=>setPwd(e.target.value)} required
              placeholder="كلمة السر"
              className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3.5 text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500" />
            <button type="button" onClick={()=>setShow(!show)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 text-sm">{show?'🙈':'👁️'}</button>
          </div>
          {err && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 text-center">{err}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-2xl font-semibold transition disabled:opacity-50 mt-2">
            {loading
              ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> جاري التحقق...</span>
              : 'دخول ←'}
          </button>
        </form>
      </div>
    </div>
  )
}
