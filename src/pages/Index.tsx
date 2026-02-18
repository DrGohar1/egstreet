import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import BreakingTicker from "@/components/BreakingTicker";
import StickyHeader from "@/components/StickyHeader";
import ArticleCard from "@/components/ArticleCard";
import MostReadWidget from "@/components/MostReadWidget";
import AdBanner from "@/components/AdBanner";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  is_breaking: boolean | null;
  is_featured: boolean | null;
  category_id: string | null;
}

const Index = () => {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleCatsMap, setArticleCatsMap] = useState<Record<string, string[]>>({});

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
    };
    fetchData();
  }, []);

  const breakingArticles = articles.filter((a) => a.is_breaking);
  const featuredArticles = articles.filter((a) => a.is_featured);
  const latestArticles = articles.filter((a) => !a.is_featured);

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

  const hasContent = articles.length > 0;

  const tickerEl = breakingArticles.length > 0 ? (
    <BreakingTicker headlines={breakingArticles.map((a) => a.title)} />
  ) : null;

  const categoryNavEl = <CategoryNav categories={categories} />;

  return (
    <div className="min-h-screen bg-background content-protected">
      <SEOHead
        title={t("الرئيسية", "Home")}
        description={t(
          "جريدة الشارع المصري - أخبار مصر والعالم العربي",
          "EgStreet News - Egypt and Arab World News"
        )}
      />

      <Header />
      <StickyHeader ticker={tickerEl} categoryNav={categoryNavEl} />

      <main className="container py-6">
        {/* Top Ad Banner */}
        <AdBanner position="top" />

        {hasContent ? (
          <div className="space-y-10">
            {/* Hero Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {featuredArticles[0] && (
                  <motion.div variants={scaleIn} initial="hidden" animate="visible">
                    <ArticleCard
                      variant="hero"
                      title={featuredArticles[0].title}
                      excerpt={featuredArticles[0].excerpt || undefined}
                      slug={featuredArticles[0].slug}
                      featuredImage={featuredArticles[0].featured_image || undefined}
                      categoryName={getCategoryName(featuredArticles[0].category_id)}
                      publishedAt={featuredArticles[0].published_at || undefined}
                    />
                  </motion.div>
                )}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {featuredArticles.slice(1, 3).map((article, i) => (
                    <motion.div key={article.id} variants={fadeUp} custom={i + 1}>
                      <ArticleCard
                        title={article.title}
                        excerpt={article.excerpt || undefined}
                        slug={article.slug}
                        featuredImage={article.featured_image || undefined}
                        categoryName={getCategoryName(article.category_id)}
                        publishedAt={article.published_at || undefined}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Sidebar */}
              <motion.aside
                className="space-y-6"
                variants={slideInRight}
                initial="hidden"
                animate="visible"
              >
                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-black text-foreground">{t("آخر الأخبار", "Latest News")}</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {latestArticles.slice(0, 6).map((article) => (
                      <ArticleCard
                        key={article.id}
                        variant="compact"
                        title={article.title}
                        slug={article.slug}
                        featuredImage={article.featured_image || undefined}
                        publishedAt={article.published_at || undefined}
                      />
                    ))}
                  </div>
                </div>
                {/* Sidebar Ads */}
                <AdBanner position="sidebar" limit={2} />
                <MostReadWidget />
              </motion.aside>
            </section>

            {/* Inline Ad after hero */}
            <AdBanner position="inline" />

            {/* More featured */}
            {featuredArticles.length > 3 && (
              <motion.section
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {featuredArticles.slice(3, 7).map((article, i) => (
                    <motion.div key={article.id} variants={fadeUp} custom={i}>
                      <ArticleCard
                        title={article.title}
                        excerpt={article.excerpt || undefined}
                        slug={article.slug}
                        featuredImage={article.featured_image || undefined}
                        categoryName={getCategoryName(article.category_id)}
                        publishedAt={article.published_at || undefined}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Category Sections */}
            {categories.map((cat, catIndex) => {
              const catArticles = articlesByCategory[cat.id];
              if (!catArticles || catArticles.length === 0) return null;
              return (
                <motion.section
                  key={cat.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.1 } },
                  }}
                >
                  <motion.div
                    className="flex items-center justify-between border-b-4 border-primary pb-2 mb-5"
                    variants={slideInLeft}
                  >
                    <h2 className="text-xl font-black text-foreground">
                      {language === "ar" ? cat.name_ar : cat.name_en}
                    </h2>
                    <Link to={`/category/${cat.slug}`} className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline">
                      {t("المزيد", "More")}
                      <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    </Link>
                  </motion.div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catArticles.slice(0, 3).map((article, i) => (
                      <motion.div key={article.id} variants={fadeUp} custom={i}>
                        <ArticleCard
                          title={article.title}
                          excerpt={article.excerpt || undefined}
                          slug={article.slug}
                          featuredImage={article.featured_image || undefined}
                          categoryName={getCategoryName(article.category_id)}
                          publishedAt={article.published_at || undefined}
                        />
                      </motion.div>
                    ))}
                  </div>
                  {/* Inline ad every 2 categories */}
                  {catIndex % 2 === 1 && <AdBanner position="inline" />}
                </motion.section>
              );
            })}

            {/* Bottom Ad */}
            <AdBanner position="bottom" />
          </div>
        ) : (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <span className="text-3xl">📰</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t("جريدة الشارع المصري", "EgStreet News")}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t(
                "مرحباً! الموقع جاهز. قم بتسجيل الدخول كمسؤول لإضافة الأخبار والمقالات.",
                "Welcome! The site is ready. Sign in as admin to add news and articles."
              )}
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
