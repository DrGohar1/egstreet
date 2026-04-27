import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BreakingTicker from "@/components/BreakingTicker";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import AdSlot from "@/components/AdSlot";
import { Eye, Clock, ChevronLeft, Flame, Newspaper, Facebook, Youtube, Twitter, Instagram } from "lucide-react";

/* ─── Types ─── */
interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  featured_image: string | null; published_at: string | null;
  category_id: string | null; views?: number; is_featured?: boolean;
}
interface Category { id: string; name_ar: string; slug: string; }

/* ─── Helpers ─── */
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

const CAT_COLORS: Record<string, string> = {
  egypt:"bg-red-600", world:"bg-blue-700", sports:"bg-green-600",
  politics:"bg-purple-600", economy:"bg-yellow-600", tech:"bg-cyan-600", culture:"bg-pink-600",
};

/* ─── Card: Hero Slider ─── */
const HeroCard = ({ a, cat }: { a: Article; cat?: Category }) => (
  <Link to={`/article/${a.slug}`} className="group block relative overflow-hidden rounded-xl aspect-[16/9] shadow-md">
    {a.featured_image
      ? <img src={a.featured_image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
      : <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900"/>}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"/>
    <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
      {cat && (
        <span className={`self-start text-[10px] font-black text-white px-2 py-0.5 rounded mb-2 ${CAT_COLORS[cat.slug]||"bg-primary"}`}>
          {cat.name_ar}
        </span>
      )}
      <h2 className="text-white font-black text-base sm:text-xl leading-snug line-clamp-2 group-hover:underline underline-offset-2">
        {a.title}
      </h2>
      <div className="flex items-center gap-3 mt-2 text-white/60 text-[11px]">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{timeAgo(a.published_at)}</span>
        <span className="flex items-center gap-1"><Eye className="w-3 h-3"/>{(a.views||0).toLocaleString("ar-EG")} قراءة</span>
      </div>
    </div>
  </Link>
);

/* ─── Card: Most Read rank ─── */
const RankCard = ({ a, rank, cat }: { a: Article; rank: number; cat?: Category }) => (
  <Link to={`/article/${a.slug}`} className="group flex items-start gap-2.5 py-2.5 border-b border-border/40 last:border-0 hover:bg-muted/20 px-1 rounded transition-colors">
    <span className={`text-xl font-black shrink-0 w-7 leading-none tabular-nums ${rank<=3?"text-primary":"text-muted-foreground/30"}`}>
      {String(rank).padStart(2,"0")}
    </span>
    <div className="flex gap-2 flex-1 min-w-0">
      {a.featured_image && (
        <img src={a.featured_image} alt={a.title} className="w-14 h-11 object-cover rounded shrink-0"/>
      )}
      <div className="flex-1 min-w-0">
        {cat && <span className="text-[9px] font-black text-primary block">{cat.name_ar}</span>}
        <h4 className="text-xs font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">{a.title}</h4>
        <span className="text-[10px] text-muted-foreground mt-0.5 block">{timeAgo(a.published_at)}</span>
      </div>
    </div>
  </Link>
);

/* ─── Card: News grid (image top) ─── */
const GridCard = ({ a, cat }: { a: Article; cat?: Category }) => (
  <Link to={`/article/${a.slug}`} className="group block bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
    {a.featured_image
      ? <div className="aspect-video overflow-hidden"><img src={a.featured_image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/></div>
      : <div className="aspect-video bg-muted flex items-center justify-center"><Newspaper className="w-8 h-8 text-muted-foreground/20"/></div>}
    <div className="p-3">
      {cat && (
        <span className={`inline-block text-[9px] font-black text-white px-2 py-0.5 rounded mb-1.5 ${CAT_COLORS[cat.slug]||"bg-primary"}`}>
          {cat.name_ar}
        </span>
      )}
      <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{a.title}</h3>
      <span className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
        <Clock className="w-2.5 h-2.5"/>{timeAgo(a.published_at)}
      </span>
    </div>
  </Link>
);

/* ─── Section header ─── */
const SecHead = ({ title, href, color="bg-primary" }: { title:string; href?:string; color?:string }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className={`w-1 h-6 rounded-full ${color}`}/>
      <h2 className="text-base font-black">{title}</h2>
    </div>
    {href && <Link to={href} className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"><ChevronLeft className="w-3.5 h-3.5"/>المزيد</Link>}
  </div>
);

/* ─── Social counter ─── */
const SocialCount = ({ icon: Icon, label, count, color }: { icon: any; label: string; count: string; color: string }) => (
  <a href="#" className={`flex items-center gap-2 ${color} text-white rounded-xl px-3 py-2.5 hover:opacity-90 transition-opacity`}>
    <Icon className="w-4 h-4 shrink-0"/>
    <div className="flex flex-col leading-none">
      <span className="text-xs font-black">{count}</span>
      <span className="text-[10px] opacity-80">{label}</span>
    </div>
  </a>
);

/* ══════════════════ MAIN PAGE ══════════════════ */
export default function Index() {
  const [articles,   setArticles]   = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [heroIdx,    setHeroIdx]    = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const fetchData = useCallback(async () => {
    const [{ data: arts }, { data: cats }] = await Promise.all([
      supabase.from("articles")
        .select("id,title,slug,excerpt,featured_image,published_at,category_id,views,is_featured")
        .eq("status","published").order("published_at",{ascending:false}).limit(40),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setArticles((arts as Article[]) || []);
    setCategories(cats || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const cat = (id: string | null) => categories.find(c => c.id === id);

  // Data slices
  const heroPool    = articles.filter(a => a.is_featured).length >= 3
    ? articles.filter(a => a.is_featured).slice(0,5)
    : articles.slice(0,5);
  const trending    = [...articles].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5);
  const egyptCat    = categories.find(c => c.slug === "egypt");
  const sportsCat   = categories.find(c => c.slug === "sports");
  const worldCat    = categories.find(c => c.slug === "world");
  const egyptArts   = articles.filter(a => a.category_id === egyptCat?.id).slice(0,4);
  const sportsArts  = articles.filter(a => a.category_id === sportsCat?.id).slice(0,3);
  const worldArts   = articles.filter(a => a.category_id === worldCat?.id).slice(0,3);
  const otherCats   = categories.filter(c => !["egypt","sports","world"].includes(c.slug));

  // Auto-advance hero
  useEffect(() => {
    if (heroPool.length < 2) return;
    timerRef.current = setInterval(() => setHeroIdx(i => (i+1) % heroPool.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [heroPool.length]);

  if (loading) return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="h-14 bg-card border-b"/>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {[...Array(4)].map((_,i) => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse"/>)}
      </div>
    </div>
  );

  const heroArt = heroPool[heroIdx];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <SEOHead title="الشارع المصري — أخبار مصر والعالم" description="أخبار مصر والعالم العربي لحظة بلحظة"/>
      <Header/>
      <BreakingTicker/>

      {/* ══ Ad 1 — Top Banner 728×90 ══ */}
      <div className="w-full bg-muted/10 py-2 border-b border-border/30">
        <div className="max-w-5xl mx-auto px-4 flex justify-center">
          <AdSlot id="ad-top" width={728} height={90} label="مساحة إعلانية 1"/>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 space-y-6">

        {/* ══ SECTION 1: Hero + Most Read ══ */}
        {heroArt && (
          <section className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">

            {/* Hero Slider */}
            <div className="relative">
              <HeroCard a={heroArt} cat={cat(heroArt.category_id)||undefined}/>
              {/* Dots */}
              {heroPool.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-2">
                  {heroPool.map((_,i) => (
                    <button key={i} onClick={() => { setHeroIdx(i); if(timerRef.current) clearInterval(timerRef.current); }}
                      className={`w-2 h-2 rounded-full transition-all ${i===heroIdx?"bg-primary w-5":"bg-muted-foreground/30"}`}/>
                  ))}
                </div>
              )}
            </div>

            {/* Most Read Sidebar */}
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                <Flame className="w-4 h-4 text-primary"/>
                <h3 className="font-black text-sm">الأكثر قراءة</h3>
              </div>
              <div className="space-y-0.5">
                {trending.map((a,i) => (
                  <RankCard key={a.id} a={a} rank={i+1} cat={cat(a.category_id)||undefined}/>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ SECTION 2: Ad2 + Ad3 + Egypt News ══ */}
        <section className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">

          {/* Left: Ad 2 + Social followers */}
          <div className="space-y-4">
            <AdSlot id="ad-left-1" width={250} height={300} label="مساحة إعلانية 2"/>

            {/* Social followers */}
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs font-black text-muted-foreground mb-2.5">يتابعونا</p>
              <div className="grid grid-cols-2 gap-2">
                <SocialCount icon={Facebook} label="فيسبوك"   count="1.2M"  color="bg-[#1877F2]"/>
                <SocialCount icon={Twitter}  label="تويتر X"  count="850K"  color="bg-[#000000]"/>
                <SocialCount icon={Youtube}  label="يوتيوب"   count="650K"  color="bg-[#FF0000]"/>
                <SocialCount icon={Instagram} label="انستقرام" count="480K"  color="bg-gradient-to-br from-purple-500 to-pink-500"/>
              </div>
            </div>
          </div>

          {/* Right: Ad3 + Egypt News */}
          <div className="space-y-4">
            {/* Ad 3 — after hero row */}
            <div className="flex justify-center">
              <AdSlot id="ad-mid-1" width={728} height={90} label="مساحة إعلانية 3 ( بعد الخبر الرئيسي )"/>
            </div>

            {/* Egypt News */}
            {egyptCat && (
              <div>
                <SecHead title="أخبار مصر" href={`/category/${egyptCat.slug}`} color="bg-red-600"/>
                {egyptArts.length > 0
                  ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {egyptArts.map(a => <GridCard key={a.id} a={a} cat={egyptCat}/>)}
                    </div>
                  : <p className="text-xs text-muted-foreground">لا توجد أخبار بعد</p>
                }
              </div>
            )}
          </div>
        </section>

        {/* ══ Ad 4 — Between sections ══ */}
        <div className="flex justify-center py-1">
          <AdSlot id="ad-mid-2" width={728} height={90} label="مساحة إعلانية 4 ( بين الأخبار )"/>
        </div>

        {/* ══ SECTION 3: Ad5 + Sports + World ══ */}
        <section className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">

          {/* Left: Ad 5 */}
          <div>
            <AdSlot id="ad-left-2" width={250} height={300} label="مساحة إعلانية 5" sticky/>
          </div>

          {/* Right: Sports + World side by side */}
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Sports */}
              {sportsCat && (
                <div>
                  <SecHead title="أخبار الرياضة" href={`/category/${sportsCat.slug}`} color="bg-green-600"/>
                  <div className="space-y-3">
                    {sportsArts.length > 0
                      ? sportsArts.map(a => (
                          <Link key={a.id} to={`/article/${a.slug}`}
                            className="group flex gap-2.5 items-start hover:bg-muted/30 p-1.5 rounded-lg transition-colors">
                            {a.featured_image
                              ? <img src={a.featured_image} alt={a.title} className="w-20 h-14 object-cover rounded-lg shrink-0"/>
                              : <div className="w-20 h-14 bg-muted rounded-lg shrink-0 flex items-center justify-center"><Newspaper className="w-5 h-5 text-muted-foreground/30"/></div>}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">{a.title}</h4>
                              <span className="text-[10px] text-muted-foreground mt-1 block">{timeAgo(a.published_at)}</span>
                            </div>
                          </Link>
                        ))
                      : <p className="text-xs text-muted-foreground">لا توجد أخبار بعد</p>
                    }
                  </div>
                </div>
              )}

              {/* World */}
              {worldCat && (
                <div>
                  <SecHead title="أخبار العالم" href={`/category/${worldCat.slug}`} color="bg-blue-700"/>
                  <div className="space-y-3">
                    {worldArts.length > 0
                      ? worldArts.map(a => (
                          <Link key={a.id} to={`/article/${a.slug}`}
                            className="group flex gap-2.5 items-start hover:bg-muted/30 p-1.5 rounded-lg transition-colors">
                            {a.featured_image
                              ? <img src={a.featured_image} alt={a.title} className="w-20 h-14 object-cover rounded-lg shrink-0"/>
                              : <div className="w-20 h-14 bg-muted rounded-lg shrink-0 flex items-center justify-center"><Newspaper className="w-5 h-5 text-muted-foreground/30"/></div>}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">{a.title}</h4>
                              <span className="text-[10px] text-muted-foreground mt-1 block">{timeAgo(a.published_at)}</span>
                            </div>
                          </Link>
                        ))
                      : <p className="text-xs text-muted-foreground">لا توجد أخبار بعد</p>
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Other categories */}
            {otherCats.slice(0,2).map(c => {
              const cArts = articles.filter(a => a.category_id === c.id).slice(0,4);
              if (!cArts.length) return null;
              return (
                <div key={c.id}>
                  <SecHead title={c.name_ar} href={`/category/${c.slug}`} color={CAT_COLORS[c.slug]||"bg-primary"}/>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {cArts.map(a => <GridCard key={a.id} a={a} cat={c}/>)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══ Ad 6 — Before footer ══ */}
        <div className="flex justify-center py-1">
          <AdSlot id="ad-prefooter" width={728} height={90} label="مساحة إعلانية 6 ( قبل الفوتر )"/>
        </div>

      </main>

      <Footer/>

      {/* ══ Ad 7 — Footer Banner ══ */}
      <div className="w-full bg-muted/10 py-2 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-4 flex justify-center">
          <AdSlot id="ad-footer" width={728} height={90} label="مساحة إعلانية 7 ( Footer Banner )"/>
        </div>
      </div>

    </div>
  );
}
