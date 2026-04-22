import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import ArticleCard from "@/components/ArticleCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreakingNewsTicker from "@/components/BreakingNewsTicker";
import { Eye, ChevronLeft, ChevronRight, Clock, TrendingUp, Flame, Newspaper, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  featured_image: string | null; published_at: string | null;
  custom_author_name: string | null; views: number;
  category_id: string | null; is_featured: boolean | null; is_breaking: boolean | null;
}

interface Category { id: string; name_ar: string; name_en: string; slug: string; icon?: string; }

const timeAgo = (date: string | null) => {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return new Date(date).toLocaleDateString("ar-EG");
};

// ───── Hero Slider ─────
const HeroSlider = ({ articles, getCatName }: { articles: Article[]; getCatName: (a: Article) => string }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % Math.max(articles.length, 1)), 5000);
    return () => clearInterval(t);
  }, [articles.length]);

  if (!articles.length) return (
    <div className="aspect-[16/7] bg-muted rounded-2xl animate-pulse" />
  );

  const a = articles[idx];
  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[16/7] group select-none shadow-xl">
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0">
          <img src={a.featured_image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200"} alt={a.title}
            className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {a.is_breaking && (
              <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full mb-2 shadow-sm">
                <Flame className="w-3 h-3" /> عاجل
              </span>
            )}
            <span className="inline-block bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full mb-2 ms-2">
              {getCatName(a)}
            </span>
            <h2 className="text-white font-black text-lg sm:text-2xl md:text-3xl leading-snug line-clamp-2 drop-shadow-lg">
              {a.title}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-white/70 text-xs">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(a.published_at)}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.views?.toLocaleString("ar-EG")}</span>
            </div>
            <Link to={`/article/${a.slug}`}
              className="mt-3 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-white/30 transition-colors border border-white/20">
              اقرأ المزيد <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      <button onClick={() => setIdx(i => (i - 1 + articles.length) % articles.length)}
        className="absolute top-1/2 -translate-y-1/2 start-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
        <ChevronRight className="w-4 h-4" />
      </button>
      <button onClick={() => setIdx(i => (i + 1) % articles.length)}
        className="absolute top-1/2 -translate-y-1/2 end-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 start-1/2 -translate-x-1/2 flex gap-1.5">
        {articles.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`rounded-full transition-all ${i === idx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
};

// ───── Section Header ─────
const SectionHead = ({ title, to }: { title: string; to?: string }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 bg-primary rounded-full" />
      <h2 className="font-black text-base sm:text-lg">{title}</h2>
    </div>
    {to && <Link to={to} className="text-xs text-primary hover:underline flex items-center gap-0.5">المزيد <ArrowLeft className="w-3 h-3" /></Link>}
  </div>
);

// ───── Main Page ─────
const Index = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("all");
  const [subscribers, setSubscribers] = useState({ email: "", loading: false, done: false });

  const loadData = useCallback(async () => {
    const [artR, catR] = await Promise.all([
      supabase.from("articles")
        .select("id,title,slug,excerpt,featured_image,published_at,custom_author_name,views,category_id,is_featured,is_breaking")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(40),
      supabase.from("categories").select("id,name_ar,name_en,slug,icon").order("sort_order"),
    ]);
    setArticles(artR.data || []);
    setCategories(catR.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getCatName = (a: Article) => {
    const c = categories.find(c => c.id === a.category_id);
    return c?.name_ar || "";
  };

  const getCatSlug = (a: Article) => {
    return categories.find(c => c.id === a.category_id)?.slug || "";
  };

  const featured = articles.filter(a => a.is_featured);
  const breaking = articles.filter(a => a.is_breaking);
  const topRead = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const latest = articles.slice(0, 12);
  const filtered = activeCat === "all" ? articles : articles.filter(a => {
    const cat = categories.find(c => c.id === a.category_id);
    return cat?.slug === activeCat;
  });

  const subscribe = async () => {
    if (!subscribers.email) return;
    setSubscribers(s => ({ ...s, loading: true }));
    await supabase.from("subscribers").insert({ email: subscribers.email });
    setSubscribers(s => ({ ...s, loading: false, done: true }));
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-6xl px-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <BreakingNewsTicker />
      <Header />

      <main className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-8">

        {/* ══ HERO + SIDEBAR ══ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Hero Slider — 8 cols desktop, full mobile */}
          <div className="lg:col-span-8">
            <HeroSlider articles={featured.slice(0, 6)} getCatName={getCatName} />
          </div>

          {/* Latest sidebar — 4 cols desktop, hidden on mobile */}
          <aside className="hidden lg:flex lg:col-span-4 flex-col gap-3">
            <SectionHead title="آخر الأخبار" to="/news" />
            <div className="space-y-2 overflow-y-auto flex-1">
              {latest.slice(0, 6).map(a => (
                <Link key={a.id} to={`/article/${a.slug}`}
                  className="flex items-start gap-2.5 group hover:bg-muted/50 p-2 rounded-xl transition-colors">
                  {a.featured_image && (
                    <img src={a.featured_image} alt={a.title}
                      className="w-20 h-14 object-cover rounded-lg shrink-0 group-hover:scale-105 transition-transform" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-primary mb-0.5">{getCatName(a)}</div>
                    <h3 className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">{a.title}</h3>
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{timeAgo(a.published_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        </section>

        {/* ══ MOBILE: Latest (only mobile) ══ */}
        <section className="lg:hidden">
          <SectionHead title="آخر الأخبار" />
          <div className="space-y-3">
            {latest.slice(0, 4).map(a => (
              <Link key={a.id} to={`/article/${a.slug}`}
                className="flex items-start gap-3 group">
                {a.featured_image && (
                  <img src={a.featured_image} alt={a.title}
                    className="w-24 h-16 object-cover rounded-xl shrink-0" />
                )}
                <div className="flex-1 min-w-0 py-0.5">
                  {a.is_breaking && <span className="text-[10px] font-black text-red-500 flex items-center gap-0.5 mb-0.5"><Flame className="w-2.5 h-2.5" />عاجل</span>}
                  <div className="text-xs font-bold text-primary mb-0.5">{getCatName(a)}</div>
                  <h3 className="text-sm font-bold line-clamp-2 leading-snug">{a.title}</h3>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{timeAgo(a.published_at)}</span>
                    <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{a.views}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ══ FEATURED GRID ══ */}
        {featured.length > 0 && (
          <section>
            <SectionHead title="الأخبار المميزة" to="/featured" />
            {/* Desktop: 4 cards */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.slice(0, 4).map(a => (
                <ArticleCard key={a.id} variant="featured-side" title={a.title} slug={a.slug}
                  featuredImage={a.featured_image || undefined} categoryName={getCatName(a)}
                  publishedAt={a.published_at || undefined} views={a.views} />
              ))}
            </div>
            {/* Mobile: horizontal scroll */}
            <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
              {featured.slice(0, 6).map(a => (
                <Link key={a.id} to={`/article/${a.slug}`}
                  className="shrink-0 w-[70vw] snap-start rounded-2xl overflow-hidden shadow border border-border">
                  <div className="relative aspect-[16/9]">
                    <img src={a.featured_image || ""} alt={a.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-3">
                      <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">{getCatName(a)}</span>
                      <h3 className="text-white text-sm font-black mt-1 line-clamp-2 leading-snug">{a.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ══ MAIN CONTENT + RIGHT SIDEBAR ══ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Main feed */}
          <div className="lg:col-span-8 space-y-6">
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button onClick={() => setActiveCat("all")}
                className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all ${activeCat === "all" ? "bg-primary text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                الكل
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCat(cat.slug)}
                  className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all ${activeCat === cat.slug ? "bg-primary text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                  {cat.name_ar}
                </button>
              ))}
            </div>

            {/* Articles list */}
            <div className="space-y-4">
              <SectionHead title={activeCat === "all" ? "أحدث الأخبار" : categories.find(c => c.slug === activeCat)?.name_ar || ""} />
              {/* Desktop: grid */}
              <div className="hidden sm:grid grid-cols-2 gap-4">
                {filtered.slice(0, 12).map(a => (
                  <ArticleCard key={a.id} variant="default" title={a.title} slug={a.slug}
                    featuredImage={a.featured_image || undefined} categoryName={getCatName(a)}
                    publishedAt={a.published_at || undefined} views={a.views}
                    excerpt={a.excerpt || undefined} isBreaking={a.is_breaking || false} />
                ))}
              </div>
              {/* Mobile: list */}
              <div className="sm:hidden space-y-3">
                {filtered.slice(0, 12).map(a => (
                  <Link key={a.id} to={`/article/${a.slug}`}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border/50 shadow-sm">
                    {a.featured_image && (
                      <img src={a.featured_image} alt={a.title} className="w-24 h-16 object-cover rounded-xl shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      {a.is_breaking && (
                        <span className="text-[10px] font-black text-red-500 flex items-center gap-0.5 mb-0.5">
                          <Flame className="w-2.5 h-2.5" />عاجل
                        </span>
                      )}
                      <div className="text-[10px] font-bold text-primary mb-0.5">{getCatName(a)}</div>
                      <h3 className="text-sm font-bold line-clamp-2 leading-snug">{a.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{timeAgo(a.published_at)}</span>
                        <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{a.views}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Top Read */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <SectionHead title="الأكثر قراءة" />
              <div className="space-y-3">
                {topRead.map((a, i) => (
                  <Link key={a.id} to={`/article/${a.slug}`} className="flex items-start gap-3 group">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5 ${["bg-yellow-500","bg-gray-400","bg-amber-700","bg-primary/60","bg-primary/40"][i]}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">{a.title}</h4>
                      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Eye className="w-3 h-3" />{(a.views || 0).toLocaleString("ar-EG")}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Social follow */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <SectionHead title="تابعونا" />
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Facebook", color: "bg-blue-600", count: "7.3K" },
                  { name: "X (Twitter)", color: "bg-black", count: "3.7K" },
                  { name: "YouTube", color: "bg-red-600", count: "12K" },
                  { name: "Instagram", color: "bg-gradient-to-br from-purple-500 to-pink-500", count: "5.1K" },
                ].map(s => (
                  <div key={s.name} className={`${s.color} text-white rounded-xl p-3 text-center hover:opacity-90 cursor-pointer transition-opacity`}>
                    <div className="font-black text-sm">{s.count}</div>
                    <div className="text-[11px] opacity-80">{s.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <SectionHead title="النشرة الإخبارية" />
              {subscribers.done ? (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">🎉</div>
                  <p className="text-sm font-bold text-primary">شكراً للاشتراك!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">احصل على آخر الأخبار في بريدك الإلكتروني</p>
                  <input type="email" value={subscribers.email}
                    onChange={e => setSubscribers(s => ({ ...s, email: e.target.value }))}
                    placeholder="بريدك الإلكتروني" dir="rtl"
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/30 outline-none" />
                  <button onClick={subscribe} disabled={subscribers.loading}
                    className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-black hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {subscribers.loading ? "جاري الاشتراك..." : "اشترك الآن"}
                  </button>
                </div>
              )}
            </div>

            {/* Breaking news widget */}
            {breaking.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-4">
                <SectionHead title="عاجل" />
                <div className="space-y-2">
                  {breaking.slice(0, 4).map(a => (
                    <Link key={a.id} to={`/article/${a.slug}`}
                      className="flex items-start gap-2 group">
                      <Flame className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-sm font-bold group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">{a.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>

        {/* ══ CATEGORIES BROWSE ══ */}
        <section>
          <SectionHead title="تصفح الأخبار حسب الأقسام" />
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((cat, i) => {
              const catArts = articles.filter(a => a.category_id === cat.id);
              const bg = ["from-blue-600","from-red-600","from-green-600","from-purple-600","from-yellow-600","from-teal-600","from-pink-600","from-indigo-600"][i % 8];
              return (
                <Link key={cat.id} to={`/category/${cat.slug}`}
                  className={`shrink-0 w-36 sm:w-auto bg-gradient-to-br ${bg} to-black/70 rounded-2xl overflow-hidden relative group`}>
                  {catArts[0]?.featured_image && (
                    <img src={catArts[0].featured_image} alt={cat.name_ar}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-overlay group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="relative p-4 text-center min-h-[80px] flex flex-col items-center justify-center">
                    <div className="text-2xl mb-1">{cat.icon || "📰"}</div>
                    <div className="text-white font-black text-sm">{cat.name_ar}</div>
                    <div className="text-white/70 text-[10px] mt-0.5">{catArts.length} خبر</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Index;
