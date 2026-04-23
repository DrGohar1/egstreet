import { useEffect, useState, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import LoadingScreen from '@/components/LoadingScreen'
import BreakingNewsBar from '@/components/BreakingNewsBar'

// ─── Lazy Pages ───────────────────────────────────
const AdminLogin          = lazy(() => import('@/pages/admin/AdminLogin'))
const ForcePasswordChange = lazy(() => import('@/pages/admin/ForcePasswordChange'))
const Dashboard           = lazy(() => import('@/pages/admin/Dashboard'))
const ArticlesList        = lazy(() => import('@/pages/admin/articles/ArticlesList'))
const ArticleEditor       = lazy(() => import('@/pages/admin/articles/ArticleEditor'))
const UsersManager        = lazy(() => import('@/pages/admin/users/index'))
const RSSManager          = lazy(() => import('@/pages/admin/rss/RSSManager'))
const SettingsPage        = lazy(() => import('@/pages/admin/settings/index'))
const HomePage            = lazy(() => import('@/pages/Home'))
const ArticlePage         = lazy(() => import('@/pages/Article'))
const CategoryPage        = lazy(() => import('@/pages/Category'))

// ─── Sidebar ──────────────────────────────────────
const NAV = [
  { to: '/egstreet-admin/dashboard',    icon: '📊', label: 'لوحة التحكم' },
  { to: '/egstreet-admin/articles',     icon: '📝', label: 'المقالات' },
  { to: '/egstreet-admin/articles/new', icon: '➕', label: 'مقال جديد' },
  { to: '/egstreet-admin/users',        icon: '👥', label: 'المستخدمين' },
  { to: '/egstreet-admin/rss',          icon: '📡', label: 'مصادر RSS' },
  { to: '/egstreet-admin/settings',     icon: '⚙️', label: 'الإعدادات' },
]

function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation()
  return (
    <aside className={`bg-[#0f172a] text-white flex-col fixed inset-y-0 right-0 z-40 transition-all duration-300 hidden lg:flex ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-lg flex-shrink-0">🗞️</div>
          {!collapsed && <span className="font-bold text-sm whitespace-nowrap">الشارع المصري</span>}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="text-white/40 hover:text-white text-lg">☰</button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(item => {
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
          return (
            <a key={item.to} href={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition text-sm ${active ? 'bg-rose-600 text-white font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-base">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </a>
          )
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => supabase.auth.signOut().then(() => window.location.href = '/egstreet-admin')}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 hover:bg-white/5 hover:text-white transition w-full`}>
          <span>🚪</span>{!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  )
}

function AdminShell({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`flex-1 min-h-screen transition-all duration-300 ${collapsed ? 'lg:pr-20' : 'lg:pr-64'}`}>
        {children}
      </main>
    </div>
  )
}

// ─── Auth Guard ────────────────────────────────────
function AuthGuard({ children }) {
  const navigate = useNavigate()
  const [state, setState] = useState('loading')

  useEffect(() => {
    let alive = true
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!alive) return
      if (!user) { setState('denied'); return }

      const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('force_password_change').eq('user_id', user.id).maybeSingle(),
      ])

      if (profileRow?.force_password_change) { setState('force'); return }
      const allowed = ['super_admin', 'admin', 'editor', 'author']
      if (!roleRow || !allowed.includes(roleRow.role)) { setState('denied'); return }
      setState('ok')
    })
    return () => { alive = false }
  }, [])

  if (state === 'loading') return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="text-gray-400 text-sm animate-pulse">جاري التحقق...</div>
    </div>
  )
  if (state === 'force')   return <Navigate to="/egstreet-admin/change-password" replace />
  if (state === 'denied')  return <Navigate to="/egstreet-admin" replace />
  return children
}

// ─── Public Layout ─────────────────────────────────
function PublicLayout({ children }) {
  const [ready, setReady] = useState(false)
  return (
    <>
      {!ready && <LoadingScreen onDone={() => setReady(true)} />}
      {ready && (
        <>
          <BreakingNewsBar />
          {children}
        </>
      )}
    </>
  )
}

// ─── Root ──────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen grid place-items-center text-gray-300 text-sm">...</div>}>
        <Routes>
          {/* Public */}
          <Route path="/"               element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/news/:slug"     element={<PublicLayout><ArticlePage /></PublicLayout>} />
          <Route path="/category/:slug" element={<PublicLayout><CategoryPage /></PublicLayout>} />

          {/* Admin auth */}
          <Route path="/egstreet-admin"                  element={<AdminLogin />} />
          <Route path="/egstreet-admin/change-password"  element={<ForcePasswordChange />} />

          {/* Protected admin */}
          <Route path="/egstreet-admin/*" element={
            <AuthGuard>
              <AdminShell>
                <Routes>
                  <Route path="dashboard"         element={<Dashboard />} />
                  <Route path="articles"          element={<ArticlesList />} />
                  <Route path="articles/new"      element={<ArticleEditor />} />
                  <Route path="articles/edit/:id" element={<ArticleEditor />} />
                  <Route path="users"             element={<UsersManager />} />
                  <Route path="rss"               element={<RSSManager />} />
                  <Route path="settings"          element={<SettingsPage />} />
                  <Route path="*"                 element={<Navigate to="dashboard" replace />} />
                </Routes>
              </AdminShell>
            </AuthGuard>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
