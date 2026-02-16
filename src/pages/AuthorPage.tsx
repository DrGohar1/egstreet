import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ArticleCard from "@/components/ArticleCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, FileText } from "lucide-react";

const AuthorPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [profRes, artRes, catRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId!).maybeSingle(),
        supabase.from("articles").select("*").eq("author_id", userId!).eq("status", "published").order("published_at", { ascending: false }),
        supabase.from("categories").select("*"),
      ]);
      setProfile(profRes.data);
      setArticles(artRes.data || []);
      setCategories(catRes.data || []);
      setLoading(false);
    };
    if (userId) fetchData();
  }, [userId]);

  const getCategoryName = (catId: string | null) => {
    if (!catId) return undefined;
    const cat = categories.find((c: any) => c.id === catId);
    return cat ? (language === "ar" ? cat.name_ar : cat.name_en) : undefined;
  };

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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("الكاتب غير موجود", "Author Not Found")}</h2>
          <Link to="/" className="text-primary hover:underline">{t("العودة للرئيسية", "Back to Home")}</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={profile.display_name} description={profile.bio || profile.display_name} />
      <Header />
      <main className="container py-8">
        {/* Author Header */}
        <div className="flex items-center gap-4 mb-8 p-6 rounded-lg bg-card border border-border">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {profile.display_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {profile.display_name}
            </h1>
            {profile.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <FileText className="w-3 h-3" />
              {articles.length} {t("مقال", "articles")}
            </div>
          </div>
        </div>

        {/* Articles */}
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
          <p className="text-center py-12 text-muted-foreground">{t("لا توجد مقالات", "No articles yet")}</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AuthorPage;
