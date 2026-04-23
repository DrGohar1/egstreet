import { useEffect, useMemo, useState, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

import LoadingScreen from '@/components/LoadingScreen'
import BreakingNewsBar from '@/components/BreakingNewsBar'

const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'))
const ForcePasswordChange = lazy(() => import('@/pages/admin/ForcePasswordChange'))
const UsersManager = lazy(() => import('@/pages/admin/users/index'))
const RSSManager = lazy(() => import('@/pages/admin/rss/RSSManager'))
const ArticleEditor = lazy(() => import('@/pages/admin/articles/ArticleEditor'))

const Dashboard = lazy(() => import('@/pages/admin/Dashboard'))
const ArticlesList = lazy(() => import('@/pages/admin/articles/ArticlesList'))
const SettingsPage = lazy(() => import('@/pages/admin/settings/index'))
const HomePage = lazy(() => import('@/pages/Home'))
const ArticlePage = lazy(() => import('@/pages/Article'))
const CategoryPage = lazy(() => import('@/pages/Category'))

function AdminShell({ children }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const nav = [
    { to: '/egstreet-admin/dashboard', label: 'لوحة التحكم', icon: '📊' },
    { to: '/egstreet-admin/articles', label: 'المقالات', icon: '📝' },
    { to: '/egstreet-admin/articles/new', label: 'مقال جديد', icon: '➕' },
    { to: '/egstreet-admin/users', label: 'المستخدمين', icon: '👥' },
    { to: '/egstreet-admin/rss', label: 'RSS', icon: '📡' },
    { to: '/egstreet-admin/settings', label: 'الإعدادات', icon: '⚙️' },
  ]
  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <aside className={`bg-[#0f172a] text-white transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'} hidden lg:flex flex-col fixed inset-y-0 right-0 z-40`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-xl">🗞️</div>
            {!collapsed && <div><div className="font-bold">الشارع المصري</div><div className="text-xs text-white/50">لوحة التحكم</div></div>}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="text-white/60 hover:text-white">☰</button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto">
          {nav.map(item => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return <a key={item.to} href={item.to} className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition ${active ? 'bg-rose-600 text-white' : 'text-white/75 hover:bg-white/5'}`}>
              <span>{item.icon}</span>{!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </a>
          })}
        </nav>
      </aside>
      <div className={`flex-1 min-h-screen ${collapsed ? 'lg:pr-20' : 'lg:pr-72'}`}>
        {children}
      </div>
    </div>
  )
}

function AuthGuard({ children }) {
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  useEffect(() => {
    let alive = true
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!alive) return
      if (!user) { setState('no'); return }
      const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
        supabase.from('user_roles').select('role, permissions').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('force_password_change').eq('user_id', user.id).maybeSingle(),
      ])
      const allowed = ['super_admin', 'admin', 'editor', 'author']
      if (profileRow?.force_password_change) { setState('force'); return }
      if (!roleRow || !allowed.includes(roleRow.role)) { setState('no'); return }
      setState('ok')
    })
    return () => { alive = false }
  }, [])
  if (state === 'loading') return <div className="min-h-screen grid place-items-center text-gray-400">جاري التحميل...</div>
  if (state === 'force') return <Navigate to="/egstreet-admin/change-password" replace />
  if (state === 'no') return <Navigate to="/egstreet-admin" replace />
  return children
}

function PublicLayout({ children }) {
  const [ready, setReady] = useState(false)
  return <>
    {!ready && <LoadingScreen onDone={() => setReady(true)} />}
    {ready && <>
      <BreakingNewsBar />
      {children}
    </>}
  </>
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen grid place-items-center text-gray-400">Loading...</div>}>
        <Routes>
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/news/:slug" element={<PublicLayout><ArticlePage /></PublicLayout>} />
          <Route path="/category/:slug" element={<PublicLayout><CategoryPage /></PublicLayout>} />

          <Route path="/egstreet-admin" element={<AdminLogin />} />
          <Route path="/egstreet-admin/change-password" element={<ForcePasswordChange />} />
          <Route path="/egstreet-admin/*" element={<AuthGuard><AdminShell><Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="articles" element={<ArticlesList />} />
            <Route path="articles/new" element={<ArticleEditor />} />
            <Route path="articles/edit/:id" element={<ArticleEditor />} />
            <Route path="users" element={<UsersManager />} />
            <Route path="rss" element={<RSSManager />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes></AdminShell></AuthGuard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
