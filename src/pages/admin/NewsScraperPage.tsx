import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rss, RefreshCw, Plus, Check, X, Globe, Newspaper,
  ExternalLink, Loader2, Trash2, Download, CheckSquare,
  Square, Search, Filter, Clock, Star, ChevronDown, ChevronUp,
  Image as ImgIcon, AlertCircle, Settings2, Save
} from "lucide-react";

const PROXY = "https://api.allorigins.win/get?url=";
const PROXY2 = "https://corsproxy.io/?";

interface Feed {
  id: string; name: string; url: string;
  category_id: string; icon: string; active: boolean; lastFetched?: string;
}
interface RssItem {
  title: string; link: string; description: string;
  pubDate: string; image?: string; source: string; guid: string;
  selected: boolean; duplicate: boolean;
}

const DEFAULT_FEEDS: Feed[] = [
  { id:"youm7",    name:"اليوم السابع",     url:"https://www.youm7.com/rss",              category_id:"", icon:"🗞️", active:true },
  { id:"masry",    name:"المصري اليوم",      url:"https://www.almasryalyoum.com/rss",      category_id:"", icon:"📰", active:true },
  { id:"ahram",    name:"الأهرام",           url:"https://www.ahram.org.eg/rss",           category_id:"", icon:"📜", active:true },
  { id:"shorouk",  name:"الشروق",            url:"https://www.shorouknews.com/rss",        category_id:"", icon:"🌅", active:true },
  { id:"vetogate", name:"فيتو جيت",          url:"https://www.vetogate.com/rss",           category_id:"", icon:"📡", active:true },
  { id:"elwatan",  name:"الوطن",             url:"https://www.elwatannews.com/rss",        category_id:"", icon:"🌍", active:true },
  { id:"bbc_ar",   name:"بي بي سي عربي",    url:"https://feeds.bbci.co.uk/arabic/rss.xml",category_id:"", icon:"🌐", active:true },
  { id:"skynews",  name:"سكاي نيوز عربية",  url:"https://www.skynewsarabia.com/rss.xml",  category_id:"", icon:"📺", active:true },
];

/* Generate clean Arabic slug */
const toSlug = (title: string) => {
  const cleaned = title.trim().slice(0, 60)
    .replace(/[^؀-ۿa-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "-").toLowerCase();
  return `${cleaned}-${Date.now().toString(36)}`;
};

export default function NewsScraperPage() {
  const [feeds, setFeeds]       = useState<Feed[]>([]);
  const [cats, setCats]         = useState<any[]>([]);
  const [items, setItems]       = useState<RssItem[]>([]);
  const [loading, setLoading]   = useState(false);
  const [importing, setImporting] = useState(false);
  const [activeFeed, setActiveFeed] = useState<Feed|null>(null);
  const [targetCatId, setTargetCatId] = useState("");
  const [status, setStatus]     = useState<"draft"|"published">("draft");
  const [searchQ, setSearchQ]   = useState("");
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeed, setNewFeed]   = useState({ name:"", url:"", icon:"📰" });
  const [existingSlugs, setExistingSlugs] = useState<Set<string>>(new Set());
  const [stats, setStats]       = useState({ total:0, imported:0, today:0 });

  useEffect(()=>{
    loadFeeds();
    loadCats();
    loadStats();
  },[]);

  const loadFeeds = async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key","rss_feeds").single();
    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value);
        setFeeds(Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_FEEDS);
      } catch { setFeeds(DEFAULT_FEEDS); }
    } else {
      setFeeds(DEFAULT_FEEDS);
      await supabase.from("site_settings").upsert({ key:"rss_feeds", value: JSON.stringify(DEFAULT_FEEDS) });
    }
  };

  const saveFeeds = async (updated: Feed[]) => {
    setFeeds(updated);
    await supabase.from("site_settings").upsert({ key:"rss_feeds", value: JSON.stringify(updated) });
  };

  const loadCats = async () => {
    const { data } = await supabase.from("categories").select("id,name_ar,slug").eq("is_active",true).order("sort_order");
    if (data) { setCats(data); setTargetCatId(data[0]?.id||""); }
  };

  const loadStats = async () => {
    const [total, today] = await Promise.all([
      supabase.from("articles").select("id",{count:"exact",head:true}),
      supabase.from("articles").select("id",{count:"exact",head:true})
        .gte("created_at", new Date(Date.now()-86400000).toISOString()),
    ]);
    setStats(s=>({ ...s, total: total.count||0, today: today.count||0 }));
  };

  const fetchFeed = async (feed: Feed) => {
    setActiveFeed(feed);
    setLoading(true);
    setItems([]);

    // Load existing slugs to detect duplicates
    const { data: slugData } = await supabase.from("articles").select("slug,source_url").limit(500);
    const slugSet = new Set((slugData||[]).map((a:any)=>a.slug));
    const urlSet  = new Set((slugData||[]).map((a:any)=>a.source_url).filter(Boolean));
    setExistingSlugs(slugSet);

    try {
      let xml: Document | null = null;

      // Try proxy 1
      try {
        const r1 = await fetch(`${PROXY}${encodeURIComponent(feed.url)}`, { signal: AbortSignal.timeout(8000) });
        const d1 = await r1.json();
        xml = new DOMParser().parseFromString(d1.contents, "text/xml");
        if (!xml.querySelector("item, entry")) throw new Error("empty");
      } catch {
        // Try proxy 2
        try {
          const r2 = await fetch(`${PROXY2}${encodeURIComponent(feed.url)}`, { signal: AbortSignal.timeout(8000) });
          const text = await r2.text();
          xml = new DOMParser().parseFromString(text, "text/xml");
        } catch {
          // Try rss2json as last resort
          const r3 = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=20`);
          const d3 = await r3.json();
          if (d3.items?.length) {
            const parsed: RssItem[] = d3.items.map((item:any) => {
              const link = item.link || item.guid || "";
              const isDup = urlSet.has(link);
              return {
                title: item.title || "",
                link,
                description: (item.description||item.content||"").replace(/<[^>]*>/g,"").slice(0,250),
                pubDate: item.pubDate || new Date().toISOString(),
                image: item.enclosure?.link || item.thumbnail || "",
                source: feed.name,
                guid: link,
                selected: !isDup,
                duplicate: isDup,
              };
            }).filter((i:RssItem)=>i.title);
            setItems(parsed);
            toast.success(`✅ جلب ${parsed.length} خبر من ${feed.name}`);
            setLoading(false);
            return;
          }
          throw new Error("All proxies failed");
        }
      }

      if (!xml) throw new Error("No XML");
      const entries = Array.from(xml.querySelectorAll("item, entry")).slice(0, 25);
      const parsed: RssItem[] = entries.map(el => {
        const get = (selectors: string) => {
          for (const s of selectors.split(",")) {
            const v = el.querySelector(s.trim())?.textContent?.trim();
            if (v) return v;
          }
          return "";
        };
        const link = get("link") || el.querySelector("link")?.getAttribute("href") || "";
        const mediaImg = el.querySelector("media\\:content, enclosure, media\\:thumbnail")?.getAttribute("url") ||
          el.querySelector("[url]")?.getAttribute("url") || "";
        // Also try to find image in description
        const descHtml = get("description, summary, content");
        const imgMatch = descHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
        const image = mediaImg || imgMatch?.[1] || "";
        const isDup = urlSet.has(link);
        return {
          title: get("title"),
          link,
          description: descHtml.replace(/<[^>]*>/g,"").slice(0, 250),
          pubDate: get("pubDate, published, updated"),
          image,
          source: feed.name,
          guid: link || get("guid"),
          selected: !isDup,
          duplicate: isDup,
        };
      }).filter(i => i.title);

      setItems(parsed);
      toast.success(`✅ جلب ${parsed.length} خبر من ${feed.name}`);
    } catch (e) {
      toast.error(`❌ فشل جلب ${feed.name} — تأكد من الرابط`);
      console.error(e);
    }
    setLoading(false);
  };

  const importSelected = async () => {
    const selected = items.filter(i=>i.selected && !i.duplicate);
    if (!selected.length) { toast.error("اختر أخباراً للاستيراد"); return; }
    if (!targetCatId) { toast.error("اختر قسماً أولاً"); return; }
    setImporting(true);
    let ok = 0; let fail = 0;
    for (const item of selected) {
      const slug = toSlug(item.title);
      const { error } = await supabase.from("articles").insert({
        title: item.title,
        slug,
        excerpt: item.description,
        content: `<p>${item.description}</p>`,
        featured_image: item.image || null,
        status,
        category_id: targetCatId || null,
        source_url: item.link,
        source_name: item.source,
        custom_author_name: item.source,
        published_at: status==="published" ? (item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()) : null,
      });
      if (!error) ok++; else fail++;
    }
    // Log
    await supabase.from("automation_logs").insert({
      type:"rss_import", status: fail>0?"partial":"success",
      message:`استيراد من ${activeFeed?.name}: ${ok} ناجح, ${fail} فشل`,
      articles_processed: ok,
    });
    toast.success(`✅ تم استيراد ${ok} خبر بنجاح${fail>0?` (${fail} فشل)`:""}`);
    setStats(s=>({...s, today: s.today+ok, total: s.total+ok, imported: s.imported+ok}));
    // Mark imported items
    setItems(prev=>prev.map(i=>i.selected ? {...i, selected:false, duplicate:true} : i));
    setImporting(false);
  };

  const toggleAll = (val:boolean) => setItems(prev=>prev.map(i=>i.duplicate?i:{...i,selected:val}));
  const allSelected = items.length > 0 && items.filter(i=>!i.duplicate).every(i=>i.selected);
  const selectedCount = items.filter(i=>i.selected).length;
  const filtered = items.filter(i=>!searchQ || i.title.includes(searchQ) || i.description.includes(searchQ));

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><Rss className="w-6 h-6 text-primary"/>سحب الأخبار RSS</h1>
          <p className="text-sm text-muted-foreground mt-0.5">استيراد الأخبار من المصادر الخارجية تلقائياً</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-card border border-border rounded-xl px-3 py-2 text-center min-w-[70px]">
            <div className="text-lg font-black text-primary">{stats.total.toLocaleString("ar-EG")}</div>
            <div className="text-[10px] text-muted-foreground">إجمالي المقالات</div>
          </div>
          <div className="bg-card border border-border rounded-xl px-3 py-2 text-center min-w-[70px]">
            <div className="text-lg font-black text-green-500">{stats.today}</div>
            <div className="text-[10px] text-muted-foreground">اليوم</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── Left: Feed List ─── */}
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm">المصادر ({feeds.length})</h3>
              <button onClick={()=>setShowAddFeed(s=>!s)}
                className="w-7 h-7 bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4 text-primary"/>
              </button>
            </div>

            {/* Add feed form */}
            <AnimatePresence>
            {showAddFeed && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                className="overflow-hidden">
                <div className="bg-muted rounded-xl p-3 space-y-2 mb-2">
                  <input value={newFeed.name} onChange={e=>setNewFeed(s=>({...s,name:e.target.value}))}
                    placeholder="اسم المصدر" className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"/>
                  <input value={newFeed.url} onChange={e=>setNewFeed(s=>({...s,url:e.target.value}))}
                    placeholder="https://...rss" dir="ltr"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"/>
                  <div className="flex gap-2">
                    <input value={newFeed.icon} onChange={e=>setNewFeed(s=>({...s,icon:e.target.value}))}
                      className="w-12 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-center"/>
                    <button onClick={()=>{
                      if(!newFeed.name||!newFeed.url) return;
                      const updated=[...feeds,{id:`custom_${Date.now()}`,name:newFeed.name,url:newFeed.url,category_id:"",icon:newFeed.icon,active:true}];
                      saveFeeds(updated); setNewFeed({name:"",url:"",icon:"📰"}); setShowAddFeed(false);
                      toast.success("تم إضافة المصدر");
                    }} className="flex-1 bg-primary text-white rounded-lg text-xs font-bold py-1.5 hover:bg-primary/85 transition-colors">
                      <Save className="w-3 h-3 inline ml-1"/>حفظ
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>

            {/* Feed list */}
            <div className="space-y-1">
              {feeds.map(feed=>(
                <div key={feed.id} className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all group
                  ${activeFeed?.id===feed.id?"bg-primary/10 border border-primary/30":"hover:bg-muted border border-transparent"}`}
                  onClick={()=>fetchFeed(feed)}>
                  <span className="text-base shrink-0">{feed.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{feed.name}</p>
                    <p className="text-[9px] text-muted-foreground truncate" dir="ltr">{feed.url.replace("https://","").slice(0,30)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {activeFeed?.id===feed.id && loading && <Loader2 className="w-3 h-3 animate-spin text-primary"/>}
                    <button onClick={e=>{e.stopPropagation(); const u=feeds.map(f=>f.id===feed.id?{...f,active:!f.active}:f); saveFeeds(u);}}
                      className={`w-5 h-5 rounded-full transition-colors ${feed.active?"bg-green-500":"bg-muted-foreground/30"}`}/>
                    <button onClick={e=>{e.stopPropagation(); saveFeeds(feeds.filter(f=>f.id!==feed.id)); toast.success("حُذف المصدر");}}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 hover:text-red-500">
                      <X className="w-3 h-3"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Import settings */}
          {activeFeed && items.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="font-black text-sm flex items-center gap-2"><Settings2 className="w-4 h-4 text-primary"/>إعدادات الاستيراد</h3>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">القسم المستهدف</label>
                <select value={targetCatId} onChange={e=>setTargetCatId(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {cats.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">حالة المقال</label>
                <div className="flex gap-2">
                  {(["draft","published"] as const).map(s=>(
                    <button key={s} onClick={()=>setStatus(s)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all
                        ${status===s?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground hover:bg-muted"}`}>
                      {s==="draft"?"📝 مسودة":"🚀 نشر مباشر"}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={importSelected} disabled={importing||selectedCount===0}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-black text-sm hover:bg-primary/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {importing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                {importing ? "جارٍ الاستيراد..." : `استيراد ${selectedCount} خبر`}
              </button>
            </div>
          )}
        </div>

        {/* ─── Right: Items grid ─── */}
        <div className="lg:col-span-2 space-y-3">
          {/* Toolbar */}
          {items.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-3 flex flex-wrap items-center gap-2">
              <button onClick={()=>toggleAll(!allSelected)}
                className="flex items-center gap-1.5 text-xs font-bold hover:text-primary transition-colors">
                {allSelected ? <CheckSquare className="w-4 h-4 text-primary"/> : <Square className="w-4 h-4"/>}
                {allSelected ? "إلغاء الكل" : "تحديد الكل"}
              </button>
              <div className="flex-1 relative">
                <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground"/>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                  placeholder="بحث في النتائج..."
                  className="w-full bg-muted rounded-xl ps-7 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 border border-transparent"/>
              </div>
              <span className="text-xs text-muted-foreground">{selectedCount} محدد / {items.length} إجمالي</span>
            </div>
          )}

          {loading ? (
            <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary"/>
              <p className="text-sm font-bold">جارٍ جلب الأخبار...</p>
              <p className="text-xs text-muted-foreground">يستغرق هذا 5-10 ثواني</p>
            </div>
          ) : items.length === 0 && !activeFeed ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <Rss className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20"/>
              <p className="font-bold text-sm">اختر مصدراً من القائمة لجلب أخباره</p>
              <p className="text-xs text-muted-foreground mt-1">أو أضف مصدر RSS جديد</p>
            </div>
          ) : items.length === 0 && activeFeed ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500"/>
              <p className="font-bold text-sm">لم يتم جلب أخبار من هذا المصدر</p>
              <p className="text-xs text-muted-foreground mt-1">قد يكون الرابط غير صحيح أو المصدر لا يدعم RSS</p>
              <button onClick={()=>activeFeed && fetchFeed(activeFeed)}
                className="mt-3 flex items-center gap-1.5 mx-auto text-xs font-bold text-primary hover:underline">
                <RefreshCw className="w-3 h-3"/>إعادة المحاولة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((item, idx) => (
                <motion.div key={idx} initial={{opacity:0,y:10}} animate={{opacity:1,y:0,transition:{delay:idx*0.03}}}
                  onClick={()=>!item.duplicate && setItems(prev=>prev.map((p,i)=>i===prev.indexOf(item)?{...p,selected:!p.selected}:p))}
                  className={`relative bg-card border rounded-2xl overflow-hidden transition-all cursor-pointer
                    ${item.duplicate?"opacity-50 cursor-not-allowed border-muted":
                      item.selected?"border-primary bg-primary/5 ring-1 ring-primary/30 shadow-md":"border-border hover:border-primary/40 hover:shadow-sm"}`}>
                  {/* Image */}
                  {item.image ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={item.image} alt={item.title}
                        className="w-full h-full object-cover"
                        onError={e=>(e.currentTarget.style.display="none")}/>
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <ImgIcon className="w-6 h-6 text-muted-foreground/20"/>
                    </div>
                  )}
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all
                        ${item.selected&&!item.duplicate?"bg-primary border-primary":"border-muted-foreground/30"}`}>
                        {item.selected && !item.duplicate && <Check className="w-2.5 h-2.5 text-white"/>}
                      </div>
                      <h4 className="text-xs font-bold leading-snug line-clamp-2 flex-1">{item.title}</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 pe-6">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{item.source}</span>
                        {item.pubDate && (
                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5"/>
                            {new Date(item.pubDate).toLocaleDateString("ar-EG",{month:"short",day:"numeric"})}
                          </span>
                        )}
                      </div>
                      {item.duplicate && <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">مكرر</span>}
                      <a href={item.link} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                        className="text-[9px] text-muted-foreground hover:text-primary transition-colors">
                        <ExternalLink className="w-3 h-3"/>
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
