import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { toast } from "sonner";
import {
  Rss, Globe, Newspaper, ExternalLink, Loader2, Download,
  CheckSquare, Square, Settings2, Save, Key, Check, AlertCircle,
  Zap, Clock, X, Play, RefreshCw, ChevronDown
} from "lucide-react";

// ── Edge Function URL ──
const EF_URL = "https://neojditfucitnovcfspw.supabase.co/functions/v1/news-scraper";
const EF_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lb2pkaXRmdWNpdG5vdmNmc3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MzgxNDgsImV4cCI6MjA5MjExNDE0OH0.blzJAGGj0ggCNnL46ZayHx0UhjQNJkfX6PncGNXIcgU`,
};

// RSS Sources (must match edge function)
const RSS_SOURCES = [
  { id:"bbc_ar",   name:"BBC عربي",       flag:"🇬🇧", cat:"أخبار العالم" },
  { id:"rt_ar",    name:"RT عربي",         flag:"🇷🇺", cat:"أخبار العالم" },
  { id:"france24", name:"France24 عربي",   flag:"🇫🇷", cat:"أخبار العالم" },
  { id:"indep_ar", name:"اندبندنت عربي",   flag:"🌍", cat:"أخبار العالم" },
];

// NewsAPI topics
const TOPICS = [
  { label:"أخبار مصر",   q:"egypt OR مصر",         cat:"أخبار مصر"    },
  { label:"أخبار عالمية",q:"world news",             cat:"أخبار العالم" },
  { label:"سياسة",       q:"politics egypt",         cat:"سياسة"        },
  { label:"اقتصاد",      q:"economy egypt finance",  cat:"اقتصاد"       },
  { label:"رياضة",       q:"sports egypt football",  cat:"رياضة"        },
  { label:"تكنولوجيا",   q:"technology AI",          cat:"تكنولوجيا"    },
];

type Article = {
  title: string; excerpt: string; source: string; source_url: string;
  featured_image: string; catLabel: string; published_at: string;
};

export default function NewsScraperPage() {
  const { settings, refetch } = useSiteSettings();

  const [tab,         setTab]         = useState<"rss"|"api">("rss");
  const [showKeys,    setShowKeys]    = useState(false);
  const [newsapiKey,  setNewsapiKey]  = useState("");
  const [gnewsKey,    setGnewsKey]    = useState("");
  const [selRss,      setSelRss]      = useState<Set<string>>(new Set(["bbc_ar","rt_ar"]));
  const [selTopic,    setSelTopic]    = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [importing,   setImporting]   = useState(false);
  const [articles,    setArticles]    = useState<Article[]>([]);
  const [selected,    setSelected]    = useState<Set<number>>(new Set());
  const [categories,  setCategories]  = useState<{id:string;name_ar:string}[]>([]);
  const [catMap,      setCatMap]      = useState<Record<string,string>>({});
  const [savedKeys,   setSavedKeys]   = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id,name_ar,slug").order("sort_order")
      .then(({ data }) => {
        if (!data) return;
        setCategories(data);
        const m: Record<string,string> = {};
        data.forEach(c => { m[c.name_ar] = c.id; });
        setCatMap(m);
      });
    if (settings?.newsapi_key) setNewsapiKey(settings.newsapi_key);
    if (settings?.gnews_key)   setGnewsKey(settings.gnews_key);
  }, [settings]);

  const saveKeys = async () => {
    await supabase.from("site_settings").upsert({ key:"newsapi_key", value:newsapiKey }, { onConflict:"key" });
    await supabase.from("site_settings").upsert({ key:"gnews_key",   value:gnewsKey   }, { onConflict:"key" });
    await refetch();
    setSavedKeys(true); toast.success("✅ تم حفظ API Keys");
    setTimeout(() => setSavedKeys(false), 2000);
  };

  const fetchNews = async () => {
    setLoading(true); setArticles([]); setSelected(new Set());
    try {
      const body: Record<string, unknown> = { action: "fetch" };

      if (tab === "rss") {
        if (selRss.size === 0) { toast.error("اختر مصدراً واحداً على الأقل"); setLoading(false); return; }
        body.rss_sources = Array.from(selRss);
      } else {
        const topic = TOPICS[selTopic];
        if (!newsapiKey && !gnewsKey) {
          toast.error("أضف NewsAPI Key أو GNews Key أولاً"); setLoading(false); return;
        }
        body.rss_sources = [];
        body.newsapi_key = newsapiKey;
        body.gnews_key   = gnewsKey;
        body.topic       = topic.q;
      }

      const res = await fetch(EF_URL, { method:"POST", headers:EF_HEADERS, body:JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        toast.error(`خطأ: ${data.error || "فشل في الاتصال"}`);
        setLoading(false); return;
      }
      if (!data.articles?.length) {
        toast.error("لا توجد أخبار — جرب مصدراً آخر"); setLoading(false); return;
      }
      setArticles(data.articles);
      setSelected(new Set(data.articles.map((_: Article, i: number) => i)));
      toast.success(`✅ تم جلب ${data.articles.length} خبر`);
    } catch (e) {
      toast.error("فشل الاتصال بالـ Edge Function");
      console.error(e);
    }
    setLoading(false);
  };

  const importAll = async () => {
    if (!selected.size) { toast.error("اختر أخباراً أولاً"); return; }
    setImporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const toImport = articles.filter((_, i) => selected.has(i));

    const res = await fetch(EF_URL, {
      method: "POST", headers: EF_HEADERS,
      body: JSON.stringify({
        action: "import",
        articles: toImport,
        category_map: catMap,
        author_id: user?.id || null,
      }),
    });
    const data = await res.json();
    setImporting(false);

    if (data.saved > 0)   toast.success(`✅ نُشر ${data.saved} خبر على الموقع!`);
    if (data.skipped > 0) toast.info(`${data.skipped} خبر مكرر أو بدون قسم`);
    setArticles(prev => prev.filter((_, i) => !selected.has(i)));
    setSelected(new Set());
  };

  const toggle = (i: number) =>
    setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  return (
    <div className="space-y-5 max-w-5xl mx-auto" dir="rtl">

      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Rss className="w-6 h-6 text-primary"/> سحب الأخبار تلقائياً
          </h1>
          <p className="text-sm text-muted-foreground">اختر المصدر → اسحب → انشر على الموقع بضغطة</p>
        </div>
        <button onClick={() => setShowKeys(k => !k)}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors">
          <Key className="w-3.5 h-3.5"/> API Keys
        </button>
      </div>

      {/* API Keys */}
      {showKeys && (
        <div className="bg-card border border-primary/20 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-primary"/> مفاتيح API (اختياري — للأخبار الإضافية)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold flex items-center gap-2">
                🔵 NewsAPI.org
                <span className="text-muted-foreground font-normal">مجاني — 100/يوم</span>
                <a href="https://newsapi.org/register" target="_blank" className="text-primary text-[10px] underline">سجّل مجاناً</a>
              </label>
              <input type="text" value={newsapiKey} onChange={e => setNewsapiKey(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none font-mono"/>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold flex items-center gap-2">
                🟢 GNews.io
                <span className="text-muted-foreground font-normal">مجاني — 100/يوم</span>
                <a href="https://gnews.io/register" target="_blank" className="text-primary text-[10px] underline">سجّل مجاناً</a>
              </label>
              <input type="text" value={gnewsKey} onChange={e => setGnewsKey(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none font-mono"/>
            </div>
          </div>
          <button onClick={saveKeys}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary/85 transition-colors">
            {savedKeys ? <Check className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
            {savedKeys ? "تم الحفظ!" : "حفظ المفاتيح"}
          </button>
        </div>
      )}

      {/* Source picker */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id:"rss" as const, label:"📡 مصادر RSS",  sub:"مجاني — بدون Key" },
            { id:"api" as const, label:"🌐 News API",   sub:"يحتاج API Key" },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setArticles([]); setSelected(new Set()); }}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${tab===t.id ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"}`}>
              {t.label}
              <div className={`text-[10px] font-normal mt-0.5 ${tab===t.id ? "text-white/70" : "text-muted-foreground"}`}>{t.sub}</div>
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {tab === "rss" && (
            <>
              <p className="text-xs text-muted-foreground">اختر مصدراً أو أكثر:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {RSS_SOURCES.map(src => {
                  const on = selRss.has(src.id);
                  return (
                    <button key={src.id}
                      onClick={() => setSelRss(s => { const n = new Set(s); on ? n.delete(src.id) : n.add(src.id); return n; })}
                      className={`relative p-4 rounded-xl border-2 text-center transition-all ${on
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40 text-muted-foreground"}`}>
                      {on && <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white"/></div>}
                      <div className="text-2xl mb-1">{src.flag}</div>
                      <div className="text-xs font-black leading-tight">{src.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{src.cat}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {tab === "api" && (
            <div className="space-y-3">
              {(!newsapiKey && !gnewsKey) && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0"/>
                  أضف API Key أعلاه أولاً — مجاني تماماً!
                </div>
              )}
              <p className="text-xs font-bold text-muted-foreground">اختر الموضوع:</p>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t, i) => (
                  <button key={i} onClick={() => setSelTopic(i)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selTopic===i ? "bg-primary text-white shadow-sm" : "bg-muted hover:bg-primary/20"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={fetchNews} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-black py-3.5 rounded-xl hover:bg-primary/85 disabled:opacity-60 transition-colors text-sm shadow-sm">
            {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Zap className="w-5 h-5"/>}
            {loading ? "جارٍ جلب الأخبار..." : "🚀 اسحب الأخبار الآن"}
          </button>
        </div>
      </div>

      {/* Results */}
      {articles.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 flex-wrap gap-2">
            <div className="font-black text-sm">{articles.length} خبر — {selected.size} محدد</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelected(new Set(articles.map((_,i)=>i)))}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-muted hover:bg-primary/20 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5"/> الكل
              </button>
              <button onClick={() => setSelected(new Set())}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/70 flex items-center gap-1.5">
                <Square className="w-3.5 h-3.5"/> إلغاء
              </button>
              <button onClick={importAll} disabled={importing || !selected.size}
                className="flex items-center gap-1.5 text-xs font-black px-4 py-1.5 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Download className="w-3.5 h-3.5"/>}
                {importing ? "جارٍ النشر..." : `نشر ${selected.size} خبر ✅`}
              </button>
            </div>
          </div>
          <div className="divide-y divide-border max-h-[55vh] overflow-y-auto">
            {articles.map((a, i) => (
              <div key={i} onClick={() => toggle(i)}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/40 ${selected.has(i) ? "bg-primary/5" : ""}`}>
                <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${selected.has(i) ? "bg-primary border-primary" : "border-border"}`}>
                  {selected.has(i) && <Check className="w-3 h-3 text-white"/>}
                </div>
                {a.featured_image && (
                  <img src={a.featured_image} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0 border border-border"/>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-snug line-clamp-2">{a.title}</p>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{a.catLabel}</span>
                    <span className="text-[10px] text-muted-foreground">🌐 {a.source}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3"/>{new Date(a.published_at).toLocaleDateString("ar-EG")}
                    </span>
                    {a.source_url && (
                      <a href={a.source_url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3"/> المصدر
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
