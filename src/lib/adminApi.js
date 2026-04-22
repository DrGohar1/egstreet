import { supabase } from './supabase'

// ── إضافة مستخدم جديد ──
export async function createUser({ email, password, displayName, role = 'reader' }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: password || Math.random().toString(36).slice(2, 10),
    email_confirm: true,
    user_metadata: { display_name: displayName }
  })
  if (error) throw error

  if (role !== 'reader') {
    await supabase.from('user_roles').upsert(
      { user_id: data.user.id, role },
      { onConflict: 'user_id' }
    )
  }
  return data.user
}

// ── تغيير باسورد ──
export async function changeUserPassword(userId, newPassword) {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword
  })
  if (error) throw error
  return true
}

// ── تغيير دور المستخدم ──
export async function changeUserRole(userId, role) {
  const { error } = await supabase.from('user_roles').upsert(
    { user_id: userId, role },
    { onConflict: 'user_id' }
  )
  if (error) throw error
  return true
}

// ── تعديل بيانات المستخدم ──
export async function updateUserProfile(userId, { displayName, bio, phone, notes }) {
  const { error } = await supabase.from('profiles')
    .update({
      display_name: displayName,
      bio,
      phone,
      notes
    })
    .eq('user_id', userId)
  if (error) throw error
  return true
}

// ── تعطيل / تفعيل مستخدم ──
export async function toggleUserStatus(userId, isActive) {
  const { error } = await supabase.from('profiles')
    .update({ is_active: isActive })
    .eq('user_id', userId)
  if (error) throw error
  return true
}

// ── حذف مستخدم ──
export async function deleteUser(userId) {
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw error
  return true
}

// ── جلب كل المستخدمين مع أدوارهم ──
export async function getAllUsers() {
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('user_roles').select('user_id, role, permissions')
  ])
  const rolesMap = {}
  roles?.forEach(r => { rolesMap[r.user_id] = r })
  return profiles?.map(p => ({
    ...p,
    role:        rolesMap[p.user_id]?.role || 'reader',
    permissions: rolesMap[p.user_id]?.permissions || []
  })) || []
}
