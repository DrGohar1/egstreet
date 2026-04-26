import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import BreakingTicker from "@/components/BreakingTicker";
import SEOHead from "@/components/SEOHead";
import { Eye, Clock, ChevronLeft, ChevronRight, Flame, ArrowLeft, Share2, Bookmark, TrendingUp, Radio, Newspaper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  featured_image: string | null; published_at: string | null;
  category_id: string | null; views: number; custom_author_name: string | null;
  is_featured: boolean;
}
interface Category { id: string; name_ar: string; name_en: string; slug: string; color?: string; }

const CAT_COLORS: Record<string, string> = {
  politics:"bg-red-600", economy:"bg-blue-600", sports:"bg-green-600",
  technology:"bg-purple-600", entertainment:"bg-pink-600", health:"bg-teal-600",
  world:"bg-orange-600", local:"bg-yellow-600",
};

const timeAgo = (d: string | null) => {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return new Date(d).toLocaleDateString("ar-EG");
};

const readTime = (text: string) => Math.max(1, Math.ceil(text.split(/\s+/).length / 200));

/* ── NewsCard variants ── */
const HeroCard = ({ a, cat }: { a: Article; cat?: Category }) => (
  <Link to={`/article/${a.slug}`} className="group relative block overflow-hidden rounded-2xl bg-black aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9]">
    {a.featured_image
      ? <img src={a.featured_image} alt={a.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
      : <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"/>
    }
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"/>
    <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8">
      {cat && <span className={`self-start text-[10px] font-black text-white px-3 py-1 rounded-full mb-3 ${CAT_COLORS[cat.slug]||"bg-primary"}`}>{cat.name_ar}</span>}
      {a.is_featured && <span className="self-start text-[10px] font-black text-white bg-red-500 px-3 py-1 rounded-full mb-2 flex items-center gap-1"><Radio className="w-2.5 h-2.5 animate-pulse"/> مباشر</span>}
      <h2 className="text-white font-black text-xl md:text-3xl leading-tight line-clamp-3 group-hover:text-primary transition-colors">{a.title}</h2>
      {a.excerpt && <p className="text-white/70 text-sm mt-2 line-clamp-2 hidden md:block">{a.excerpt}</p>}
      <div className="flex items-center gap-4 mt-3 text-white/60 text-xs">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{timeAgo(a.published_at)}</span>
        <span className="flex items-center gap-1"><Eye className="w-3 h-3"/>{(a.views||0).toLocaleString("ar-EG")}</span>
        {a.custom_author_name && <span>{a.custom_author_name}</span>}
      </div>
    </div>
  </Link>
);

const MedCard = ({ a, cat }: { a: Article; cat?: Category }) => (
  <Link to={`/article/${a.slug}`}
    className="group flex gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border">
    {a.featured_image
      ? <img src={a.featured_image} alt={a.title} className="w-20 h-16 sm:w-24 sm:h-18 object-cover rounded-xl shrink-0 group-hover:scale-105 transition-transform"/>
      : <div className="w-20 h-16 rounded-xl bg-muted shrink-0 flex items-center justify-center"><Newspaper className="w-5 h-5 text-muted-foreground/30"/></div>
    }
    <div className="flex-1 min-w-0">
      {cat && <span className="text-[9px] font-black text-primary uppercase tracking-wide">{cat.name_ar}</span>}
      <h3 className="font-bold text-sm leading-snug line-clamp-2 mt-0.5 group-hover:text-primary transition-colors">{a.title}</h3>
      <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-2.5 h-2.5"/>{timeAgo(a.published_at)}</span>
    </div>
  </Link>
);

const GridCard = ({ a, cat }: { a: Article; cat?: Category }) => (
  <Link to={`/article/${a.slug}`} className="group block bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5">
    {a.featured_image
      ? <div className="aspect-video overflow-hidden"><img src={a.featured_image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/></div>
      : <div className="aspect-video bg-muted flex items-center justify-center"><Newspaper className="w-8 h-8 text-muted-foreground/20"/></div>
    }
    <div className="p-4">
      {cat && <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded-full ${CAT_COLORS[cat.slug]||"bg-primary"}`}>{cat.name_ar}</span>}
      <h3 className="font-bold text-sm leading-snug line-clamp-2 mt-2 group-hover:text-primary transition-colors">{a.title}</h3>
      {a.excerpt && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{a.excerpt}</p>}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5"/>{timeAgo(a.published_at)}</span>
        <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5"/>{(a.views||0).toLocaleString("ar-EG")}</span>
      </div>
    </div>
  </Link>
);

const RankCard = ({ a, rank, cat }: { a: Article; rank: number; cat?: Category }) => (
  <Link to={`/article/${a.slug}`} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-all">
    <span className={`text-2xl font-black shrink-0 w-8 leading-none ${rank <= 3 ? "text-primary" : "text-muted-foreground/30"}`}>
      {String(rank).padStart(2,"0")}
    </span>
    <div className="flex-1 min-w-0">
      {cat && <span className="text-[9px] font-black text-primary">{cat.name_ar}</span>}
      <h4 className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors mt-0.5">{a.title}</h4>
      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
        <Eye className="w-2.5 h-2.5"/>{(a.views||0).toLocaleString("ar-EG")} قراءة
      </span>
    </div>
  </Link>
);

/* ── Category section ── */
const CategorySection = ({ title, articles, cats, color = "bg-primary" }: any) => (
  <section>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-1 h-6 rounded-full ${color}`}/>
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      <Link to="/category/all" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
        الكل <ArrowLeft className="w-3 h-3"/>
      </Link>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {articles.slice(0,4).map((a: Article) => (
        <GridCard key={a.id} a={a} cat={cats.find((c: Category) => c.id === a.category_id)}/>
      ))}
    </div>
  </section>
);

/* ══════════ MAIN PAGE ══════════ */
export default function Index() {
  const { t, language } = useLanguage();
  const [articles,   setArticles]   = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("all");

  const load = useCallback(async () => {
    const [{ data: arts }, { data: cats }] = await Promise.all([
      supabase.from("articles").select("id,title,slug,excerpt,featured_image,published_at,category_id,views,custom_author_name,is_featured")
        .eq("status", "published").order("published_at", { ascending: false }).limit(30),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setArticles((arts as Article[]) || []);
    setCategories(cats || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cat = (id: string | null) => categories.find(c => c.id === id);

  const featured  = articles.filter(a => a.is_featured).slice(0, 1);
  const hero      = featured.length ? featured : articles.slice(0, 1);
  const secondary = articles.slice(1, 5);
  const trending  = [...articles].sort((a,b) => (b.views||0) - (a.views||0)).slice(0, 5);
  const latest    = articles.slice(0, 8);
  const rest      = articles.slice(5, 13);

  // Group by category
  const byCat: Record<string, Article[]> = {};
  articles.forEach(a => {
    if (a.category_id) {
      if (!byCat[a.category_id]) byCat[a.category_id] = [];
      byCat[a.category_id].push(a);
    }
  });

  if (loading) return (
    <div className="min-h-screen bg-background">
      <div className="h-14 bg-card border-b"/>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {[...Array(3)].map((_,i) => (
          <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse"/>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEOHead title="الشارع المصري — أخبار مصر والعالم" description="الشارع المصري — أخبار مصر لحظة بلحظة"/>
      <Header/>
      <BreakingTicker/>

      {/* ── Category nav pills ── */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2.5">
            <button onClick={() => setActiveTab("all")}
              className={`shrink-0 text-xs font-black px-4 py-1.5 rounded-full transition-all ${activeTab==="all"?"bg-primary text-white":"hover:bg-muted text-muted-foreground"}`}>
              الكل
            </button>
            {categories.map(c => (
              <Link key={c.id} to={`/category/${c.slug}`}
                className="shrink-0 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-muted text-muted-foreground transition-all">
                {c.name_ar}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-10">

        {/* ── HERO SECTION ── */}
        {hero[0] && (
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main hero */}
              <div className="lg:col-span-2">
                <HeroCard a={hero[0]} cat={cat(hero[0].category_id||null)||undefined}/>
              </div>
              {/* Secondary stack */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 bg-primary rounded-full"/>
                  <h2 className="text-sm font-black">آخر الأخبار</h2>
                </div>
                {secondary.map(a => (
                  <MedCard key={a.id} a={a} cat={cat(a.category_id||null)||undefined}/>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── TRENDING + LATEST ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest 8 */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-primary rounded-full"/>
              <h2 className="text-lg font-black">الأحدث</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {latest.map(a => <GridCard key={a.id} a={a} cat={cat(a.category_id||null)||undefined}/>)}
            </div>
          </div>

          {/* Sidebar: Trending + Cats */}
          <div className="space-y-5">
            {/* Trending */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-red-500"/>
                <h3 className="font-black text-sm">الأكثر قراءة</h3>
              </div>
              <div className="space-y-1">
                {trending.map((a, i) => (
                  <RankCard key={a.id} a={a} rank={i+1} cat={cat(a.category_id||null)||undefined}/>
                ))}
              </div>
            </div>

            {/* Categories quick nav */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary"/>
                <h3 className="font-black text-sm">الأقسام</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(c => (
                  <Link key={c.id} to={`/category/${c.slug}`}
                    className={`text-[11px] font-black text-white px-3 py-2 rounded-xl text-center transition-all hover:opacity-80 active:scale-95 ${CAT_COLORS[c.slug]||"bg-primary"}`}>
                    {c.name_ar}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── MORE ARTICLES ── */}
        {rest.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-blue-500 rounded-full"/>
              <h2 className="text-lg font-black">المزيد من الأخبار</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {rest.map(a => <GridCard key={a.id} a={a} cat={cat(a.category_id||null)||undefined}/>)}
            </div>
          </section>
        )}

        {/* ── CATEGORY SECTIONS ── */}
        {categories.filter(c => (byCat[c.id]||[]).length >= 2).slice(0,3).map((c,i) => (
          <CategorySection key={c.id} title={c.name_ar}
            articles={byCat[c.id]||[]} cats={categories}
            color={Object.values(CAT_COLORS)[i]||"bg-primary"}/>
        ))}

      </main>
      

    </div>
  );
}
