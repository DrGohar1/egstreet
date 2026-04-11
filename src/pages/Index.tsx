import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import BreakingTicker from "@/components/BreakingTicker";
import StickyHeader from "@/components/StickyHeader";
import ArticleCard from "@/components/ArticleCard";
import SkeletonCard from "@/components/SkeletonCard";
import MostReadWidget from "@/components/MostReadWidget";
import AdBanner from "@/components/AdBanner";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Flame, Zap, Clock } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } } };
const slideInRight = { hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" as const } } };

interface Category { id: string; name_ar: string; name_en: string; slug: string; }
interface Article { id: string; title: string; slug: string; excerpt: string | null; featured_image: string | null; published_at: string | null; is_breaking: boolean | null; is_featured: boolean | null; category_id: string | null; views: number; }

const Index = () => {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleCatsMap, setArticleCatsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, artRes, acRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("articles").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(40),
        supabase.from("article_categories").select("article_id, category_id"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (artRes.data) setArticles(artRes.data);
      if (acRes.data) {
        const map: Record<string, string[]> = {};
        acRes.data.forEach((ac: { article_id: string; category_id: string }) => {
          if (!map[ac.article_id]) map[ac.article_id] = [];
          map[ac.article_id].push(ac.category_id);
        });
        setArticleCatsMap(map);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const breakingArticles = articles.filter((a) => a.is_breaking);
  const featuredArticles = articles.filter((a) => a.is_featured);
  const latestArticles = articles.filter((a) => !a.is_featured);
  const mostViewed = [...articles].sort((a, b) => b.views - a.views).slice(0, 5);

  const getCategoryName = (catId: string | null) => {
    if (!catId) return undefined;
    const cat = categories.find((c) => c.id === catId);
    return cat ? (language === "ar" ? cat.name_ar : cat.name_en) : undefined;
  };

  const articlesByCategory: Record<string, Article[]> = {};
  articles.forEach((a) => {
    const catIds = articleCatsMap[a.id] || (a.category_id ? [a.category_id] : []);
    catIds.forEach((catId) => {
      if (!articlesByCategory[catId]) articlesByCategory[catId] = [];
      if (!articlesByCategory[catId].find((x) => x.id === a.id)) {
        articlesByCategory[catId].push(a);
      }
    });
  });

  const tickerEl = breakingArticles.length > 0 ? (
    <BreakingTicker
      headlines={breakingArticles.map((a) => a.title)}
      slugs={breakingArticles.map((a) => a.slug)}
    />
  ) : null;

  const categoryNavEl = <CategoryNav categories={categories} />;

  return (
    <div className="min-h-screen bg-background content-protected">
      <SEOHead
        title={t("الرئيسية", "Home")}
        description={t("جريدة الشارع المصري - أخبار مصر والعالم العربي", "EgStreet News - Egypt and Arab World News")}
      />
      <Header />
      <StickyHeader ticker={tickerEl} categoryNav={categoryNavEl} />

      <main className="container py-6 space-y-8">
        <AdBanner position="top" />

        {loading ? (
          <div className="space-y-10">
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                <SkeletonCard variant="hero" />
                <div className="grid grid-cols-2 gap-4">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              </div>
              <aside className="space-y-3">
                {[...Array(5)].map((_, i) => <SkeletonCard key={i} variant="compact" />)}
              </aside>
            </section>
          </div>
        ) : articles.length > 0 ? (
          <>
            {/* ═══════ HERO BENTO GRID ═══════ */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Main Hero */}
              <div className="lg:col-span-7">
                {featuredArticles[0] && (
                  <motion.div variants={scaleIn} initial="hidden" animate="visible" className="h-full">
                    <ArticleCard
                      variant="hero"
                      title={featuredArticles[0].title}
                      excerpt={featuredArticles[0].excerpt || undefined}
                      slug={featuredArticles[0].slug}
                      featuredImage={featuredArticles[0].featured_image || undefined}
                      categoryName={getCategoryName(featuredArticles[0].category_id)}
                      publishedAt={featuredArticles[0].published_at || undefined}
                      views={featuredArticles[0].views}
                    />
                  </motion.div>
                )}
              </div>

              {/* Side Featured Grid */}
              <motion.div className="lg:col-span-5 grid grid-cols-2 gap-4" variants={staggerContainer} initial="hidden" animate="visible">
                {featuredArticles.slice(1, 5).map((article, i) => (
                  <motion.div key={article.id} variants={fadeUp} custom={i + 1}>
                    <ArticleCard
                      variant="featured-side"
                      title={article.title}
                      slug={article.slug}
                      featuredImage={article.featured_image || undefined}
                      categoryName={getCategoryName(article.category_id)}
                      publishedAt={article.published_at || undefined}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* ═══════ LATEST + SIDEBAR ═══════ */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Latest News */}
              <motion.div className="lg:col-span-8 space-y-5" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 border-b-[3px] border-primary pb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-black text-foreground">{t("آخر الأخبار", "Latest News")}</h2>
                </motion.div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {latestArticles.slice(0, 6).map((article, i) => (
                    <motion.div key={article.id} variants={fadeUp} custom={i + 1}>
                      <ArticleCard
                        title={article.title}
                        excerpt={article.excerpt || undefined}
                        slug={article.slug}
                        featuredImage={article.featured_image || undefined}
                        categoryName={getCategoryName(article.category_id)}
                        publishedAt={article.published_at || undefined}
                        views={article.views}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Sidebar */}
              <motion.aside className="lg:col-span-4 space-y-5" variants={slideInRight} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                {/* Most Viewed */}
                <div className="bg-card rounded-2xl border border-border/50 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-black text-foreground">{t("الأكثر قراءة", "Most Read")}</h3>
                  </div>
                  <div className="space-y-0">
                    {mostViewed.map((article, i) => (
                      <div key={article.id} className="flex items-start gap-3">
                        <span className="text-2xl font-black text-primary/20 leading-none mt-3 min-w-[24px]">{i + 1}</span>
                        <div className="flex-1">
                          <ArticleCard
                            variant="compact"
                            title={article.title}
                            slug={article.slug}
                            featuredImage={article.featured_image || undefined}
                            publishedAt={article.published_at || undefined}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <AdBanner position="sidebar" limit={2} />
                <MostReadWidget />
              </motion.aside>
            </section>

            <AdBanner position="inline" />

            {/* ═══════ CATEGORY SECTIONS ═══════ */}
            {categories.map((cat, catIndex) => {
              const catArticles = articlesByCategory[cat.id];
              if (!catArticles || catArticles.length === 0) return null;
              return (
                <motion.section
                  key={cat.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
                  className="space-y-4"
                >
                  <motion.div className="flex items-center justify-between border-b-[3px] border-primary pb-2" variants={fadeUp} custom={0}>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-primary rounded-full" />
                      <h2 className="text-lg font-black text-foreground">{language === "ar" ? cat.name_ar : cat.name_en}</h2>
                    </div>
                    <Link to={`/category/${cat.slug}`} className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline group">
                      {t("المزيد", "More")}
                      <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catArticles.slice(0, 3).map((article, i) => (
                      <motion.div key={article.id} variants={fadeUp} custom={i + 1}>
                        <ArticleCard
                          title={article.title}
                          excerpt={article.excerpt || undefined}
                          slug={article.slug}
                          featuredImage={article.featured_image || undefined}
                          categoryName={getCategoryName(article.category_id)}
                          publishedAt={article.published_at || undefined}
                          views={article.views}
                        />
                      </motion.div>
                    ))}
                  </div>
                  {catIndex % 2 === 1 && <AdBanner position="inline" />}
                </motion.section>
              );
            })}

            <AdBanner position="bottom" />
          </>
        ) : (
          <motion.div className="text-center py-24" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">{t("جريدة الشارع المصري", "EgStreet News")}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("مرحباً! الموقع جاهز. قم بتسجيل الدخول كمسؤول لإضافة الأخبار والمقالات.", "Welcome! The site is ready. Sign in as admin to add news and articles.")}
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
