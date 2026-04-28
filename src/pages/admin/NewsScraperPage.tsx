import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { toast } from "sonner";
import {
  Rss, RefreshCw, Globe, Newspaper, ExternalLink, Loader2,
  Trash2, Download, CheckSquare, Square, Settings2, Save,
  Key, Play, Pause, Clock, Tag, Plus, X, Check, AlertCircle, Zap
} from "lucide-react";

// ═══════════════════════════════════════════════
//  NEWS SOURCES CONFIG
// ═══════════════════════════════════════════════
const NEWS_APIS = [
  {
    id: "newsapi",
    name: "NewsAPI.org",
    logo: "https://newsapi.org/favicon.ico",
    description: "100 طلب/يوم مجاناً — عالمي",
    url: "https://newsapi.org",
    freeLimit: "100/day",
    settingKey: "newsapi_key",
    color: "bg-blue-600",
    endpoints: [
      { label: "أخبار مصر",        q: "egypt",          lang: "ar" },
      { label: "أخبار عالمية",     q: "world",          lang: "ar" },
      { label: "سياسة",            q: "politics egypt", lang: "ar" },
      { label: "اقتصاد",           q: "economy egypt",  lang: "ar" },
      { label: "رياضة",            q: "sports egypt",   lang: "ar" },
      { label: "تكنولوجيا",        q: "technology",     lang: "ar" },
      { label: "الأخبار العاجلة",  q: "breaking",       lang: "ar" },
    ],
  },
  {
    id: "gnews",
    name: "GNews.io",
    logo: "https://gnews.io/favicon.ico",
    description: "100 طلب/يوم مجاناً — عربي ممتاز",
    url: "https://gnews.io",
    freeLimit: "100/day",
    settingKey: "gnews_key",
    color: "bg-green-600",
    endpoints: [
      { label: "أخبار مصر",        q: "مصر",     lang: "ar", country: "eg" },
      { label: "أخبار عالمية",     q: "العالم",  lang: "ar" },
      { label: "رياضة",            q: "رياضة",   lang: "ar" },
      { label: "اقتصاد",           q: "اقتصاد",  lang: "ar" },
      { label: "تكنولوجيا",        q: "تكنولوجيا", lang: "ar" },
    ],
  },
  {
    id: "mediastack",
    name: "Mediastack",
    logo: "https://mediastack.com/favicon.ico",
    description: "500 طلب/شهر مجاناً",
    url: "https://mediastack.com",
    freeLimit: "500/month",
    settingKey: "mediastack_key",
    color: "bg-purple-600",
    endpoints: [
      { label: "أخبار مصر",    q: "egypt",   lang: "ar" },
      { label: "أخبار عربية",  q: "",        lang: "ar" },
    ],
  },
];

// RSS Sources (no API key needed)
const RSS_SOURCES = [
  { id: "ahram",       name: "الأهرام",          url: "https://www.ahram.org.eg/rss/",                  cat: "أخبار مصر"    },
  { id: "youm7",       name: "اليوم السابع",      url: "https://api.youm7.com/api/Feed/rss",             cat: "أخبار مصر"    },
  { id: "masrawy",     name: "مصراوي",            url: "https://www.masrawy.com/news/rss",               cat: "أخبار مصر"    },
  { id: "bbc_ar",      name: "BBC عربي",          url: "https://feeds.bbci.co.uk/arabic/rss.xml",        cat: "أخبار العالم" },
  { id: "aljazeera",   name: "الجزيرة",           url: "https://www.aljazeera.net/rss-feeds/",           cat: "أخبار العالم" },
  { id: "skynews_ar",  name: "سكاي نيوز عربية",  url: "https://www.skynewsarabia.com/feeds/rss/egypt",  cat: "أخبار مصر"    },
  { id: "rt_ar",       name: "RT عربي",           url: "https://arabic.rt.com/rss/",                    cat: "أخبار العالم" },
  { id: "cnn_ar",      name: "CNN عربي",          url: "https://arabic.cnn.com/rss/all",                cat: "أخبار العالم" },
  { id: "kooora",      name: "كورة",              url: "https://www.kooora.com/?feed",                  cat: "رياضة"        },
  { id: "filgoal",     name: "فيلجول",            url: "https://www.filgoal.com/feed/",                 cat: "رياضة"        },
];

// ═══════════════════════════════════════════════
//  CATEGORY MAP (name → id)
// ═══════════════════════════════════════════════
type ScrapedArticle = {
  title: string;
  excerpt: string;
  content: string;
  featured_image: string;
  source: string;
  source_url: string;
  published_at: string;
  catLabel: string;
  selected?: boolean;
};

const PROXY = "https://api.allorigins.win/raw?url=";

export default function NewsScraperPage() {
  const { settings, refetch } = useSiteSettings();

  // State
  const [tab,          setTab]          = useState<"rss"|"api">("rss");
  const [apiKeys,      setApiKeys]      = useState<Record<string,string>>({});
  const [showKeys,     setShowKeys]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [importing,    setImporting]    = useState(false);
  const [scraped,      setScraped]      = useState<ScrapedArticle[]>([]);
  const [selected,     setSelected]     = useState<Set<number>>(new Set());
  const [categories,   setCategories]   = useState<{id:string;name_ar:string;slug:string}[]>([]);
  const [catMap,       setCatMap]       = useState<Record<string,string>>({});
  const [selectedRss,  setSelectedRss]  = useState<Set<string>>(new Set());
  const [selApiSrc,    setSelApiSrc]    = useState("newsapi");
  const [selEndpoint,  setSelEndpoint]  = useState(0);
  const [savedKeys,    setSavedKeys]    = useState(false);
  const [autoImport,   setAutoImport]   = useState(false);

  // Load cats
  useEffect(() => {
    supabase.from("categories").select("id,name_ar,slug").order("sort_order")
      .then(({ data }) => {
        if (data) {
          setCategories(data);
          const m: Record<string,string> = {};
          data.forEach(c => { m[c.name_ar] = c.id; m[c.slug] = c.id; });
          setCatMap(m);
        }
      });
    // Load saved API keys from settings
    const keys: Record<string,string> = {};
    NEWS_APIS.forEach(api => {
      if (settings?.[api.settingKey]) keys[api.id] = settings[api.settingKey];
    });
    if (Object.keys(keys).length > 0) setApiKeys(keys);
  }, [settings]);

  // ── Save API keys to site_settings ──
  const saveKeys = async () => {
    for (const api of NEWS_APIS) {
      const val = apiKeys[api.id] || "";
      await supabase.from("site_settings").upsert({ key: api.settingKey, value: val }, { onConflict: "key" });
    }
    await refetch();
    setSavedKeys(true);
    toast.success("✅ تم حفظ مفاتيح API");
    setTimeout(() => setSavedKeys(false), 2000);
  };

  // ── Parse RSS Feed ──
  const parseRss = async (url: string): Promise<ScrapedArticle[]> => {
    const res = await fetch(`${PROXY}${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) });
    const txt = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(txt, "text/xml");
    const items = Array.from(doc.querySelectorAll("item")).slice(0, 15);
    return items.map(item => {
      const title   = item.querySelector("title")?.textContent?.trim() || "";
      const desc    = item.querySelector("description")?.textContent?.replace(/<[^>]+>/g, "").trim() || "";
      const link    = item.querySelector("link")?.textContent?.trim() || "";
      const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";
      const imgEl   = item.querySelector("enclosure[type^='image'], media\\:thumbnail, media\\:content");
      const img     = imgEl?.getAttribute("url") || imgEl?.getAttribute("src") || "";
      return {
        title, excerpt: desc.slice(0, 300), content: desc,
        featured_image: img, source: url,
        source_url: link, published_at: pubDate || new Date().toISOString(),
        catLabel: "",
      };
    }).filter(a => a.title.length > 5);
  };

  // ── Fetch from NewsAPI ──
  const fetchNewsAPI = async (q: string, lang: string): Promise<ScrapedArticle[]> => {
    const key = apiKeys["newsapi"];
    if (!key) { toast.error("أدخل NewsAPI Key أولاً"); return []; }
    // Use proxy to avoid CORS
    const apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${lang}&pageSize=20&apiKey=${key}`;
    const res = await fetch(`${PROXY}${encodeURIComponent(apiUrl)}`);
    const data = await res.json();
    if (data.status !== "ok") { toast.error(data.message || "خطأ في NewsAPI"); return []; }
    return (data.articles || []).map((a: Record<string,string>) => ({
      title: a.title || "", excerpt: a.description || "",
      content: a.content || a.description || "",
      featured_image: a.urlToImage || "",
      source: a.source?.name || "NewsAPI",
      source_url: a.url || "",
      published_at: a.publishedAt || new Date().toISOString(),
      catLabel: "",
    })).filter((a:ScrapedArticle) => a.title && !a.title.includes("[Removed]"));
  };

  // ── Fetch from GNews ──
  const fetchGNews = async (q: string, lang: string): Promise<ScrapedArticle[]> => {
    const key = apiKeys["gnews"];
    if (!key) { toast.error("أدخل GNews Key أولاً"); return []; }
    const apiUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=${lang}&max=20&apikey=${key}`;
    const res = await fetch(`${PROXY}${encodeURIComponent(apiUrl)}`);
    const data = await res.json();
    return (data.articles || []).map((a: Record<string,string>) => ({
      title: a.title || "", excerpt: a.description || "",
      content: a.content || a.description || "",
      featured_image: a.image || "",
      source: a.source?.name || "GNews",
      source_url: a.url || "",
      published_at: a.publishedAt || new Date().toISOString(),
      catLabel: "",
    }));
  };

  // ── Fetch from Mediastack ──
  const fetchMediastack = async (q: string, lang: string): Promise<ScrapedArticle[]> => {
    const key = apiKeys["mediastack"];
    if (!key) { toast.error("أدخل Mediastack Key أولاً"); return []; }
    const apiUrl = `http://api.mediastack.com/v1/news?access_key=${key}&languages=${lang}&keywords=${encodeURIComponent(q)}&limit=20`;
    const res = await fetch(`${PROXY}${encodeURIComponent(apiUrl)}`);
    const data = await res.json();
    return (data.data || []).map((a: Record<string,string>) => ({
      title: a.title || "", excerpt: a.description || "",
      content: a.description || "",
      featured_image: a.image || "",
      source: a.source || "Mediastack",
      source_url: a.url || "",
      published_at: a.published_at || new Date().toISOString(),
      catLabel: "",
    }));
  };

  // ── Main fetch action ──
  const fetchNews = useCallback(async () => {
    setLoading(true); setScraped([]); setSelected(new Set());
    try {
      let articles: ScrapedArticle[] = [];

      if (tab === "rss") {
        if (selectedRss.size === 0) { toast.error("اختر مصدر RSS واحد على الأقل"); setLoading(false); return; }
        for (const srcId of selectedRss) {
          const src = RSS_SOURCES.find(s => s.id === srcId);
          if (!src) continue;
          try {
            const arts = await parseRss(src.url);
            articles.push(...arts.map(a => ({ ...a, catLabel: src.cat, source: src.name })));
          } catch { toast.error(`فشل تحميل ${src.name}`); }
        }
      } else {
        const api = NEWS_APIS.find(a => a.id === selApiSrc);
        if (!api) { setLoading(false); return; }
        const ep = api.endpoints[selEndpoint];
        if (selApiSrc === "newsapi")    articles = await fetchNewsAPI(ep.q, ep.lang);
        else if (selApiSrc === "gnews") articles = await fetchGNews(ep.q, ep.lang);
        else                            articles = await fetchMediastack(ep.q, ep.lang);
        articles = articles.map(a => ({ ...a, catLabel: ep.label }));
      }

      if (!articles.length) { toast.error("لا توجد أخبار — جرب مصدراً آخر"); setLoading(false); return; }

      // Auto-assign category from catLabel
      const withCats = articles.map(a => ({ ...a, catLabel: a.catLabel || "أخبار مصر" }));
      setScraped(withCats);
      setSelected(new Set(withCats.map((_, i) => i)));
      toast.success(`✅ تم جلب ${withCats.length} خبر`);
    } catch (e) {
      toast.error("خطأ في الاتصال — تحقق من مفاتيح API");
    }
    setLoading(false);
  }, [tab, selectedRss, selApiSrc, selEndpoint, apiKeys]);

  // ── Import selected articles to Supabase ──
  const importArticles = async () => {
    if (selected.size === 0) { toast.error("اختر أخباراً للاستيراد"); return; }
    setImporting(true);
    let ok = 0, skip = 0;

    const { data: { user } } = await supabase.auth.getUser();

    for (const idx of selected) {
      const a = scraped[idx];
      const catId = catMap[a.catLabel] || catMap["أخبار مصر"] || categories[0]?.id;
      if (!catId) continue;

      // Generate unique slug
      const slug = a.title.slice(0, 60)
        .replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, "")
        .toLowerCase() + "-" + Date.now().toString(36);

      const payload = {
        title: a.title,
        slug,
        excerpt: a.excerpt?.slice(0, 500) || a.title,
        content: `<p>${(a.content || a.excerpt || a.title).replace(/\n/g, "</p><p>")}</p>`,
        featured_image: a.featured_image || null,
        category_id: catId,
        author_id: user?.id || null,
        custom_author_name: a.source,
        status: "published",
        published_at: new Date(a.published_at).toISOString(),
        reading_time: Math.ceil((a.content?.split(" ").length || 50) / 200),
      };

      const { error } = await supabase.from("articles").insert(payload);
      if (error) {
        if (error.code === "23505") skip++; // duplicate
        else console.error(error);
      } else ok++;
    }

    setImporting(false);
    if (ok > 0)   toast.success(`✅ تم نشر ${ok} خبر على الموقع!`);
    if (skip > 0) toast.info(`${skip} خبر موجود مسبقاً، تم تخطيه`);

    // Clear imported
    const newScraped = scraped.filter((_, i) => !selected.has(i));
    setScraped(newScraped);
    setSelected(new Set());
  };

  const toggleSelect = (i: number) =>
    setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const selectAll   = () => setSelected(new Set(scraped.map((_, i) => i)));
  const deselectAll = () => setSelected(new Set());

  const curApi = NEWS_APIS.find(a => a.id === selApiSrc);

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">

      {/* ── Page Title ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Rss className="w-7 h-7 text-primary"/>
            سحب الأخبار تلقائياً
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            اختر مصدرك واسحب الأخبار مباشرةً إلى الموقع
          </p>
        </div>
        <button onClick={() => setShowKeys(k => !k)}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors">
          <Key className="w-3.5 h-3.5"/>
          إعدادات API Keys
        </button>
      </div>

      {/* ── API Keys Panel ── */}
      {showKeys && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <Settings2 className="w-4 h-4 text-primary"/> مفاتيح API
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {NEWS_APIS.map(api => (
              <div key={api.id} className="space-y-1.5">
                <label className="text-xs font-bold flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${api.color}`}/>
                  {api.name}
                  <span className="text-muted-foreground font-normal">— {api.freeLimit}</span>
                  <a href={api.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:opacity-70">
                    <ExternalLink className="w-3 h-3"/>
                  </a>
                </label>
                <input type="password"
                  value={apiKeys[api.id] || ""}
                  onChange={e => setApiKeys(k => ({ ...k, [api.id]: e.target.value }))}
                  placeholder={`أدخل ${api.name} Key`}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors font-mono"/>
              </div>
            ))}
          </div>
          <button onClick={saveKeys}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-primary/85 transition-colors">
            {savedKeys ? <Check className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
            {savedKeys ? "تم الحفظ!" : "حفظ المفاتيح"}
          </button>
        </div>
      )}

      {/* ── Source Tabs ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Tab switcher */}
        <div className="flex border-b border-border">
          {([
            { id:"rss", label:"مصادر RSS", icon:<Rss className="w-4 h-4"/> },
            { id:"api", label:"News API",  icon:<Globe className="w-4 h-4"/> },
          ] as const).map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setScraped([]); setSelected(new Set()); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors
                ${tab === t.id ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── RSS Sources ── */}
          {tab === "rss" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">اختر مصدراً أو أكثر لسحب أحدث مقالاتهم:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {RSS_SOURCES.map(src => {
                  const sel = selectedRss.has(src.id);
                  return (
                    <button key={src.id}
                      onClick={() => setSelectedRss(s => { const n = new Set(s); sel ? n.delete(src.id) : n.add(src.id); return n; })}
                      className={`relative p-3 rounded-xl border-2 text-center transition-all ${sel
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40 text-muted-foreground hover:bg-muted"}`}>
                      {sel && <Check className="w-3 h-3 absolute top-1.5 left-1.5 text-primary"/>}
                      <Newspaper className="w-5 h-5 mx-auto mb-1"/>
                      <div className="text-xs font-bold leading-tight">{src.name}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{src.cat}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── API Sources ── */}
          {tab === "api" && (
            <div className="space-y-4">
              {/* API picker */}
              <div className="flex gap-3 flex-wrap">
                {NEWS_APIS.map(api => (
                  <button key={api.id} onClick={() => { setSelApiSrc(api.id); setSelEndpoint(0); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all
                      ${selApiSrc === api.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>
                    <span className={`w-2 h-2 rounded-full ${api.color}`}/>
                    {api.name}
                    <span className="text-muted-foreground font-normal text-[10px]">{api.freeLimit}</span>
                  </button>
                ))}
              </div>

              {/* Endpoint picker */}
              {curApi && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">اختر موضوع الأخبار:</p>
                  <div className="flex flex-wrap gap-2">
                    {curApi.endpoints.map((ep, i) => (
                      <button key={i} onClick={() => setSelEndpoint(i)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all
                          ${selEndpoint === i ? "bg-primary text-white" : "bg-muted hover:bg-primary/20"}`}>
                        {ep.label}
                      </button>
                    ))}
                  </div>
                  {!apiKeys[selApiSrc] && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl px-3 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0"/>
                      <span>أضف <strong>{curApi.name} API Key</strong> من إعدادات API Keys أعلاه</span>
                      <a href={curApi.url} target="_blank" rel="noopener noreferrer" className="underline font-bold">سجّل مجاناً</a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Fetch Button ── */}
          <button onClick={fetchNews} disabled={loading}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-primary text-white font-black py-3 rounded-xl hover:bg-primary/85 transition-colors disabled:opacity-60 text-sm shadow-sm">
            {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Zap className="w-5 h-5"/>}
            {loading ? "جارٍ جلب الأخبار..." : "🚀 اسحب الأخبار الآن"}
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {scraped.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="font-black text-sm">{scraped.length} خبر</span>
              <span className="text-xs text-muted-foreground">— {selected.size} محدد</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={selectAll}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-muted hover:bg-primary/20 transition-colors">
                <CheckSquare className="w-3.5 h-3.5"/> تحديد الكل
              </button>
              <button onClick={deselectAll}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/70 transition-colors">
                <Square className="w-3.5 h-3.5"/> إلغاء الكل
              </button>
              <button onClick={importArticles} disabled={importing || selected.size === 0}
                className="flex items-center gap-1.5 text-xs font-black px-4 py-1.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm">
                {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Download className="w-3.5 h-3.5"/>}
                {importing ? "جارٍ النشر..." : `نشر ${selected.size} خبر`}
              </button>
            </div>
          </div>

          {/* Article list */}
          <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
            {scraped.map((a, i) => (
              <div key={i} onClick={() => toggleSelect(i)}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/40
                  ${selected.has(i) ? "bg-primary/5" : ""}`}>
                <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors
                  ${selected.has(i) ? "bg-primary border-primary text-white" : "border-border"}`}>
                  {selected.has(i) && <Check className="w-3 h-3"/>}
                </div>
                {a.featured_image && (
                  <img src={a.featured_image} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0 border border-border"/>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-snug line-clamp-2">{a.title}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{a.catLabel}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Globe className="w-3 h-3"/> {a.source}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3"/>
                      {new Date(a.published_at).toLocaleDateString("ar-EG")}
                    </span>
                    {a.source_url && (
                      <a href={a.source_url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3"/> المصدر الأصلي
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
