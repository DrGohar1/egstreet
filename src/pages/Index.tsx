import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import ArticleCard from "@/components/ArticleCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreakingTicker from "@/components/BreakingTicker";
import {
  Eye, ChevronLeft, ChevronRight, Clock, Flame, ArrowLeft,
  Facebook, Twitter, Youtube, Instagram, Mail, Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  custom_author_name: string | null;
  views: number;
  category_id: string | null;
  is_featured: boolean | null;
  is_breaking: boolean | null;
}

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  icon?: string | null;
  sort_order?: number;
}

const timeAgo = (date: string | null) => {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 7) return `منذ ${d} يوم`;
  return new Date(date).toLocaleDateString("ar-EG");
};

/* ─── Hero Slider ─── */
const HeroSlider = ({
  articles,
  getCatName,
}: {
  articles: Article[];
  getCatName: (a: Article) => string;
}) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (articles.length === 0) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % articles.length), 5000);
    return () => clearInterval(t);
  }, [articles.length]);

  if (articles.length === 0) {
    return <div className="w-full aspect-[16/8] bg-muted rounded-2xl animate-pulse" />;
  }

  const a = articles[idx];
  return (
    <div className="relative w-full aspect-[16/8] rounded-2xl overflow-hidden group shadow-xl select-none">
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={a.featured_image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200"}
          alt={a.title}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 inset-x-0 p-4 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 flex-wrap">
              {a.is_breaking && (
                <span className="flex items-center gap-1 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                  <Flame className="w-3 h-3" /> عاجل
                </span>
              )}
              {getCatName(a) && (
                <span className="bg-primary text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  {getCatName(a)}
                </span>
              )}
            </div>
            <h2 className="text-white font-black text-lg sm:text-xl md:text-3xl leading-snug line-clamp-2 drop-shadow-lg">
              {a.title}
            </h2>
            <div className="flex items-center gap-4 text-white/70 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(a.published_at)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {(a.views || 0).toLocaleString("ar-EG")}
              </span>
            </div>
            <Link
              to={`/article/${a.slug}`}
              className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
            >
              اقرأ المزيد <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      <button
        onClick={() => setIdx((i) => (i - 1 + articles.length) % articles.length)}
        className="absolute top-1/2 -translate-y-1/2 start-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <button
        onClick={() => setIdx((i) => (i + 1) % articles.length)}
        className="absolute top-1/2 -translate-y-1/2 end-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {articles.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`rounded-full transition-all duration-300 ${
              i === idx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── Section Header ─── */
const SectionHead = ({ title, to }: { title: string; to?: string }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="w-1 h-6 bg-primary rounded-full" />
      <h2 className="font-black text-base sm:text-lg">{title}</h2>
    </div>
    {to && (
      <Link
        to={to}
        className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium"
      >
        المزيد <ArrowLeft className="w-3 h-3" />
      </Link>
    )}
  </div>
);

/* ─── Main Page ─── */
const Index = () => {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("all");
  const [email, setEmail] = useState("");
  const [subDone, setSubDone] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  const loadData = useCallback(async () => {
    const [artR, catR] = await Promise.all([
      supabase
        .from("articles")
        .select(
          "id,title,slug,excerpt,featured_image,published_at,custom_author_name,views,category_id,is_featured,is_breaking"
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(40),
      supabase
        .from("categories")
        .select("id,name_ar,name_en,slug,icon,sort_order")
        .order("sort_order"),
    ]);
    if (artR.data) setArticles(artR.data);
    if (catR.data) setCategories(catR.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCatName = (a: Article) =>
    categories.find((c) => c.id === a.category_id)?.name_ar || "";

  const featured = articles.filter((a) => a.is_featured);
  const breaking = articles.filter((a) => a.is_breaking);
  const topRead = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);
  const latest = articles.slice(0, 10);

  const filtered =
    activeCat === "all"
      ? articles
      : articles.filter(
          (a) => categories.find((c) => c.id === a.category_id)?.slug === activeCat
        );

  const subscribe = async () => {
    if (!email) return;
    setSubLoading(true);
    await supabase.from("subscribers").insert({ email });
    setSubLoading(false);
    setSubDone(true);
  };

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header />
        <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
          <div className="aspect-[16/8] bg-muted rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/3] bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Breaking Ticker */}
      {breaking.length > 0 && (
        <BreakingTicker
          headlines={breaking.map((a) => a.title)}
          slugs={breaking.map((a) => a.slug)}
        />
      )}

      <Header />

      <main className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-4 md:py-6 space-y-8 md:space-y-10">

        {/* ══ SECTION 1: HERO + LATEST ══ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Hero Slider */}
          <div className="lg:col-span-8">
            <HeroSlider articles={featured.slice(0, 6)} getCatName={getCatName} />
          </div>

          {/* Latest sidebar — desktop only */}
          <aside className="hidden lg:block lg:col-span-4">
            <SectionHead title="آخر الأخبار" to="/news" />
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {latest.slice(0, 7).map((a) => (
                <Link
                  key={a.id}
                  to={`/article/${a.slug}`}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-muted/60 transition-colors group"
                >
                  {a.featured_image && (
                    <img
                      src={a.featured_image}
                      alt={a.title}
                      className="w-20 h-14 object-cover rounded-lg shrink-0 group-hover:opacity-90 transition-opacity"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-primary mb-0.5">{getCatName(a)}</div>
                    <h3 className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {a.title}
                    </h3>
                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {timeAgo(a.published_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        </section>

        {/* ══ SECTION 2: FEATURED GRID ══ */}
        {featured.length > 0 && (
          <section>
            <SectionHead title="الأخبار المميزة" to="/featured" />
            {/* Desktop */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.slice(0, 4).map((a) => (
                <ArticleCard
                  key={a.id}
                  variant="featured-side"
                  title={a.title}
                  slug={a.slug}
                  featuredImage={a.featured_image || undefined}
                  categoryName={getCatName(a)}
                  publishedAt={a.published_at || undefined}
                  views={a.views}
                />
              ))}
            </div>
            {/* Mobile horizontal scroll */}
            <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-3 px-3 scrollbar-none">
              {featured.slice(0, 6).map((a) => (
                <Link
                  key={a.id}
                  to={`/article/${a.slug}`}
                  className="shrink-0 w-[72vw] snap-start rounded-2xl overflow-hidden border border-border shadow-sm"
                >
                  <div className="relative aspect-[16/10]">
                    <img
                      src={a.featured_image || ""}
                      alt={a.title}
                      className="w-full h-full object-cover"
                      onError={(e) => ((e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-3">
                      <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">
                        {getCatName(a)}
                      </span>
                      <h3 className="text-white text-sm font-black mt-1.5 line-clamp-2 leading-snug">
                        {a.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ══ SECTION 3: LATEST FEED + SIDEBAR ══ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main feed */}
          <div className="lg:col-span-8 space-y-5">
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveCat("all")}
                className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all ${
                  activeCat === "all"
                    ? "bg-primary text-white shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                الكل
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.slug)}
                  className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all ${
                    activeCat === cat.slug
                      ? "bg-primary text-white shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {cat.name_ar}
                </button>
              ))}
            </div>

            <SectionHead
              title={
                activeCat === "all"
                  ? "أحدث الأخبار"
                  : categories.find((c) => c.slug === activeCat)?.name_ar || "الأخبار"
              }
            />

            {/* Desktop grid */}
            <div className="hidden sm:grid grid-cols-2 gap-4">
              {filtered.slice(0, 12).map((a) => (
                <ArticleCard
                  key={a.id}
                  variant="standard"
                  title={a.title}
                  slug={a.slug}
                  featuredImage={a.featured_image || undefined}
                  categoryName={getCatName(a)}
                  publishedAt={a.published_at || undefined}
                  views={a.views}
                  excerpt={a.excerpt || undefined}
                  isBreaking={a.is_breaking || false}
                />
              ))}
            </div>

            {/* Mobile list */}
            <div className="sm:hidden space-y-3">
              {filtered.slice(0, 12).map((a) => (
                <Link
                  key={a.id}
                  to={`/article/${a.slug}`}
                  className="flex items-start gap-3 p-3 bg-card border border-border/60 rounded-2xl shadow-sm active:scale-[0.99] transition-transform"
                >
                  {a.featured_image ? (
                    <img
                      src={a.featured_image}
                      alt={a.title}
                      className="w-24 h-16 object-cover rounded-xl shrink-0"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  ) : (
                    <div className="w-24 h-16 bg-muted rounded-xl shrink-0 flex items-center justify-center">
                      <span className="text-2xl">📰</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      {a.is_breaking && (
                        <span className="flex items-center gap-0.5 text-[10px] font-black text-red-500">
                          <Flame className="w-2.5 h-2.5" /> عاجل
                        </span>
                      )}
                      {getCatName(a) && (
                        <span className="text-[10px] font-bold text-primary">{getCatName(a)}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold leading-snug line-clamp-2">{a.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(a.published_at)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5" />
                        {(a.views || 0).toLocaleString("ar-EG")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-5">
            {/* Most Read */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <SectionHead title="الأكثر قراءة" />
              <div className="space-y-3">
                {topRead.map((a, i) => (
                  <Link key={a.id} to={`/article/${a.slug}`} className="flex items-start gap-3 group">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5 ${
                        ["bg-yellow-500", "bg-gray-400", "bg-amber-700", "bg-primary/60", "bg-primary/40"][i]
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {a.title}
                      </h4>
                      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {(a.views || 0).toLocaleString("ar-EG")}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Social Follow */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <SectionHead title="تابعونا" />
              <div className="grid grid-cols-2 gap-2">
                <a href="#" className="flex items-center justify-center gap-1.5 bg-blue-600 text-white rounded-xl py-3 text-xs font-bold hover:bg-blue-700 transition-colors">
                  <Facebook className="w-4 h-4" /> 7.3K
                </a>
                <a href="#" className="flex items-center justify-center gap-1.5 bg-black text-white rounded-xl py-3 text-xs font-bold hover:bg-gray-900 transition-colors">
                  <Twitter className="w-4 h-4" /> 3.7K
                </a>
                <a href="#" className="flex items-center justify-center gap-1.5 bg-red-600 text-white rounded-xl py-3 text-xs font-bold hover:bg-red-700 transition-colors">
                  <Youtube className="w-4 h-4" /> 12K
                </a>
                <a href="#" className="flex items-center justify-center gap-1.5 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl py-3 text-xs font-bold hover:opacity-90 transition-opacity">
                  <Instagram className="w-4 h-4" /> 5.1K
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <SectionHead title="النشرة الإخبارية" />
              {subDone ? (
                <div className="text-center py-3">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="text-sm font-bold text-primary">تم اشتراكك بنجاح!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    احصل على آخر الأخبار مباشرةً في بريدك الإلكتروني يومياً
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && subscribe()}
                    placeholder="بريدك الإلكتروني"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/30 outline-none"
                    dir="rtl"
                  />
                  <button
                    onClick={subscribe}
                    disabled={subLoading}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-black hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {subLoading ? "جاري الاشتراك..." : "اشترك الآن"}
                  </button>
                </div>
              )}
            </div>

            {/* Breaking widget */}
            {breaking.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-2xl p-4">
                <SectionHead title="أخبار عاجلة" />
                <div className="space-y-2.5">
                  {breaking.slice(0, 5).map((a) => (
                    <Link
                      key={a.id}
                      to={`/article/${a.slug}`}
                      className="flex items-start gap-2 group"
                    >
                      <Flame className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-sm font-bold group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                        {a.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>

        {/* ══ SECTION 4: BROWSE CATEGORIES ══ */}
        {categories.length > 0 && (
          <section>
            <SectionHead title="تصفح الأخبار حسب الأقسام" />
            {/* Desktop grid */}
            <div className="hidden sm:grid grid-cols-4 lg:grid-cols-8 gap-3">
              {categories.map((cat, i) => {
                const img = articles.find((a) => a.category_id === cat.id)?.featured_image;
                const colors = ["from-blue-700","from-red-700","from-green-700","from-purple-700","from-yellow-700","from-teal-700","from-pink-700","from-indigo-700"];
                return (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className={`relative bg-gradient-to-br ${colors[i % 8]} to-black rounded-2xl overflow-hidden group min-h-[90px] flex flex-col items-center justify-center p-3 text-center`}
                  >
                    {img && (
                      <img
                        src={img}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                      />
                    )}
                    <div className="relative z-10">
                      <div className="text-2xl mb-1">{cat.icon || "📰"}</div>
                      <div className="text-white font-black text-xs">{cat.name_ar}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {/* Mobile horizontal scroll */}
            <div className="sm:hidden flex gap-2.5 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-none">
              {categories.map((cat, i) => {
                const img = articles.find((a) => a.category_id === cat.id)?.featured_image;
                const colors = ["from-blue-700","from-red-700","from-green-700","from-purple-700","from-yellow-700","from-teal-700","from-pink-700","from-indigo-700"];
                return (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className={`shrink-0 relative bg-gradient-to-br ${colors[i % 8]} to-black rounded-2xl overflow-hidden w-24 h-24 flex flex-col items-center justify-center p-2 text-center`}
                  >
                    {img && (
                      <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                    )}
                    <div className="relative z-10">
                      <div className="text-xl mb-0.5">{cat.icon || "📰"}</div>
                      <div className="text-white font-black text-[11px] leading-tight">{cat.name_ar}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default Index;
