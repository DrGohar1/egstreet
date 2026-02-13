import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import BreakingTicker from "@/components/BreakingTicker";
import ArticleCard from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

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

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, artRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("articles").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(20),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (artRes.data) setArticles(artRes.data);
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

  const hasContent = articles.length > 0;

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

      {breakingArticles.length > 0 && (
        <BreakingTicker headlines={breakingArticles.map((a) => a.title)} />
      )}

      <CategoryNav categories={categories} />

      <main className="container py-6">
        {hasContent ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hero / Featured */}
            <div className="lg:col-span-2 space-y-6">
              {featuredArticles[0] && (
                <ArticleCard
                  variant="hero"
                  title={featuredArticles[0].title}
                  excerpt={featuredArticles[0].excerpt || undefined}
                  slug={featuredArticles[0].slug}
                  featuredImage={featuredArticles[0].featured_image || undefined}
                  categoryName={getCategoryName(featuredArticles[0].category_id)}
                  publishedAt={featuredArticles[0].published_at || undefined}
                />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredArticles.slice(1, 5).map((article) => (
                  <ArticleCard
                    key={article.id}
                    title={article.title}
                    excerpt={article.excerpt || undefined}
                    slug={article.slug}
                    featuredImage={article.featured_image || undefined}
                    categoryName={getCategoryName(article.category_id)}
                    publishedAt={article.published_at || undefined}
                  />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-1">
              <h3 className="text-lg font-bold text-foreground border-b-2 border-primary pb-2 mb-3">
                {t("آخر الأخبار", "Latest News")}
              </h3>
              {latestArticles.slice(0, 8).map((article) => (
                <ArticleCard
                  key={article.id}
                  variant="compact"
                  title={article.title}
                  slug={article.slug}
                  featuredImage={article.featured_image || undefined}
                  publishedAt={article.published_at || undefined}
                />
              ))}
            </aside>
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-20">
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
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
