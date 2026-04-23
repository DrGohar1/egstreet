import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

function toSlug(text) {
  if (!text) return ''
  const ts = Date.now().toString(36)
  const en = text
    .replace(/[\u0623\u0625\u0622\u0627]/g, 'a').replace(/\u0628/g, 'b').replace(/\u062a/g, 't')
    .replace(/\u062b/g, 'th').replace(/\u062c/g, 'g').replace(/\u062d/g, 'h')
    .replace(/\u062e/g, 'kh').replace(/\u062f/g, 'd').replace(/\u0630/g, 'z')
    .replace(/\u0631/g, 'r').replace(/\u0632/g, 'z').replace(/\u0633/g, 's')
    .replace(/\u0634/g, 'sh').replace(/\u0635/g, 's').replace(/\u0636/g, 'd')
    .replace(/\u0637/g, 't').replace(/\u0638/g, 'z').replace(/\u0639/g, 'a')
    .replace(/\u063a/g, 'gh').replace(/\u0641/g, 'f').replace(/\u0642/g, 'q')
    .replace(/\u0643/g, 'k').replace(/\u0644/g, 'l').replace(/\u0645/g, 'm')
    .replace(/\u0646/g, 'n').replace(/[\u0647\u0629]/g, 'h').replace(/\u0648/g, 'w')
    .replace(/[\u064a\u0649]/g, 'y').replace(/[\u0626\u0621\u0624]/g, 'a')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '').replace(/-+/g, '-')
    .toLowerCase().replace(/^-+|-+$/g, '').trim()
  return en.length >= 5 ? en : ('news-' + ts)
}

const FONT_SIZES  = ['text-sm','text-base','text-lg','text-xl','text-2xl','text-3xl']
const FONT_LABELS = ['\u0635\u063a\u064a\u0631 \u062c\u062f\u0627\u064b','\u0635\u063a\u064a\u0631','\u0639\u0627\u062f\u064a','\u0643\u0628\u064a\u0631','\u0623\u0643\u0628\u0631','\u0636\u062e\u0645']

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
  const [saving, setSaving]   = useState(false)
  const [aiMode, setAiMode]   = useState(null)
  const [imgSearch, setImgSearch] = useState('')
  const [imgResults, setImgResults] = useState([])
  const [msg, setMsg]         = useState(null)
  const [preview, setPreview] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [fontSize, setFontSize]   = useState(2)

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

  function insertAtCursor(before, after) {
    if (after === undefined) after = ''
    const ta = document.getElementById('content-ta')
    if (!ta) return
    const s = ta.selectionStart
    const e2 = ta.selectionEnd
    const sel = form.content.slice(s, e2)
    handleContent(form.content.slice(0, s) + before + sel + after + form.content.slice(e2))
  }

  async function searchImages() {
    if (!imgSearch) return
    setAiMode('image')
    const KEY = import.meta.env.VITE_UNSPLASH_KEY || 'demo'
    const r = await fetch('https://api.unsplash.com/search/photos?query=' + encodeURIComponent(imgSearch) + '&per_page=12&client_id=' + KEY)
    if (r.ok) {
      const d = await r.json()
      setImgResults((d.results || []).map(function(p) { return { url: p.urls.regular, thumb: p.urls.small } }))
    }
    setAiMode(null)
  }

  async function handleSave(status) {
    if (!status) status = form.status
    if (!form.title) { setMsg({ type:'error', text:'\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0645\u0637\u0644\u0648\u0628' }); return }
    var slug = form.slug || toSlug(form.title)
    setSaving(true)
    var payload = Object.assign({}, form, {
      slug: slug,
      status: status,
      published_at: status === 'published' ? (form.published_at || new Date().toISOString()) : null
    })
    var result = isEdit
      ? await supabase.from('articles').update(payload).eq('id', id)
      : await supabase.from('articles').insert(payload)
    if (result.error) { setMsg({ type:'error', text: result.error.message }); setSaving(false); return }
    setMsg({ type:'success', text: status === 'published' ? '\u0646\u064f\u0634\u0631 \u0628\u0646\u062c\u0627\u062d \u2705' : '\u062d\u064f\u0641\u0638 \u0643\u0645\u0633\u0648\u062f\u0629 \u2705' })
    setSaving(false)
    setTimeout(function() { navigate('/egstreet-admin/articles') }, 1200)
  }

  function setField(k, v) { setForm(function(p) { return Object.assign({}, p, {[k]: v}) }) }

  var NL = '\n'

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={function(){ navigate(-1) }} className="text-gray-400 hover:text-gray-600 text-lg">&#8592;</button>
          <h1 className="font-bold text-gray-800">{isEdit ? '\u062a\u0639\u062f\u064a\u0644 \u0645\u0642\u0627\u0644' : '\u0645\u0642\u0627\u0644 \u062c\u062f\u064a\u062f'}</h1>
          <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (form.status==='published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
            {form.status === 'published' ? '\u0645\u0646\u0634\u0648\u0631' : '\u0645\u0633\u0648\u062f\u0629'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={function(){ setPreview(!preview) }} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            {preview ? '\u062a\u0639\u062f\u064a\u0644 \u270f\ufe0f' : '\u0645\u0639\u0627\u064a\u0646\u0629 \uD83D\uDC41\uFE0F'}
          </button>
          <button onClick={function(){ handleSave('draft') }} disabled={saving}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">\u062d\u0641\u0638</button>
          <button onClick={function(){ handleSave('published') }} disabled={saving}
            className="px-4 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-40">
            {saving ? '\u062c\u0627\u0631\u064a...' : '\u0646\u0634\u0631 \u2190'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={'mx-4 mt-3 p-3 rounded-xl text-sm text-center ' + (msg.type==='success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
          {msg.text}
        </div>
      )}

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
        <div className="lg:col-span-2 space-y-4">

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <input value={form.title} onChange={function(e){ handleTitle(e.target.value) }}
              placeholder="\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062e\u0628\u0631..."
              className="w-full text-2xl font-bold text-gray-800 placeholder-gray-300 focus:outline-none border-b border-gray-100 pb-3 mb-3" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex-shrink-0">\u0627\u0644\u0631\u0627\u0628\u0637:</span>
              <div className="flex-1 flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
                <span className="text-xs text-gray-400">/news/</span>
                <input value={form.slug}
                  onChange={function(e){ setSlugCustom(true); setField('slug', e.target.value) }}
                  className="flex-1 text-xs text-rose-600 bg-transparent focus:outline-none min-w-0" placeholder="auto-slug" />
              </div>
              <button onClick={function(){ setSlugCustom(false); setField('slug', toSlug(form.title)) }}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 flex-shrink-0">&#8634;</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">\u0645\u0642\u062f\u0645\u0629 \u0627\u0644\u062e\u0628\u0631</label>
            <textarea value={form.excerpt} onChange={function(e){ setField('excerpt', e.target.value) }}
              rows={2} maxLength={300} placeholder="\u0645\u0644\u062e\u0635 \u0642\u0635\u064a\u0631..."
              className="w-full text-sm text-gray-700 focus:outline-none resize-none placeholder-gray-300" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 flex-wrap">
              <select value={fontSize} onChange={function(e){ setFontSize(+e.target.value) }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                {FONT_LABELS.map(function(l, i) { return <option key={i} value={i}>{l}</option> })}
              </select>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <button onClick={function(){ insertAtCursor('**', '**') }} title="\u0639\u0631\u064a\u0636" className="w-8 h-7 text-sm font-black text-gray-600 hover:bg-gray-100 rounded">B</button>
              <button onClick={function(){ insertAtCursor('*', '*') }}   title="\u0645\u0627\u0626\u0644" className="w-8 h-7 text-sm italic text-gray-600 hover:bg-gray-100 rounded">I</button>
              <button onClick={function(){ insertAtCursor(NL + '## ') }} title="\u0639\u0646\u0648\u0627\u0646" className="w-8 h-7 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded">H2</button>
              <button onClick={function(){ insertAtCursor(NL + '- ') }}  title="\u0642\u0627\u0626\u0645\u0629" className="w-8 h-7 text-sm text-gray-600 hover:bg-gray-100 rounded">&bull;</button>
              <button onClick={function(){ insertAtCursor(NL + '> ') }}  title="\u0627\u0642\u062a\u0628\u0627\u0633" className="w-8 h-7 text-sm text-gray-600 hover:bg-gray-100 rounded">&ldquo;</button>
              <button onClick={function(){ insertAtCursor(NL + '---' + NL) }} title="\u0641\u0627\u0635\u0644" className="w-8 h-7 text-sm text-gray-600 hover:bg-gray-100 rounded">&#8212;</button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <button onClick={function(){ setAiMode('image'); setImgSearch(form.title) }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                &#128269; \u0635\u0648\u0631
              </button>
            </div>

            {preview ? (
              <div className={'p-4 min-h-64 prose prose-sm max-w-none ' + FONT_SIZES[fontSize]}
                dangerouslySetInnerHTML={{ __html: form.content.replace(/\n/g, '<br/>') }} />
            ) : (
              <textarea id="content-ta" value={form.content}
                onChange={function(e){ handleContent(e.target.value) }}
                rows={20} placeholder="\u0627\u0643\u062a\u0628 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0647\u0646\u0627..."
                className={'w-full p-4 ' + FONT_SIZES[fontSize] + ' text-gray-700 focus:outline-none resize-none leading-relaxed'} />
            )}

            <div className="flex justify-between px-4 py-2 border-t border-gray-50 text-xs text-gray-400">
              <span>{wordCount} \u0643\u0644\u0645\u0629</span>
              <span>~{form.reading_time} \u062f\u0642\u064a\u0642\u0629 \u0642\u0631\u0627\u0621\u0629</span>
            </div>
          </div>

          {aiMode === 'image' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex gap-2 mb-3">
                <input value={imgSearch} onChange={function(e){ setImgSearch(e.target.value) }}
                  placeholder="\u0627\u0628\u062d\u062b \u0639\u0646 \u0635\u0648\u0631\u0629 \u0628\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a..."
                  onKeyDown={function(e){ if(e.key==='Enter') searchImages() }}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                <button onClick={searchImages} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl">\u0628\u062d\u062b</button>
                <button onClick={function(){ setAiMode(null) }} className="px-3 py-2 border rounded-xl text-sm">&#10005;</button>
              </div>
              {imgResults.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imgResults.map(function(img, i) {
                    return (
                      <button key={i} onClick={function(){ setField('featured_image', img.url); setAiMode(null) }}
                        className="relative group overflow-hidden rounded-xl aspect-video">
                        <img src={img.thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                          <span className="text-white text-xs opacity-0 group-hover:opacity-100">\u0627\u062e\u062a\u0631</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 mb-3">&#128269; SEO</h3>
            <div className="space-y-2">
              <input value={form.meta_title || ''} onChange={function(e){ setField('meta_title', e.target.value) }}
                placeholder="\u0639\u0646\u0648\u0627\u0646 SEO"
                className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <textarea value={form.meta_description || ''} onChange={function(e){ setField('meta_description', e.target.value) }}
                rows={2} maxLength={160} placeholder="\u0648\u0635\u0641 \u062c\u0648\u062c\u0644 (160 \u062d\u0631\u0641)"
                className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" />
              <div className="bg-gray-50 rounded-xl p-3 text-xs">
                <div className="text-blue-600 font-medium truncate">{form.meta_title || form.title || '\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062e\u0628\u0631'}</div>
                <div className="text-green-600 truncate">egstreetnews.com &rsaquo; news &rsaquo; {form.slug || 'slug'}</div>
                <div className="text-gray-500 line-clamp-2">{form.meta_description || form.excerpt || '\u0648\u0635\u0641 \u0627\u0644\u062e\u0628\u0631..'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 mb-3">&#128444;&#65039; \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629</h3>
            {form.featured_image ? (
              <div className="relative group">
                <img src={form.featured_image} alt="" className="w-full aspect-video object-cover rounded-xl" />
                <button onClick={function(){ setField('featured_image', '') }}
                  className="absolute top-2 left-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100">&#10005;</button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl aspect-video flex items-center justify-center text-gray-300">
                <span>&#128444;&#65039; \u0644\u0627 \u062a\u0648\u062c\u062f \u0635\u0648\u0631\u0629</span>
              </div>
            )}
            <input type="url" value={form.featured_image}
              onChange={function(e){ setField('featured_image', e.target.value) }}
              placeholder="\u0631\u0627\u0628\u0637 \u0627\u0644\u0635\u0648\u0631\u0629 https://..."
              className="w-full mt-2 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none" />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-500">&#9881;&#65039; \u0627\u0644\u0646\u0634\u0631</h3>
            <select value={form.category_id} onChange={function(e){ setField('category_id', e.target.value) }}
              className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="">-- \u062a\u0635\u0646\u064a\u0641 --</option>
              {categories.map(function(c) { return <option key={c.id} value={c.id}>{c.name_ar}</option> })}
            </select>
            <input value={form.custom_author_name} onChange={function(e){ setField('custom_author_name', e.target.value) }}
              placeholder="\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u062a\u0628"
              className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            <input value={form.tags_cache} onChange={function(e){ setField('tags_cache', e.target.value) }}
              placeholder="\u0648\u0633\u0645 1, \u0648\u0633\u0645 2"
              className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">\u062e\u0628\u0631 \u0639\u0627\u062c\u0644</span>
              <button onClick={function(){ setField('is_breaking', !form.is_breaking) }}
                className={'w-10 h-5 rounded-full transition-all ' + (form.is_breaking ? 'bg-rose-500' : 'bg-gray-200')}>
                <div className={'w-4 h-4 bg-white rounded-full shadow m-0.5 transition-all ' + (form.is_breaking ? 'translate-x-5' : '')} />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">\u0645\u0645\u064a\u0632</span>
              <button onClick={function(){ setField('is_featured', !form.is_featured) }}
                className={'w-10 h-5 rounded-full transition-all ' + (form.is_featured ? 'bg-amber-500' : 'bg-gray-200')}>
                <div className={'w-4 h-4 bg-white rounded-full shadow m-0.5 transition-all ' + (form.is_featured ? 'translate-x-5' : '')} />
              </button>
            </div>
          </div>

          <button onClick={function(){ handleSave('published') }} disabled={saving}
            className="w-full bg-rose-600 text-white py-3 rounded-2xl font-bold hover:bg-rose-700 disabled:opacity-40">
            &#128640; \u0646\u0634\u0631 \u0627\u0644\u0622\u0646
          </button>
          <button onClick={function(){ handleSave('draft') }} disabled={saving}
            className="w-full border border-gray-200 py-2.5 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            &#128190; \u062d\u0641\u0638 \u0645\u0633\u0648\u062f\u0629
          </button>
        </div>
      </div>
    </div>
  )
}
