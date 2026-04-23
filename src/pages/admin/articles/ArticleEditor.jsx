import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

// ─── Slug توليد آمن للعربي والإنجليزي ───
function toSlug(text) {
  if (!text) return ''
  const ts = Date.now().toString(36)
  // استخدم الإنجليزي لو موجود، وإلا أضف timestamp
  const en = text
    .replace(/[أإآا]/g, 'a').replace(/[ب]/g, 'b').replace(/[ت]/g, 't')
    .replace(/[ث]/g, 'th').replace(/[ج]/g, 'g').replace(/[ح]/g, 'h')
    .replace(/[خ]/g, 'kh').replace(/[د]/g, 'd').replace(/[ذ]/g, 'z')
    .replace(/[ر]/g, 'r').replace(/[ز]/g, 'z').replace(/[س]/g, 's')
    .replace(/[ش]/g, 'sh').replace(/[ص]/g, 's').replace(/[ض]/g, 'd')
    .replace(/[ط]/g, 't').replace(/[ظ]/g, 'z').replace(/[ع]/g, 'a')
    .replace(/[غ]/g, 'gh').replace(/[ف]/g, 'f').replace(/[ق]/g, 'q')
    .replace(/[ك]/g, 'k').replace(/[ل]/g, 'l').replace(/[م]/g, 'm')
    .replace(/[ن]/g, 'n').replace(/[ه|ة]/g, 'h').replace(/[و]/g, 'w')
    .replace(/[ي|ى]/g, 'y').replace(/[ئءؤ]/g, 'a')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '').replace(/-+/g, '-')
    .toLowerCase().replace(/^-+|-+$/g, '').trim()
  return en.length >= 5 ? en : `news-${ts}`
}

const FONT_SIZES = ['text-sm','text-base','text-lg','text-xl','text-2xl','text-3xl']
const FONT_LABELS = ['صغير جداً','صغير','عادي','كبير','أكبر','ضخم']

export default function ArticleEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    title:'', slug:'', excerpt:'', content:'',
    featured_image:'', category_id:'', status:'draft',
    is_breaking:false, is_featured:false,
    meta_title:'', meta_description:'',
    custom_author_name:'', reading_time:5, tags_cache:''
  })
  const [categories, setCategories] = useState([])
  const [slugCustom, setSlugCustom] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMode, setAiMode] = useState(null)
  const [imgSearch, setImgSearch] = useState('')
  const [imgResults, setImgResults] = useState([])
  const [msg, setMsg] = useState(null)
  const [preview, setPreview] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [fontSize, setFontSize] = useState(2)

  useEffect(() => {
    supabase.from('categories').select('id,name_ar').then(({ data }) => setCategories(data || []))
    if (isEdit) {
      supabase.from('articles').select('*').eq('id', id).single()
        .then(({ data }) => { if (data) { setForm(data); setSlugCustom(true) } })
    }
  }, [id])

  function handleTitle(val) {
    setForm(f => ({
      ...f, title: val,
      slug: slugCustom ? f.slug : toSlug(val),
      meta_title: f.meta_title || val
    }))
  }

  function handleContent(val) {
    const words = val.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)
    setForm(f => ({ ...f, content: val, reading_time: Math.max(1, Math.ceil(words / 200)) }))
  }

  async function aiRewrite() {
    if (!form.content) return
    setAiLoading(true); setAiMode('rewrite')
    const { data } = await supabase.functions.invoke('ai-rewrite', { body: { text: form.content } })
    if (data?.result) setForm(f => ({ ...f, content: data.result }))
    setAiLoading(false); setAiMode(null)
  }

  async function searchImages() {
    if (!imgSearch) return
    setAiLoading(true); setAiMode('image')
    const UNSPLASH = import.meta.env.VITE_UNSPLASH_KEY || 'demo'
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(imgSearch)}&per_page=12&client_id=${UNSPLASH}`)
    if (r.ok) {
      const d = await r.json()
      setImgResults(d.results?.map(p => ({ url: p.urls.regular, thumb: p.urls.small })) || [])
    }
    setAiLoading(false); setAiMode(null)
  }

  async function handleSave(status = form.status) {
    if (!form.title) { setMsg({ type:'error', text:'العنوان مطلوب' }); return }
    if (!form.slug) {
      const s = toSlug(form.title)
      setForm(f => ({ ...f, slug: s }))
      form.slug = s
    }
    setSaving(true)
    const payload = {
      ...form, status,
      published_at: status === 'published' ? (form.published_at || new Date().toISOString()) : null
    }
    const { error } = isEdit
      ? await supabase.from('articles').update(payload).eq('id', id)
      : await supabase.from('articles').insert(payload)
    if (error) { setMsg({ type:'error', text:error.message }); setSaving(false); return }
    setMsg({ type:'success', text: status==='published' ? 'نُشر بنجاح ✅' : 'حُفظ كمسودة ✅' })
    setSaving(false)
    setTimeout(() => navigate('/egstreet-admin/articles'), 1200)
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const insertAtCursor = (before, after='') => {
    const ta = document.getElementById('content-ta')
    if (!ta) return
    const s = ta.selectionStart, e2 = ta.selectionEnd
    const sel = form.content.slice(s, e2)
    handleContent(form.content.slice(0,s) + before + sel + after + form.content.slice(e2))
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          <h1 className="font-bold text-gray-800">{isEdit ? 'تعديل مقال' : 'مقال جديد'}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${form.status==='published'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>
            {form.status==='published'?'منشور':'مسودة'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setPreview(!preview)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            {preview?'تعديل ✏️':'معاينة 👁️'}
          </button>
          <button onClick={()=>handleSave('draft')} disabled={saving}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">حفظ</button>
          <button onClick={()=>handleSave('published')} disabled={saving}
            className="px-4 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-40">
            {saving?'جاري...':'نشر ←'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mx-4 mt-3 p-3 rounded-xl text-sm text-center ${msg.type==='success'?'bg-green-50 text-green-700':'bg-red-50 text-red-600'}`}>
          {msg.text}
        </div>
      )}

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">

          {/* Title + Slug */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <input value={form.title} onChange={e=>handleTitle(e.target.value)}
              placeholder="عنوان الخبر..."
              className="w-full text-2xl font-bold text-gray-800 placeholder-gray-300 focus:outline-none border-b border-gray-100 pb-3 mb-3" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex-shrink-0">الرابط:</span>
              <div className="flex-1 flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
                <span className="text-xs text-gray-400">/news/</span>
                <input value={form.slug} onChange={e=>{setSlugCustom(true);f('slug',e.target.value)}}
                  className="flex-1 text-xs text-rose-600 bg-transparent focus:outline-none min-w-0" placeholder="auto-slug" />
              </div>
              <button onClick={()=>{setSlugCustom(false);f('slug',toSlug(form.title))}}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 flex-shrink-0">↺</button>
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">مقدمة الخبر</label>
            <textarea value={form.excerpt} onChange={e=>f('excerpt',e.target.value)}
              rows={2} maxLength={300} placeholder="ملخص قصير..."
              className="w-full text-sm text-gray-700 focus:outline-none resize-none placeholder-gray-300" />
          </div>

          {/* Content Editor */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 flex-wrap">
              <select value={fontSize} onChange={e=>setFontSize(+e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                {FONT_LABELS.map((l,i)=><option key={i} value={i}>{l}</option>)}
              </select>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <button onClick={()=>insertAtCursor('**','**')} title="عريض"  className="w-8 h-7 text-sm font-black text-gray-600 hover:bg-gray-100 rounded">B</button>
              <button onClick={()=>insertAtCursor('*','*')}   title="مائل"  className="w-8 h-7 text-sm italic  text-gray-600 hover:bg-gray-100 rounded">I</button>
              <button onClick={()=>insertAtCursor('
## ')}   title="عنوان" className="w-8 h-7 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded">H2</button>
              <button onClick={()=>insertAtCursor('
- ')}    title="قائمة" className="w-8 h-7 text-sm text-gray-600 hover:bg-gray-100 rounded">•</button>
              <button onClick={()=>insertAtCursor('
> ')}    title="اقتباس" className="w-8 h-7 text-sm text-gray-600 hover:bg-gray-100 rounded">"</button>
              <button onClick={()=>insertAtCursor('
---
')} title="فاصل"  className="w-8 h-7 text-sm text-gray-600 hover:bg-gray-100 rounded">─</button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <button onClick={aiRewrite} disabled={aiLoading}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 disabled:opacity-40">
                {aiLoading&&aiMode==='rewrite'?'⏳':'✨'} AI صياغة
              </button>
              <button onClick={()=>{setAiMode('image');setImgSearch(form.title)}}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                🔍 صور
              </button>
            </div>

            {preview ? (
              <div className={`p-4 min-h-64 prose prose-sm max-w-none ${FONT_SIZES[fontSize]}`}
                dangerouslySetInnerHTML={{ __html: form.content.replace(/
/g,'<br/>') }} />
            ) : (
              <textarea id="content-ta" value={form.content} onChange={e=>handleContent(e.target.value)}
                rows={20} placeholder="اكتب المحتوى هنا..."
                className={`w-full p-4 ${FONT_SIZES[fontSize]} text-gray-700 focus:outline-none resize-none leading-relaxed`} />
            )}

            <div className="flex justify-between px-4 py-2 border-t border-gray-50 text-xs text-gray-400">
              <span>{wordCount} كلمة</span>
              <span>~{form.reading_time} دقيقة قراءة</span>
            </div>
          </div>

          {/* Image Search */}
          {aiMode === 'image' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex gap-2 mb-3">
                <input value={imgSearch} onChange={e=>setImgSearch(e.target.value)}
                  placeholder="ابحث عن صورة بالإنجليزي..."
                  onKeyDown={e=>e.key==='Enter'&&searchImages()}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                <button onClick={searchImages} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl">بحث</button>
                <button onClick={()=>setAiMode(null)} className="px-3 py-2 border rounded-xl text-sm">✕</button>
              </div>
              {imgResults.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imgResults.map((img,i)=>(
                    <button key={i} onClick={()=>{f('featured_image',img.url);setAiMode(null)}}
                      className="relative group overflow-hidden rounded-xl aspect-video">
                      <img src={img.thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100">اختر</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEO */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 mb-3">🔍 SEO</h3>
            <div className="space-y-2">
              <input value={form.meta_title||''} onChange={e=>f('meta_title',e.target.value)}
                placeholder="عنوان SEO"
                className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <textarea value={form.meta_description||''} onChange={e=>f('meta_description',e.target.value)}
                rows={2} maxLength={160} placeholder="وصف جوجل (160 حرف)"
                className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" />
              <div className="bg-gray-50 rounded-xl p-3 text-xs">
                <div className="text-blue-600 font-medium truncate">{form.meta_title||form.title||'عنوان الخبر'}</div>
                <div className="text-green-600 truncate">egstreetnews.com › news › {form.slug||'slug'}</div>
                <div className="text-gray-500 line-clamp-2">{form.meta_description||form.excerpt||'وصف الخبر..'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Image */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 mb-3">🖼️ الصورة الرئيسية</h3>
            {form.featured_image ? (
              <div className="relative group">
                <img src={form.featured_image} alt="" className="w-full aspect-video object-cover rounded-xl" />
                <button onClick={()=>f('featured_image','')}
                  className="absolute top-2 left-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100">✕</button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl aspect-video flex items-center justify-center text-gray-300">
                <span>🖼️ لا توجد صورة</span>
              </div>
            )}
            <input type="url" value={form.featured_image} onChange={e=>f('featured_image',e.target.value)}
              placeholder="رابط الصورة https://..."
              className="w-full mt-2 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none" />
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-500">⚙️ النشر</h3>
            <select value={form.category_id} onChange={e=>f('category_id',e.target.value)}
              className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="">-- تصنيف --</option>
              {categories.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
            <input value={form.custom_author_name} onChange={e=>f('custom_author_name',e.target.value)}
              placeholder="اسم الكاتب" className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            <input value={form.tags_cache} onChange={e=>f('tags_cache',e.target.value)}
              placeholder="وسم1, وسم2" className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">خبر عاجل</span>
              <button onClick={()=>f('is_breaking',!form.is_breaking)}
                className={`w-10 h-5 rounded-full transition-all ${form.is_breaking?'bg-rose-500':'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow m-0.5 transition-all ${form.is_breaking?'translate-x-5':''}`} />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">مميز</span>
              <button onClick={()=>f('is_featured',!form.is_featured)}
                className={`w-10 h-5 rounded-full transition-all ${form.is_featured?'bg-amber-500':'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow m-0.5 transition-all ${form.is_featured?'translate-x-5':''}`} />
              </button>
            </div>
          </div>

          <button onClick={()=>handleSave('published')} disabled={saving}
            className="w-full bg-rose-600 text-white py-3 rounded-2xl font-bold hover:bg-rose-700 disabled:opacity-40">
            🚀 نشر الآن
          </button>
          <button onClick={()=>handleSave('draft')} disabled={saving}
            className="w-full border border-gray-200 py-2.5 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            💾 حفظ مسودة
          </button>
        </div>
      </div>
    </div>
  )
}
