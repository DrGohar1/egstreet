import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  useEffect(() => {
    supabase.from('articles').select('*').eq('slug', slug).eq('status','published').maybeSingle()
      .then(({ data }) => {
        if (data) {
          setArticle(data)
          supabase.from('articles').update({ views: (data.views||0)+1 }).eq('id', data.id)
        }
      })
  }, [slug])
  if (!article) return <div className="min-h-screen grid place-items-center text-gray-400">جاري التحميل...</div>
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <header className="border-b border-gray-100 px-6 py-4">
        <a href="/" className="text-rose-600 font-black text-xl">🗞️ الشارع المصري</a>
      </header>
      <article className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{article.title}</h1>
        {article.featured_image && <img src={article.featured_image} alt="" className="w-full rounded-2xl mb-6 aspect-video object-cover" />}
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">{article.content}</div>
      </article>
    </div>
  )
}
