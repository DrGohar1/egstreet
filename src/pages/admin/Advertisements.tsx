import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Megaphone, Plus, Pencil, Trash2, Eye, EyeOff,
  Save, X, Loader2, ExternalLink, BarChart2, Globe,
  DollarSign, Link, Image as ImageIcon, Copy, Check,
  Settings, RefreshCw, Zap
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────
type Ad = {
  id: string; title_ar: string; title_en: string; position: string;
  image_url: string; link_url: string | null; is_active: boolean;
  placement_order: number; clicks: number; impressions: number;
  start_date: string | null; end_date: string | null;
  description_ar: string | null;
};

const POSITIONS = [
  { key: "header_top",     label: "أعلى الهيدر (728×90)"         },
  { key: "after_hero",     label: "بعد الأخبار الرئيسية (970×90)" },
  { key: "sidebar_top",    label: "أعلى الشريط الجانبي (300×250)" },
  { key: "sidebar_mid",    label: "وسط الشريط الجانبي (300×250)"  },
  { key: "article_top",    label: "أعلى المقال (728×90)"           },
  { key: "article_mid",    label: "داخل المقال (300×250)"          },
  { key: "article_bottom", label: "أسفل المقال (728×90)"           },
  { key: "footer_top",     label: "فوق الفوتر (970×90)"            },
];

const BLANK_AD: Partial<Ad> = {
  title_ar:"", title_en:"", position:"sidebar_top",
  image_url:"", link_url:"", is_active:true, placement_order:1,
  description_ar:"",
};

// ═══════════════════════════════════════════════════════════
export default function Advertisements() {
  const [tab,     setTab]     = useState<"banners"|"adsense">("banners");
  const [ads,     setAds]     = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [modal,   setModal]   = useState<"create"|"edit"|null>(null);
  const [editAd,  setEditAd]  = useState<Ad|null>(null);
  const [form,    setForm]    = useState<Partial<Ad>>(BLANK_AD);
  const [delId,   setDelId]   = useState<string|null>(null);
  const [copied,  setCopied]  = useState<string|null>(null);

  // AdSense settings
  const [adsenseId,      setAdsenseId]      = useState("");
  const [adsenseEnabled, setAdsenseEnabled] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("advertisements").select("*").order("placement_order");
    setAds(data || []);
    const { data: s } = await supabase.from("site_settings")
      .select("key,value")
      .in("key", ["adsense_id","adsense_enabled"]);
    (s || []).forEach(r => {
      if (r.key === "adsense_id")      setAdsenseId(r.value || "");
      if (r.key === "adsense_enabled") setAdsenseEnabled(r.value === "true");
    });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (ad: Ad) => {
    const v = !ad.is_active;
    await supabase.from("advertisements").update({ is_active: v }).eq("id", ad.id);
    setAds(p => p.map(a => a.id === ad.id ? { ...a, is_active: v } : a));
    toast.success(v ? "✅ تم تفعيل الإعلان" : "⛔ تم إيقاف الإعلان");
  };

  const saveAd = async () => {
    if (!form.title_ar || !form.image_url || !form.position) {
      toast.error("أكمل الحقول المطلوبة"); return;
    }
    setSaving(true);
    if (modal === "create") {
      const { error } = await supabase.from("advertisements").insert({
        title_ar: form.title_ar!, title_en: form.title_en || form.title_ar!,
        position: form.position!, image_url: form.image_url!,
        link_url: form.link_url || null, is_active: true,
        placement_order: form.placement_order || 1,
        description_ar: form.description_ar || null,
      } as any);
      if (error) { toast.error("خطأ: " + error.message); } else { toast.success("✅ تم إضافة الإعلان"); }
    } else if (editAd) {
      const { error } = await supabase.from("advertisements").update({
        title_ar: form.title_ar!, title_en: form.title_en || form.title_ar!,
        position: form.position!, image_url: form.image_url!,
        link_url: form.link_url || null, is_active: form.is_active ?? true,
        placement_order: form.placement_order || 1,
        description_ar: form.description_ar || null,
      } as any).eq("id", editAd.id);
      if (error) { toast.error("خطأ: " + error.message); } else { toast.success("✅ تم تحديث الإعلان"); }
    }
    setSaving(false); setModal(null); setEditAd(null); load();
  };

  const deleteAd = async (id: string) => {
    await supabase.from("advertisements").delete().eq("id", id);
    toast.success("✅ تم حذف الإعلان");
    setDelId(null); load();
  };

  const saveAdsense = async () => {
    setSavingSettings(true);
    const upserts = [
      { key: "adsense_id",      value: adsenseId },
      { key: "adsense_enabled", value: String(adsenseEnabled) },
    ];
    for (const u of upserts) {
      await supabase.from("site_settings").upsert({ ...u, updated_at: new Date().toISOString() }, { onConflict: "key" });
    }
    toast.success("✅ تم حفظ إعدادات AdSense");
    setSavingSettings(false);
  };

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopied(label); setTimeout(() => setCopied(null), 2000);
    toast.success("✅ تم النسخ");
  };

  const closeModal = () => { setModal(null); setEditAd(null); setForm(BLANK_AD); };

  const posLabel = (k: string) => POSITIONS.find(p => p.key === k)?.label || k;
  const totalClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);

  // ── AdSense head script code ──
  const adsenseScript = adsenseId
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}" crossorigin="anonymous"></script>`
    : `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX" crossorigin="anonymous"></script>`;

  const adsenseUnit = `<!-- مساحة إعلانية في المقال -->
<ins class="adsbygoogle"
  style="display:block"
  data-ad-client="${adsenseId || 'ca-pub-XXXXXXXXXX'}"
  data-ad-slot="XXXXXXXXXX"
  data-ad-format="auto"
  data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`;

  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-5 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary"/> نظام الإعلانات
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">إعلانات البانر + Google AdSense</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted">
          <RefreshCw className="w-4 h-4"/>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"إجمالي الإعلانات",  val:ads.length,       icon:<Megaphone className="w-4 h-4"/>, color:"text-primary" },
          { label:"النقرات الكلية",     val:totalClicks,      icon:<BarChart2 className="w-4 h-4"/>, color:"text-green-500" },
          { label:"المشاهدات الكلية",   val:totalImpressions, icon:<Eye className="w-4 h-4"/>,       color:"text-blue-500" },
        ].map(s=>(
          <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
            <p className="text-xl font-black">{s.val.toLocaleString("ar")}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl">
        {[
          { key:"banners",  label:"📢 إعلانات البانر",   desc:"مساحات مدفوعة + سبونسرد" },
          { key:"adsense",  label:"🤖 Google AdSense",   desc:"إعلانات جوجل التلقائية" },
        ].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key as any)}
            className={`flex-1 text-center py-2 px-3 rounded-lg text-sm font-bold transition-all ${tab===t.key?"bg-card shadow-sm text-foreground":"text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: Banners ═══ */}
      {tab === "banners" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold text-muted-foreground">
              {ads.filter(a=>a.is_active).length} إعلان نشط من {ads.length}
            </p>
            <button onClick={()=>{ setForm(BLANK_AD); setModal("create"); }}
              className="flex items-center gap-2 bg-primary text-white text-sm font-black px-4 py-2 rounded-xl hover:bg-primary/85 shadow-sm">
              <Plus className="w-4 h-4"/> إضافة إعلان
            </button>
          </div>

          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
          : ads.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-20"/>
              <p className="text-sm font-bold">لا يوجد إعلانات بعد</p>
              <p className="text-xs mt-1">أضف إعلانك الأول أو قدّم عرضاً للمُعلنين</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ads.map(ad => (
                <div key={ad.id} className={`bg-card border rounded-2xl overflow-hidden ${!ad.is_active?"opacity-60 border-dashed":"border-border"}`}>
                  <div className="flex items-center gap-3 p-3">
                    {/* Preview */}
                    <div className="w-16 h-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center border border-border shrink-0">
                      {ad.image_url
                        ? <img src={ad.image_url} alt="" className="w-full h-full object-cover"/>
                        : <ImageIcon className="w-5 h-5 text-muted-foreground"/>}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm">{ad.title_ar}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${ad.is_active?"bg-green-100 text-green-700 border-green-200":"bg-muted text-muted-foreground border-border"}`}>
                          {ad.is_active?"نشط":"موقوف"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{posLabel(ad.position)}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-muted-foreground/70">{ad.clicks} نقرة · {ad.impressions} مشاهدة</span>
                        {ad.link_url && (
                          <a href={ad.link_url} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-primary flex items-center gap-0.5 hover:underline">
                            <ExternalLink className="w-3 h-3"/> عرض الرابط
                          </a>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleActive(ad)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${ad.is_active?"bg-green-100 text-green-700 hover:bg-green-200":"bg-red-100 text-red-600 hover:bg-red-200"}`}>
                        {ad.is_active ? <Eye className="w-3.5 h-3.5"/> : <EyeOff className="w-3.5 h-3.5"/>}
                      </button>
                      <button onClick={() => { setEditAd(ad); setForm({ ...ad }); setModal("edit"); }}
                        className="w-8 h-8 rounded-xl bg-muted hover:bg-blue-100 hover:text-blue-700 flex items-center justify-center transition-colors">
                        <Pencil className="w-3.5 h-3.5"/>
                      </button>
                      {delId === ad.id
                        ? <div className="flex gap-1">
                            <button onClick={() => deleteAd(ad.id)} className="h-8 px-2 rounded-xl bg-red-500 text-white text-xs font-black">حذف؟</button>
                            <button onClick={() => setDelId(null)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"><X className="w-3.5 h-3.5"/></button>
                          </div>
                        : <button onClick={() => setDelId(ad.id)} className="w-8 h-8 rounded-xl bg-muted hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pricing info block */}
          <div className="bg-gradient-to-l from-primary/5 to-violet-500/5 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-primary"/>
              <h3 className="font-black text-sm">باقات الإعلان الممول</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { name:"بانر جانبي",  size:"300×250", note:"أسبوع" },
                { name:"هيدر بانر",   size:"728×90",  note:"أسبوع" },
                { name:"سبونسرد آرتيكل", size:"مقال كامل", note:"دائم" },
              ].map(p=>(
                <div key={p.name} className="bg-card border border-border rounded-xl p-2">
                  <p className="font-black text-primary text-xs">{p.name}</p>
                  <p className="text-muted-foreground text-[10px]">{p.size}</p>
                  <p className="text-[9px] mt-1 text-green-600 font-bold">{p.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: AdSense ═══ */}
      {tab === "adsense" && (
        <div className="space-y-4">
          {/* Enable/Disable */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <p className="font-black text-sm">Google AdSense</p>
                  <p className="text-xs text-muted-foreground">إعلانات تلقائية من جوجل</p>
                </div>
              </div>
              <button onClick={() => setAdsenseEnabled(p => !p)}
                className={`w-12 h-6 rounded-full transition-colors relative ${adsenseEnabled ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${adsenseEnabled ? "right-1" : "left-1"}`}/>
              </button>
            </div>
          </div>

          {/* Publisher ID */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="font-black text-sm flex items-center gap-2"><Settings className="w-4 h-4"/> إعداد الحساب</h3>
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Publisher ID</label>
              <input value={adsenseId} onChange={e => setAdsenseId(e.target.value.trim())}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX" dir="ltr"
                className="w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl focus:border-primary focus:outline-none font-mono"/>
              <p className="text-[10px] text-muted-foreground mt-1">من Google AdSense → الحساب → معلومات الحساب</p>
            </div>
            <button onClick={saveAdsense} disabled={savingSettings}
              className="flex items-center gap-2 bg-primary text-white text-sm font-black px-4 py-2.5 rounded-xl hover:bg-primary/85 disabled:opacity-50">
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
              حفظ الإعدادات
            </button>
          </div>

          {/* Code snippets */}
          <div className="space-y-3">
            <h3 className="font-black text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500"/> الأكواد الجاهزة</h3>

            {[
              { label:"كود الـ Head (في index.html)", code: adsenseScript, id:"head" },
              { label:"وحدة إعلانية داخل المقال", code: adsenseUnit, id:"unit" },
            ].map(item => (
              <div key={item.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold">{item.label}</p>
                  <button onClick={() => copyCode(item.code, item.id)}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors">
                    {copied === item.id ? <Check className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                    {copied === item.id ? "تم النسخ" : "نسخ"}
                  </button>
                </div>
                <pre className="text-[10px] bg-muted rounded-lg p-2 overflow-x-auto text-muted-foreground leading-relaxed whitespace-pre-wrap" dir="ltr">
                  {item.code}
                </pre>
              </div>
            ))}

            {/* How to add to index.html */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <p className="text-xs font-black text-amber-800 dark:text-amber-300 mb-2">📌 خطوات التفعيل</p>
              <ol className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                <li>انسخ كود الـ Head وضعه في <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">index.html</code> قبل <code>&lt;/head&gt;</code></li>
                <li>في Vercel → Environment Variables → أضف <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">VITE_ADSENSE_ID=ca-pub-XXX</code></li>
                <li>انتظر موافقة AdSense (3-14 يوم) ثم فعّل Auto Ads</li>
                <li>للمساحات اليدوية: استخدم كود الوحدة الإعلانية في أي مكان</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Modal: Create/Edit Ad ═══ */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-black text-base">
                {modal === "create" ? "إضافة إعلان جديد" : "تعديل الإعلان"}
              </h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">اسم الإعلان *</label>
                <input value={form.title_ar || ""} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))}
                  placeholder="مثال: شركة X — بانر جانبي"
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none"/>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">رابط صورة البانر *</label>
                <input value={form.image_url || ""} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..." dir="ltr"
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none font-mono"/>
                {form.image_url && (
                  <img src={form.image_url} alt="" className="mt-2 max-h-24 rounded-lg border border-border object-contain w-full"/>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">رابط الوجهة (Backlink)</label>
                <input value={form.link_url || ""} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                  placeholder="https://advertiser-website.com" dir="ltr"
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none"/>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">موضع الإعلان *</label>
                <select value={form.position || "sidebar_top"} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none">
                  {POSITIONS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">ترتيب الظهور</label>
                <input type="number" min={1} value={form.placement_order || 1}
                  onChange={e => setForm(f => ({ ...f, placement_order: +e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none" dir="ltr"/>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">وصف (اختياري — للمُعلن)</label>
                <textarea value={form.description_ar || ""} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))}
                  placeholder="باقة سبونسرد كونتنت — backlink dofollow..." rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted focus:border-primary focus:outline-none resize-none"/>
              </div>
            </div>
            <div className="flex gap-2 p-5 border-t border-border">
              <button onClick={saveAd} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-black py-2.5 rounded-xl hover:bg-primary/85 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                {modal === "create" ? "إضافة الإعلان" : "حفظ التعديلات"}
              </button>
              <button onClick={closeModal} className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
