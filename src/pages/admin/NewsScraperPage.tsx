import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Rss, RefreshCw, Plus, Check, X, Globe, Filter, ChevronDown, Newspaper, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface RssFeed {
  id: string; name: string; name_en: string; url: string;
  category: string; icon: string; active: boolean;
}

interface RssItem {
  title: string; link: string; description: string;
  pubDate: string; source: string; sourceId: string;
  image?: string; selected?: boolean;
}

const PROXY = "https://api.allorigins.win/get?url=";

const NewsScraperPage = () => {
  const { t, language } = useLanguage();
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<RssFeed | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [items, setItems] = useState<RssItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [targetCatId, setTargetCatId] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadFeeds();
    loadCategories();
  }, []);

  const loadFeeds = async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "rss_feeds").single();
    if (data?.value) {
      const f = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      setFeeds(Array.isArray(f) ? f : []);
    }
  };

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("id,name_ar,name_en,slug");
    if (data) { setCategories(data); setTargetCatId(data[0]?.id || ""); }
  };

  const fetchRss = async (feed: RssFeed) => {
    setSelectedFeed(feed);
    setLoading(true);
    setItems([]);
    setSelectedItems(new Set());
    try {
      const res = await fetch(`${PROXY}${encodeURIComponent(feed.url)}`);
      const data = await res.json();
      const xml = new DOMParser().parseFromString(data.contents, "text/xml");
      const entries = Array.from(xml.querySelectorAll("item, entry"));
      const parsed: RssItem[] = entries.slice(0, 20).map(el => {
        const get = (tag: string) => el.querySelector(tag)?.textContent?.trim() || "";
        const mediaUrl = el.querySelector("media\\:content, enclosure")?.getAttribute("url") || "";
        return {
          title: get("title"),
          link: get("link") || el.querySelector("link")?.getAttribute("href") || "",
          description: get("description, summary").replace(/<[^>]*>/g, "").slice(0, 200),
          pubDate: get("pubDate, published, updated"),
          source: feed.name,
          sourceId: feed.id,
          image: mediaUrl,
          selected: false,
        };
      }).filter(i => i.title);
      setItems(parsed);
      toast.success(`${t("تم جلب", "Fetched")} ${parsed.length} ${t("خبر", "articles")}`);
    } catch (e) {
      toast.error(t("فشل في جلب الأخبار", "Failed to fetch news"));
    }
    setLoading(false);
  };

  const toggleItem = (idx: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelectedItems(new Set(items.map((_, i) => i)));
  const clearAll = () => setSelectedItems(new Set());

  const importSelected = async () => {
    if (!selectedItems.size) return toast.error(t("اختر أخباراً أولاً", "Select articles first"));
    if (!targetCatId) return toast.error(t("اختر قسماً", "Select category"));
    setImporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    let ok = 0;
    for (const idx of selectedItems) {
      const item = items[idx];
      const { error } = await supabase.from("articles").insert({
        title: item.title,
        slug: `rss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        excerpt: item.description || item.title,
        content: `<p>${item.description}</p><p><a href="${item.link}" target="_blank" rel="noopener">المصدر: ${item.source}</a></p>`,
        featured_image: item.image || null,
        category_id: targetCatId,
        author_id: user?.id,
        status: "draft",
        is_featured: false,
        is_breaking: false,
        views: 0,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        custom_author_name: item.source,
        reading_time: 3,
      });
      if (!error) ok++;
    }
    toast.success(`${t("تم استيراد", "Imported")} ${ok} ${t("خبر كمسودة", "articles as draft")}`);
    setImporting(false);
    setSelectedItems(new Set());
  };

  const catFeedMap: Record<string, string> = {
    all: t("الكل", "All"), egypt: t("مصر", "Egypt"), world: t("العالم", "World"),
    sports: t("رياضة", "Sports"), tech: t("تكنولوجيا", "Tech"), politics: t("سياسة", "Politics"),
  };

  const filteredFeeds = categoryFilter === "all" ? feeds : feeds.filter(f => f.category === categoryFilter);

  return (
    <div className="space-y-6 p-1" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><Rss className="text-primary" /> {t("سحب الأخبار RSS", "RSS News Scraper")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("اختر مصدر، اجلب الأخبار، واستورد ما تريد مسودةً", "Pick a source, fetch news, import as drafts")}</p>
        </div>
        {selectedItems.size > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3">
            <select value={targetCatId} onChange={e => setTargetCatId(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-background">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
            <button onClick={importSelected} disabled={importing}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t("استورد المحدد", "Import Selected")} ({selectedItems.size})
            </button>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT: Feed list */}
        <div className="lg:col-span-1 space-y-3">
          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(catFeedMap).map(([k, v]) => (
              <button key={k} onClick={() => setCategoryFilter(k)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${categoryFilter === k ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {v}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredFeeds.map(feed => (
              <motion.button key={feed.id} onClick={() => fetchRss(feed)} whileHover={{ x: -3 }}
                className={`w-full text-start flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedFeed?.id === feed.id ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40"}`}>
                <span className="text-2xl">{feed.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{feed.name}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">{catFeedMap[feed.category] || feed.category}</div>
                </div>
                {selectedFeed?.id === feed.id && <Check className="w-4 h-4 text-primary shrink-0" />}
              </motion.button>
            ))}
          </div>
        </div>

        {/* RIGHT: Articles */}
        <div className="lg:col-span-3">
          {!selectedFeed && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <Globe className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">{t("اختر مصدراً من اليسار لجلب الأخبار", "Select a source to fetch news")}</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">{t("جاري جلب الأخبار...", "Fetching news...")}</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{items.length} {t("خبر متاح", "articles available")} — {selectedFeed?.name}</p>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs px-3 py-1 rounded-lg bg-muted hover:bg-muted/80">{t("تحديد الكل", "Select All")}</button>
                  <button onClick={clearAll} className="text-xs px-3 py-1 rounded-lg bg-muted hover:bg-muted/80">{t("إلغاء الكل", "Clear All")}</button>
                </div>
              </div>

              <div className="space-y-2 max-h-[580px] overflow-y-auto">
                <AnimatePresence>
                  {items.map((item, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                      onClick={() => toggleItem(idx)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedItems.has(idx) ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>
                      <div className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${selectedItems.has(idx) ? "border-primary bg-primary" : "border-border"}`}>
                        {selectedItems.has(idx) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {item.image && <img src={item.image} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" onError={e => (e.target as any).style.display = "none"} />}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm line-clamp-2 leading-snug">{item.title}</h3>
                        {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                          {item.pubDate && <span>{new Date(item.pubDate).toLocaleDateString("ar-EG")}</span>}
                          <a href={item.link} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="flex items-center gap-0.5 hover:text-primary">
                            <ExternalLink className="w-3 h-3" /> {t("المصدر", "Source")}
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsScraperPage;
