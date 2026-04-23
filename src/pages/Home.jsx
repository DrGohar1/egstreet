import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [articles, setArticles] = useState([])
  useEffect(() => {
    supabase.from('articles').select('id,title,slug,excerpt,featured_image,created_at')
      .eq('status','published').order('created_at',{ascending:false}).limit(20)
      .then(({ data }) => setArticles(data || []))
  }, [])
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-2xl font-black text-rose-600">🗞️ الشارع المصري</h1>
      </header>
      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map(a => (
          <a key={a.id} href={`/news/${a.slug}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition">
            {a.featured_image && <img src={a.featured_image} alt="" className="w-full h-40 object-cover" />}
            <div className="p-4">
              <h2 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 mb-2">{a.title}</h2>
              {a.excerpt && <p className="text-xs text-gray-400 line-clamp-2">{a.excerpt}</p>}
              <p className="text-xs text-gray-300 mt-2">{new Date(a.created_at).toLocaleDateString('ar-EG')}</p>
            </div>
          </a>
        ))}
      </main>
    </div>
  )
}
