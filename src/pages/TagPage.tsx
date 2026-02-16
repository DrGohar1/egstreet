import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ArticleCard from "@/components/ArticleCard";
import { Tag } from "lucide-react";

const TagPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const [tag, setTag] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: tagData } = await supabase.from("tags").select("*").eq("slug", slug!).maybeSingle();
      if (tagData) {
        setTag(tagData);
        const { data: atData } = await supabase.from("article_tags").select("article_id").eq("tag_id", tagData.id);
        const articleIds = atData?.map((at: any) => at.article_id) || [];
        if (articleIds.length > 0) {
          const { data: arts } = await supabase
            .from("articles")
            .select("*")
            .in("id", articleIds)
            .eq("status", "published")
            .order("published_at", { ascending: false });
          setArticles(arts || []);
        }
      }
      const { data: cats } = await supabase.from("categories").select("*");
      setCategories(cats || []);
      setLoading(false);
    };
    if (slug) fetchData();
  }, [slug]);

  const getCategoryName = (catId: string | null) => {
    if (!catId) return undefined;
    const cat = categories.find((c: any) => c.id === catId);
    return cat ? (language === "ar" ? cat.name_ar : cat.name_en) : undefined;
  };

  const tagName = tag ? (language === "ar" ? tag.name_ar : tag.name_en) : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={tagName} description={`${t("مقالات بوسم", "Articles tagged")} ${tagName}`} />
      <Header />
      <main className="container py-8">
        <h1 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
          <Tag className="w-6 h-6 text-primary" />
          {tagName}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        {articles.length === 0 && (
          <p className="text-center py-12 text-muted-foreground">{t("لا توجد مقالات بهذا الوسم", "No articles with this tag")}</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TagPage;
