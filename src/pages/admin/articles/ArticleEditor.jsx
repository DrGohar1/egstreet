import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

// Helpers
const toSlug = (text) =>
  text?.trim()
    .replace(/[أإآا]/g, 'a').replace(/[ة]/g, 'h').replace(/[ى]/g, 'y')
    .replace(/[ئءؤ]/g, 'a').replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/gi, '').replace(/-+/g, '-').toLowerCase()

const FONT_SIZES  = ['text-sm','text-base','text-lg','text-xl','text-2xl','text-3xl']
const FONT_LABELS = ['صغير جداً','صغير','عادي','كبير','أكبر','ضخم']

export default function ArticleEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const imgInput = useRef()

  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '',
    featured_image: '', category_id: '', status: 'draft',
    is_breaking: false, is_featured: false,
    meta_title: '', meta_description: '',
    custom_author_name: '', reading_time: 5,
    tags_cache: ''
  })
  const [categories, setCategories] = useState([])
  const [slugCustom, setSlugCustom] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiMode,     setAiMode]     = useState(null) // 'rewrite'|'image'|'summary'
  const [imgSearch,  setImgSearch]  = useState('')
  const [imgResults, setImgResults] = useState([])
  const [msg,        setMsg]        = useState(null)
  const [preview,    setPreview]    = useState(false)
  const [wordCount,  setWordCount]  = useState(0)
  const [fontSize,   setFontSize]   = useState(2) // index in FONT_SIZES

  useEffect(() => {
    supabase.from('categories').select('id,name_ar').then(({ data }) => setCategories(data || []))
    if (isEdit) loadArticle()
  }, [id])

  async function loadArticle() {
    const { data } = await supabase.from('articles').select('*').eq('id', id).single()
    if (data) { setForm(data); setSlugCustom(true) }
  }

  // Auto-generate slug from title
  function handleTitle(val) {
    setForm(f => ({
      ...f,
      title: val,
      slug: slugCustom ? f.slug : toSlug(val),
      meta_title: f.meta_title || val
    }))
  }

  // Word count + reading time
  function handleContent(val) {
    const words = val.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)
    setForm(f => ({ ...f, content: val, reading_time: Math.max(1, Math.ceil(words / 200)) }))
  }

  // ── AI: إعادة صياغة ──
  async function aiRewrite() {
    if (!form.content) return
    setAiLoading(true); setAiMode('rewrite')
    try {
      const { data } = await supabase.functions.invoke('ai-rewrite', {
        body: { text: form.content }
      })
      if (data?.result) setForm(f => ({ ...f, content: data.result }))
    } catch (e) { setMsg({ type: 'error', text: 'AI غير متاح حالياً' }) }
    setAiLoading(false); setAiMode(null)
  }

  // ── AI: توليد صورة ──
  async function searchImages() {
    if (!imgSearch) return
    setAiLoading(true); setAiMode('image')
    // Unsplash free API
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(imgSearch)}&per_page=12&client_id=demo`)
    if (r.ok) {
      const d = await r.json()
      setImgResults(d.results?.map(p => ({ url: p.urls.regular, thumb: p.urls.thumb, credit: p.user.name })) || [])
    }
    setAiLoading(false); setAiMode(null)
  }

  async function handleSave(status = form.status) {
    if (!form.title) { setMsg({ type: 'error', text: 'العنوان مطلوب' }); return }
    setSaving(true)
    const payload = { ...form, status,
      published_at: status === 'published' ? (form.published_at || new Date().toISOString()) : null }

    const { error } = isEdit
      ? await supabase.from('articles').update(payload).eq('id', id)
      : await supabase.from('articles').insert(payload)

    if (error) { setMsg({ type: 'error', text: error.message }); setSaving(false); return }
    setMsg({ type: 'success', text: status === 'published' ? 'نُشر بنجاح ✅' : 'حُفظ كمسودة ✅' })
    setSaving(false)
    setTimeout(() => navigate('/egstreet-admin/articles'), 1200)
  }

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }))

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition">←</button>
          <h1 className="font-bold text-gray-800">{isEdit ? 'تعديل مقال' : 'مقال جديد'}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            form.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>{form.status === 'published' ? 'منشور' : 'مسودة'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(!preview)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            {preview ? 'تعديل' : 'معاينة'}
          </button>
          <button onClick={() => handleSave('draft')} disabled={saving}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
            حفظ مسودة
          </button>
          <button onClick={() => handleSave('published')} disabled={saving}
            className="px-4 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-40">
            {saving ? 'جاري النشر...' : 'نشر ←'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mx-4 mt-3 p-3 rounded-xl text-sm text-center ${msg.type==='success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg.text}
        </div>
      )}

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">

        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Title */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <input
              value={form.title}
              onChange={e => handleTitle(e.target.value)}
              placeholder="عنوان الخبر أو المقال..."
              className="w-full text-2xl font-bold text-gray-800 placeholder-gray-300 focus:outline-none border-b border-gray-100 pb-3 mb-3"
            />
            {/* Slug */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex-shrink-0">الرابط:</span>
              <div className="flex-1 flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
                <span className="text-xs text-gray-400">/news/</span>
                <input
                  value={form.slug}
                  onChange={e => { setSlugCustom(true); f('slug', e.target.value) }}
                  className="flex-1 text-xs text-rose-600 bg-transparent focus:outline-none"
                  placeholder="auto-generated-slug"
                />
              </div>
              <button onClick={() => { setSlugCustom(false); f('slug', toSlug(form.title)) }}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">↺ توليد</button>
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">مقدمة الخبر</label>
            <textarea
              value={form.excerpt}
              onChange={e => f('excerpt', e.target.value)}
              rows={2} maxLength={300}
              placeholder="ملخص قصير يظهر في القوائم ومحركات البحث..."
              className="w-full text-sm text-gray-700 focus:outline-none resize-none placeholder-gray-300"
            />
            <div className="text-xs text-gray-300 text-left">{form.excerpt?.length || 0}/300</div>
          </div>

          {/* Content Toolbar */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 flex-wrap">
              {/* Font size */}
              <select value={fontSize} onChange={e => setFontSize(+e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                {FONT_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
              </select>

              <div className="w-px h-5 bg-gray-200 mx-1" />

              {/* Format buttons */}
              {[
                { label: 'ع', title: 'عريض', wrap: ['**','**'] },
                { label: 'م', title: 'مائل', wrap: ['*','*'] },
                { label: '—', title: 'شرطة', insert: '
---
' },
                { label: '•', title: 'قائمة', insert: '
- ' },
                { label: '١.', title: 'مرقم', insert: '
1. ' },
                { label: '""', title: 'اقتباس', wrap: ['
> ',''] },
                { label: '#', title: 'عنوان', wrap: ['
## ',''] },
              ].map(btn => (
                <button key={btn.label} title={btn.title}
                  onClick={() => {
                    const ta = document.getElementById('content-ta')
                    if (!ta) return
                    const s = ta.selectionStart, e2 = ta.selectionEnd
                    const sel = form.content.slice(s, e2)
                    let newContent
                    if (btn.wrap) newContent = form.content.slice(0,s) + btn.wrap[0] + sel + btn.wrap[1] + form.content.slice(e2)
                    else newContent = form.content.slice(0,s) + btn.insert + form.content.slice(e2)
                    handleContent(newContent)
                  }}
                  className="w-8 h-7 text-sm text-gray-600 hover:bg-gray-100 rounded font-bold transition">
                  {btn.label}
                </button>
              ))}

              <div className="w-px h-5 bg-gray-200 mx-1" />

              {/* AI buttons */}
              <button onClick={aiRewrite} disabled={aiLoading}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition disabled:opacity-40">
                {aiLoading && aiMode==='rewrite' ? '⏳' : '✨'} AI صياغة
              </button>
              <button onClick={() => { setAiMode('image'); setImgSearch(form.title) }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                🔍 صور
              </button>
            </div>

            {/* Editor */}
            {preview ? (
              <div className={`p-4 min-h-64 prose prose-sm max-w-none ${FONT_SIZES[fontSize]}`}
                dangerouslySetInnerHTML={{ __html: form.content.replace(/\n/g, '<br/>') }} />
            ) : (
              <textarea
                id="content-ta"
                value={form.content}
                onChange={e => handleContent(e.target.value)}
                rows={18}
                placeholder="اكتب المحتوى هنا..."
                className={`w-full p-4 ${FONT_SIZES[fontSize]} text-gray-700 focus:outline-none resize-none font-[system-ui] leading-relaxed`}
              />
            )}

            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-50 text-xs text-gray-400">
              <span>{wordCount} كلمة</span>
              <span>وقت القراءة: ~{form.reading_time} دقيقة</span>
            </div>
          </div>

          {/* Image search modal */}
          {aiMode === 'image' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex gap-2 mb-3">
                <input value={imgSearch} onChange={e => setImgSearch(e.target.value)}
                  placeholder="ابحث عن صورة..."
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  onKeyDown={e => e.key==='Enter' && searchImages()}
                />
                <button onClick={searchImages} disabled={aiLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition disabled:opacity-40">
                  {aiLoading ? '⏳' : 'بحث'}
                </button>
                <button onClick={() => setAiMode(null)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">✕</button>
              </div>
              {imgResults.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imgResults.map((img, i) => (
                    <button key={i} onClick={() => { f('featured_image', img.url); setAiMode(null) }}
                      className="relative group overflow-hidden rounded-xl aspect-video">
                      <img src={img.thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                        <span className="text-white text-sm opacity-0 group-hover:opacity-100">اختر</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEO */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
              🔍 <span>إعدادات SEO</span>
            </h3>
            <div className="space-y-2">
              <input value={form.meta_title || ''} onChange={e => f('meta_title', e.target.value)}
                placeholder="عنوان SEO (اتركه فارغاً لاستخدام العنوان الأصلي)"
                className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
              <textarea value={form.meta_description || ''} onChange={e => f('meta_description', e.target.value)}
                rows={2} maxLength={160}
                placeholder="وصف الصفحة في جوجل (160 حرف)"
                className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none" />
              {/* Google Preview */}
              <div className="bg-gray-50 rounded-xl p-3 text-xs">
                <div className="text-blue-600 font-medium truncate">{form.meta_title || form.title || 'عنوان الخبر'}</div>
                <div className="text-green-600 truncate mt-0.5">egstreetnews.com › news › {form.slug || 'slug'}</div>
                <div className="text-gray-500 mt-0.5 line-clamp-2">{form.meta_description || form.excerpt || 'وصف الخبر..'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Featured Image */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-600 mb-3">🖼️ الصورة الرئيسية</h3>
            {form.featured_image ? (
              <div className="relative group">
                <img src={form.featured_image} alt="" className="w-full aspect-video object-cover rounded-xl" />
                <button onClick={() => f('featured_image', '')}
                  className="absolute top-2 left-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl aspect-video flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-rose-300 transition"
                onClick={() => imgInput.current?.click()}>
                <span className="text-3xl">🖼️</span>
                <span className="text-xs text-gray-400">أضف صورة</span>
              </div>
            )}
            <input ref={imgInput} type="url" value={form.featured_image}
              onChange={e => f('featured_image', e.target.value)}
              placeholder="أو أدخل رابط الصورة"
              className="w-full mt-2 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none" />
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-600">⚙️ إعدادات النشر</h3>

            <div>
              <label className="text-xs text-gray-500 block mb-1">التصنيف</label>
              <select value={form.category_id} onChange={e => f('category_id', e.target.value)}
                className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option value="">-- اختر --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">الكاتب</label>
              <input value={form.custom_author_name} onChange={e => f('custom_author_name', e.target.value)}
                placeholder="اسم الكاتب"
                className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">الوسوم</label>
              <input value={form.tags_cache} onChange={e => f('tags_cache', e.target.value)}
                placeholder="وسم1, وسم2, وسم3"
                className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">خبر عاجل</span>
              <button onClick={() => f('is_breaking', !form.is_breaking)}
                className={`w-10 h-5 rounded-full transition-all ${form.is_breaking ? 'bg-rose-500' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-all m-0.5 ${form.is_breaking ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">مميز</span>
              <button onClick={() => f('is_featured', !form.is_featured)}
                className={`w-10 h-5 rounded-full transition-all ${form.is_featured ? 'bg-amber-500' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-all m-0.5 ${form.is_featured ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-2">
            <button onClick={() => handleSave('published')} disabled={saving}
              className="w-full bg-rose-600 text-white py-3 rounded-2xl font-bold hover:bg-rose-700 transition disabled:opacity-40">
              🚀 نشر الآن
            </button>
            <button onClick={() => handleSave('draft')} disabled={saving}
              className="w-full border border-gray-200 py-2.5 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
              💾 حفظ مسودة
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
