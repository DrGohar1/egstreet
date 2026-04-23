import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const DEFAULTS = {
  site_name: 'الشارع المصري',
  site_tagline: 'أخبار مصر لحظة بلحظة',
  site_url: 'https://egstreetnews.com',
  site_logo: '',
  primary_color: '#e11d48',
  articles_per_page: '12',
  enable_comments: 'true',
  enable_newsletter: 'true',
  disable_popup: 'false',
  facebook_url: '',
  twitter_url: '',
  youtube_url: '',
  google_analytics: '',
  google_search_console: '',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [msg,     setMsg]       = useState(null)
  const [tab,     setTab]       = useState('general')

  useEffect(() => {
    supabase.from('site_settings').select('key,value').then(({ data }) => {
      if (data) {
        const map = {}
        data.forEach(s => { try { map[s.key] = JSON.parse(s.value) } catch { map[s.key] = s.value } })
        setSettings(prev => ({ ...prev, ...map }))
      }
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true); setMsg(null)
    const rows = Object.entries(settings).map(([key, value]) => ({
      key, value: JSON.stringify(value)
    }))
    const { error } = await supabase.from('site_settings')
      .upsert(rows, { onConflict: 'key' })
    if (error) setMsg({ type: 'error', text: error.message })
    else setMsg({ type: 'success', text: 'تم الحفظ بنجاح ✅' })
    setSaving(false)
  }

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }))

  const TABS = [
    { id: 'general',  label: '⚙️ عام' },
    { id: 'design',   label: '🎨 التصميم' },
    { id: 'social',   label: '📱 السوشيال' },
    { id: 'seo',      label: '🔍 SEO' },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">الإعدادات</h1>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm text-center ${msg.type==='success'?'bg-green-50 text-green-700':'bg-red-50 text-red-600'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-2xl">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition ${tab===t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">جاري التحميل...</div> : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">

          {tab === 'general' && <>
            <Field label="اسم الموقع"    value={settings.site_name}    onChange={v=>set('site_name',v)} />
            <Field label="شعار الموقع"   value={settings.site_tagline} onChange={v=>set('site_tagline',v)} />
            <Field label="رابط الموقع"   value={settings.site_url}     onChange={v=>set('site_url',v)} />
            <Field label="مقالات في الصفحة" value={settings.articles_per_page} type="number" onChange={v=>set('articles_per_page',v)} />
            <Toggle label="تفعيل التعليقات"   value={settings.enable_comments==='true'||settings.enable_comments===true}   onChange={v=>set('enable_comments',String(v))} />
            <Toggle label="إخفاء نافذة الاشتراك" value={settings.disable_popup==='true'||settings.disable_popup===true} onChange={v=>set('disable_popup',String(v))} />
          </>}

          {tab === 'design' && <>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">اللون الرئيسي</label>
              <div className="flex items-center gap-3">
                <input type="color" value={settings.primary_color} onChange={e=>set('primary_color',e.target.value)}
                  className="w-12 h-10 rounded-xl border border-gray-200 cursor-pointer" />
                <span className="text-sm font-mono text-gray-500">{settings.primary_color}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">رابط اللوجو</label>
              <input value={settings.site_logo} onChange={e=>set('site_logo',e.target.value)}
                placeholder="https://..." type="url"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
              {settings.site_logo && (
                <img src={settings.site_logo} alt="logo preview" className="h-14 mt-2 object-contain rounded-xl border border-gray-100 p-1" />
              )}
            </div>
          </>}

          {tab === 'social' && <>
            <Field label="Facebook"  value={settings.facebook_url}  onChange={v=>set('facebook_url',v)}  placeholder="https://facebook.com/..." />
            <Field label="Twitter/X" value={settings.twitter_url}   onChange={v=>set('twitter_url',v)}   placeholder="https://twitter.com/..." />
            <Field label="YouTube"   value={settings.youtube_url}   onChange={v=>set('youtube_url',v)}   placeholder="https://youtube.com/..." />
          </>}

          {tab === 'seo' && <>
            <Field label="Google Analytics ID"        value={settings.google_analytics}       onChange={v=>set('google_analytics',v)}       placeholder="G-XXXXXXXXXX" />
            <Field label="Google Search Console Code" value={settings.google_search_console}  onChange={v=>set('google_search_console',v)}  placeholder="meta content=..." />
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
              ✅ الظهور على جوجل: تأكد من إضافة sitemap.xml في Search Console ورابط الموقع صح.
            </div>
          </>}

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold hover:bg-rose-700 transition disabled:opacity-50 mt-4">
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600 block mb-1">{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <button onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all ${value ? 'bg-rose-500' : 'bg-gray-200'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-all ${value ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}
