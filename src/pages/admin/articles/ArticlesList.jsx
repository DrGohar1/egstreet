import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ArticlesList() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()

  useEffect(() => { loadArticles() }, [])

  async function loadArticles() {
    const { data } = await supabase.from('articles')
      .select('id, title, status, created_at, views, category_id')
      .order('created_at', { ascending: false })
    setArticles(data || [])
    setLoading(false)
  }

  async function deleteArticle(id) {
    if (!confirm('حذف المقال؟')) return
    await supabase.from('articles').delete().eq('id', id)
    loadArticles()
  }

  async function toggleStatus(art) {
    const next = art.status === 'published' ? 'draft' : 'published'
    await supabase.from('articles').update({ status: next }).eq('id', art.id)
    loadArticles()
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">المقالات ({articles.length})</h1>
        <button onClick={() => navigate('/egstreet-admin/articles/new')}
          className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-rose-700 transition">+ مقال جديد</button>
      </div>
      {loading ? <div className="text-center py-16 text-gray-400">جاري التحميل...</div> : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-right px-4 py-3">العنوان</th>
                <th className="text-right px-4 py-3">الحالة</th>
                <th className="text-right px-4 py-3">المشاهدات</th>
                <th className="text-right px-4 py-3">التاريخ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articles.map(art => (
                <tr key={art.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{art.title || '(بدون عنوان)'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(art)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${art.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {art.status === 'published' ? 'منشور' : 'مسودة'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{art.views || 0}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(art.created_at).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => navigate(`/egstreet-admin/articles/edit/${art.id}`)}
                        className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition">✏️</button>
                      <button onClick={() => deleteArticle(art.id)}
                        className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">لا توجد مقالات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
