import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function RSSManager() {
  const [sources,    setSources]    = useState([])
  const [categories, setCategories] = useState([])
  const [modal,      setModal]      = useState(false)
  const [form,       setForm]       = useState({ name:''  , url:''  , category_id:'', auto_publish:false, is_active:true })
  const [fetching,   setFetching]   = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [msg,        setMsg]        = useState(null)

  useEffect(() => {
    loadSources()
    supabase.from('categories').select('id,name_ar').then(({ data }) => setCategories(data || []))
  }, [])

  async function loadSources() {
    const { data } = await supabase.from('rss_sources').select('*').order('created_at', { ascending: false })
    setSources(data || [])
  }

  async function handleSave() {
    if (!form.name || !form.url) return
    setSaving(true)
    const { error } = form.id
      ? await supabase.from('rss_sources').update(form).eq('id', form.id)
      : await supabase.from('rss_sources').insert(form)
    if (!error) { setModal(false); loadSources(); setMsg({ type:'success', text:'تم الحفظ ✅' }) }
    setSaving(false)
  }

  async function fetchSource(src) {
    setFetching(src.id)
    try {
      const { data, error } = await supabase.functions.invoke('fetch-rss', {
        body: { url: src.url, category_id: src.category_id, auto_publish: src.auto_publish }
      })
      if (error) throw error
      setMsg({ type:'success', text:`تم جلب ${data?.count || 0} خبر من ${src.name} ✅` })
      await supabase.from('rss_sources').update({
        last_fetched: new Date().toISOString(),
        fetch_count: (src.fetch_count || 0) + 1
      }).eq('id', src.id)
      loadSources()
    } catch (e) {
      setMsg({ type:'error', text:'حدث خطأ في الجلب — تأكد من صحة الرابط' })
    }
    setFetching(null)
  }

  async function fetchAll() {
    const active = sources.filter(s => s.is_active)
    for (const s of active) await fetchSource(s)
  }

  async function toggleSource(src) {
    await supabase.from('rss_sources').update({ is_active: !src.is_active }).eq('id', src.id)
    loadSources()
  }

  async function deleteSource(id) {
    if (!confirm('حذف المصدر؟')) return
    await supabase.from('rss_sources').delete().eq('id', id)
    loadSources()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مصادر RSS</h1>
          <p className="text-sm text-gray-500 mt-1">{sources.filter(s=>s.is_active).length} مصدر نشط من {sources.length}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition">
            🔄 جلب الكل
          </button>
          <button onClick={() => { setForm({ name:'', url:'', category_id:'', auto_publish:false, is_active:true }); setModal(true) }}
            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-rose-700 transition">
            + إضافة مصدر
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${msg.type==='success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg.text}
        </div>
      )}

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map(src => (
          <div key={src.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800">{src.name}</h3>
                  {src.auto_publish && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">نشر تلقائي</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{src.url}</p>
              </div>
              <button onClick={() => toggleSource(src)}
                className={`w-10 h-5 rounded-full transition-all flex-shrink-0 ${src.is_active ? 'bg-green-500' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow m-0.5 transition-all ${src.is_active ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
              <span>📥 {src.fetch_count || 0} مرة</span>
              <span>⏰ {src.last_fetched ? new Date(src.last_fetched).toLocaleDateString('ar-EG') : 'لم يُجلب بعد'}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => fetchSource(src)} disabled={fetching === src.id}
                className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-xl text-xs font-medium hover:bg-rose-100 transition disabled:opacity-40">
                {fetching === src.id ? '⏳ جاري الجلب...' : '🔄 جلب الآن'}
              </button>
              <button onClick={() => { setForm(src); setModal(true) }}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs hover:bg-gray-50 transition">✏️</button>
              <button onClick={() => deleteSource(src.id)}
                className="px-3 py-2 border border-red-100 text-red-400 rounded-xl text-xs hover:bg-red-50 transition">🗑️</button>
            </div>
          </div>
        ))}

        {sources.length === 0 && (
          <div className="col-span-2 text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📡</div>
            <p>لا توجد مصادر RSS بعد</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6" dir="rtl">
            <h2 className="text-lg font-bold mb-4">{form.id ? 'تعديل مصدر' : 'إضافة مصدر RSS جديد'}</h2>
            <div className="space-y-3">
              <input placeholder="اسم المصدر (مثال: الأهرام)" value={form.name}
                onChange={e => setForm(f=>({...f,name:e.target.value}))}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
              <input placeholder="رابط RSS (https://...)" value={form.url}
                onChange={e => setForm(f=>({...f,url:e.target.value}))}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
              <select value={form.category_id} onChange={e => setForm(f=>({...f,category_id:e.target.value}))}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200">
                <option value="">-- تصنيف (اختياري) --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
              </select>
              <label className="flex items-center gap-3 cursor-pointer">
                <button onClick={() => setForm(f=>({...f,auto_publish:!f.auto_publish}))}
                  className={`w-10 h-5 rounded-full transition-all ${form.auto_publish ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow m-0.5 transition-all ${form.auto_publish ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm text-gray-600">نشر الأخبار تلقائياً</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-rose-700 transition disabled:opacity-40">
                {saving ? 'حفظ...' : 'حفظ'}
              </button>
              <button onClick={() => setModal(false)}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
