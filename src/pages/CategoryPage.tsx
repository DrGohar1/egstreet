import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
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
  category_id: string | null;
}

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const currentCategory = categories.find((c) => c.slug === slug);
  const categoryName = currentCategory
    ? language === "ar" ? currentCategory.name_ar : currentCategory.name_en
    : "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: cats } = await supabase.from("categories").select("*").order("sort_order");
      if (cats) {
        setCategories(cats);
        const cat = cats.find((c) => c.slug === slug);
        if (cat) {
          // Fetch articles linked to this category via junction table
          const { data: acRows } = await supabase
            .from("article_categories")
            .select("article_id")
            .eq("category_id", cat.id);
          const articleIds = acRows?.map((r: { article_id: string }) => r.article_id) || [];
          if (articleIds.length > 0) {
            const { data: arts } = await supabase
              .from("articles")
              .select("*")
              .eq("status", "published")
              .in("id", articleIds)
              .order("published_at", { ascending: false })
              .limit(30);
            if (arts) setArticles(arts);
          } else {
            // Fallback: also check legacy category_id
            const { data: arts } = await supabase
              .from("articles")
              .select("*")
              .eq("status", "published")
              .eq("category_id", cat.id)
              .order("published_at", { ascending: false })
              .limit(30);
            if (arts) setArticles(arts);
          }
        }
      }
      setLoading(false);
    };
    if (slug) fetchData();
  }, [slug]);

  const getCategoryName = (catId: string | null) => {
    if (!catId) return undefined;
    const cat = categories.find((c) => c.id === catId);
    return cat ? (language === "ar" ? cat.name_ar : cat.name_en) : undefined;
  };

  return (
    <div className="min-h-screen bg-background content-protected">
      <SEOHead title={categoryName || t("القسم", "Category")} description={`${categoryName} - ${t("جريدة الشارع المصري", "EgStreet News")}`} />
      <Header />
      <CategoryNav categories={categories} activeSlug={slug} />

      <main className="container py-6">
        <h2 className="text-2xl font-black text-foreground mb-6 border-b-4 border-primary pb-3 inline-block">
          {categoryName || t("جاري التحميل...", "Loading...")}
        </h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
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
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">{t("لا توجد مقالات في هذا القسم حالياً", "No articles in this category yet")}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
