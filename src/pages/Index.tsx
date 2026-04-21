import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import BreakingTicker from "@/components/BreakingTicker";
import StickyHeader from "@/components/StickyHeader";
import ArticleCard from "@/components/ArticleCard";
import SkeletonCard from "@/components/SkeletonCard";
import AdBanner from "@/components/AdBanner";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Flame, Clock, TrendingUp, ChevronLeft, Newspaper } from "lucide-react";

interface Category { id: string; name_ar: string; name_en: string; slug: string; }
interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  featured_image: string | null; published_at: string | null;
  is_breaking: boolean | null; is_featured: boolean | null;
  category_id: string | null; views: number;
}

const SectionHeader = ({ icon: Icon, label, link }: { icon: any; label: string; link?: string }) => (
  <div className="section-heading">
    <Icon className="w-5 h-5 text-[hsl(var(--primary))] shrink-0" />
    <h2 className="text-lg font-black text-foreground">{label}</h2>
    {link && (
      <Link to={link} className="ms-auto text-xs text-muted-foreground hover:text-[hsl(var(--primary))] transition-colors flex items-center gap-0.5">
        المزيد <ChevronLeft className="w-3 h-3" />
      </Link>
    )}
  </div>
);

const Index = () => {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [acMap, setAcMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [catR, artR, acR] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("articles").select("id,title,slug,excerpt,cover_image,published_at,author_name,views,category_id").eq("status", "published").order("published_at", { ascending: false }).limit(30),
        supabase.from("article_categories").select("article_id, category_id").throwOnError().catch(() => ({ data: [] })),
      ]);
      if (catR.data) setCategories(catR.data);
      if (artR.data) setArticles(artR.data);
      const acData = (acR as any).data || [];
      if (acData.length > 0) {
        const m: Record<string, string[]> = {};
        acData.forEach((x: any) => { if (!m[x.article_id]) m[x.article_id] = []; m[x.article_id].push(x.category_id); });
        setAcMap(m);
      }
      setLoading(false);
    })();
  }, []);

  const getCatName = (article: Article) => {
    const ids = acMap[article.id] || (article.category_id ? [article.category_id] : []);
    const cat = categories.find(c => ids.includes(c.id));
    return cat ? (language === "ar" ? cat.name_ar : cat.name_en) : undefined;
  };

  const breaking = articles.filter(a => a.is_breaking);
  const featured = articles.filter(a => a.is_featured);
  const latest = articles.filter(a => !a.is_featured);
  const mostViewed = [...articles].sort((a, b) => b.views - a.views).slice(0, 6);

  const byCategory: Record<string, Article[]> = {};
  articles.forEach(a => {
    const ids = acMap[a.id] || (a.category_id ? [a.category_id] : []);
    ids.forEach(id => { if (!byCategory[id]) byCategory[id] = []; if (!byCategory[id].find(x => x.id === a.id)) byCategory[id].push(a); });
  });

  return (
    <div className="min-h-screen bg-background content-protected">
      <SEOHead title={t("الرئيسية", "Home")} description={t("جريدة الشارع المصري - أخبار مصر والعالم العربي", "EgStreet News - Egypt and Arab World News")} />
      <Header />
      <StickyHeader
        ticker={breaking.length > 0 ? <BreakingTicker headlines={breaking.map(a => a.title)} slugs={breaking.map(a => a.slug)} /> : null}
        categoryNav={<CategoryNav categories={categories} />}
      />

      <main className="container py-6 space-y-10">
        <AdBanner position="top" />

        {loading ? (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7"><SkeletonCard variant="hero" /></div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
          </section>
        ) : articles.length > 0 ? (
          <>
            {/* ═══ HERO BENTO ═══ */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7">
                {featured[0] && (
                  <ArticleCard variant="hero" title={featured[0].title} excerpt={featured[0].excerpt || undefined}
                    slug={featured[0].slug} featuredImage={featured[0].featured_image || undefined}
                    categoryName={getCatName(featured[0])} publishedAt={featured[0].published_at || undefined}
                    views={featured[0].views} isBreaking={featured[0].is_breaking || false} />
                )}
              </div>
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                {featured.slice(1, 5).map(a => (
                  <ArticleCard key={a.id} variant="featured-side" title={a.title} slug={a.slug}
                    featuredImage={a.featured_image || undefined} categoryName={getCatName(a)}
                    publishedAt={a.published_at || undefined} />
                ))}
              </div>
            </section>

            {/* ═══ LATEST + SIDEBAR ═══ */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-5">
                <SectionHeader icon={Clock} label={t("آخر الأخبار", "Latest News")} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {latest.slice(0, 9).map(a => (
                    <ArticleCard key={a.id} title={a.title} excerpt={a.excerpt || undefined} slug={a.slug}
                      featuredImage={a.featured_image || undefined} categoryName={getCatName(a)}
                      publishedAt={a.published_at || undefined} views={a.views} />
                  ))}
                </div>
              </div>

              <aside className="lg:col-span-4 space-y-6">
                <div className="bg-card rounded-xl border border-border/50 p-4">
                  <SectionHeader icon={Flame} label={t("الأكثر قراءة", "Most Read")} />
                  <div className="space-y-0.5">
                    {mostViewed.map((a, i) => (
                      <div key={a.id} className="flex items-start gap-1.5">
                        <span className="rank-number mt-1">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <ArticleCard variant="compact" title={a.title} slug={a.slug}
                            featuredImage={a.featured_image || undefined} publishedAt={a.published_at || undefined} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <AdBanner position="sidebar" />

                <div className="bg-card rounded-xl border border-border/50 p-4">
                  <SectionHeader icon={TrendingUp} label={t("الأكثر تداولاً", "Trending")} />
                  {latest.slice(9, 14).map(a => (
                    <ArticleCard key={a.id} variant="compact" title={a.title} slug={a.slug}
                      featuredImage={a.featured_image || undefined} publishedAt={a.published_at || undefined} />
                  ))}
                </div>
              </aside>
            </section>

            {/* ═══ CATEGORY SECTIONS ═══ */}
            {categories.slice(0, 6).map(cat => {
              const catArts = byCategory[cat.id];
              if (!catArts || catArts.length < 2) return null;
              return (
                <section key={cat.id} className="space-y-4">
                  <SectionHeader icon={Newspaper} label={language === "ar" ? cat.name_ar : cat.name_en} link={`/category/${cat.slug}`} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {catArts.slice(0, 4).map(a => (
                      <ArticleCard key={a.id} title={a.title} excerpt={a.excerpt || undefined} slug={a.slug}
                        featuredImage={a.featured_image || undefined}
                        categoryName={language === "ar" ? cat.name_ar : cat.name_en}
                        publishedAt={a.published_at || undefined} views={a.views} />
                    ))}
                  </div>
                  <div className="divider-news" />
                </section>
              );
            })}

            <AdBanner position="bottom" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Newspaper className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-black mb-2">{t("لا توجد مقالات منشورة بعد", "No published articles yet")}</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              {t("ابدأ بنشر أول مقال من لوحة التحكم", "Start by publishing your first article from the dashboard")}
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
