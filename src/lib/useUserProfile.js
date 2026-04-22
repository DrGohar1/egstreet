import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// ── useUserProfile: hook لجلب بيانات المستخدم الحالي ──
export function useUserProfile() {
  const [profile, setProfile] = useState(null)
  const [role,    setRole]    = useState('reader')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_roles').select('role').eq('user_id', user.id).single()
      ]).then(([{ data: p }, { data: r }]) => {
        setProfile(p)
        setRole(r?.role || 'reader')
        setLoading(false)
      })
    })
  }, [])

  const isAdmin  = ['admin','super_admin'].includes(role)
  const isEditor = ['admin','super_admin','editor','author'].includes(role)

  return { profile, role, loading, isAdmin, isEditor }
}
