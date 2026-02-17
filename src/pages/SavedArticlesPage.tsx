import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ArticleCard from "@/components/ArticleCard";
import { Bookmark } from "lucide-react";

interface SavedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  category_id: string | null;
}

const SavedArticlesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<SavedArticle[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch saved articles
      const { data: saved } = await supabase
        .from("saved_articles")
        .select("article_id")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      if (saved && saved.length > 0) {
        const articleIds = saved.map((s: any) => s.article_id);
        const { data: arts } = await supabase
          .from("articles")
          .select("*")
          .in("id", articleIds)
          .eq("status", "published");

        if (arts) setArticles(arts);
      }

      // Fetch categories
      const { data: cats } = await supabase.from("categories").select("*");
      if (cats) setCategories(cats);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const getCategoryName = (catId: string | null) => {
    if (!catId) return undefined;
    const cat = categories.find((c) => c.id === catId);
    return cat ? (language === "ar" ? cat.name_ar : cat.name_en) : undefined;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("المقالات المحفوظة", "Saved Articles")}
        description={t("عرض المقالات التي حفظتها للقراءة لاحقاً", "View your saved articles")}
      />
      <Header />

      <main className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-black text-foreground">
            {t("المقالات المحفوظة", "Saved Articles")}
          </h1>
        </div>

        {articles.length > 0 ? (
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
            <Bookmark className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {t("لم تحفظ أي مقالات بعد", "You haven't saved any articles yet")}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SavedArticlesPage;
