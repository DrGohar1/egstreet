import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({ articles: 0, published: 0, categories: 0, users: 0 })

  useEffect(() => {
    Promise.all([
      supabase.from('articles').select('id, status'),
      supabase.from('categories').select('id'),
      supabase.from('profiles').select('id'),
    ]).then(([{ data: arts }, { data: cats }, { data: users }]) => {
      setStats({
        articles: arts?.length || 0,
        published: arts?.filter(a => a.status === 'published').length || 0,
        categories: cats?.length || 0,
        users: users?.length || 0,
      })
    })
  }, [])

  const cards = [
    { label: 'المقالات', value: stats.articles, icon: '📝', color: 'bg-blue-50 text-blue-600' },
    { label: 'منشورة', value: stats.published, icon: '✅', color: 'bg-green-50 text-green-600' },
    { label: 'التصنيفات', value: stats.categories, icon: '🗂️', color: 'bg-purple-50 text-purple-600' },
    { label: 'المستخدمين', value: stats.users, icon: '👥', color: 'bg-rose-50 text-rose-600' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">لوحة التحكم</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${c.color}`}>{c.icon}</div>
            <div className="text-3xl font-black text-gray-800">{c.value}</div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/egstreet-admin/articles/new"
          className="bg-rose-600 text-white rounded-2xl p-6 flex items-center gap-4 hover:bg-rose-700 transition">
          <span className="text-3xl">✍️</span>
          <div><div className="font-bold text-lg">اكتب مقالاً جديداً</div><div className="text-rose-200 text-sm">ابدأ تحرير محتوى جديد</div></div>
        </a>
        <a href="/egstreet-admin/rss"
          className="bg-white rounded-2xl p-6 flex items-center gap-4 border border-gray-100 shadow-sm hover:bg-gray-50 transition">
          <span className="text-3xl">📡</span>
          <div><div className="font-bold text-lg text-gray-800">مصادر RSS</div><div className="text-gray-400 text-sm">إدارة مصادر الأخبار</div></div>
        </a>
      </div>
    </div>
  )
}
