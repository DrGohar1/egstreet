import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ArticleCard from "@/components/ArticleCard";
import { Bookmark, LogIn } from "lucide-react";

interface SavedArticle {
  id: string; title: string; slug: string; excerpt: string | null;
  featured_image: string | null; published_at: string | null; category_id: string | null;
}

const SavedArticlesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [articles,   setArticles]   = useState<SavedArticle[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data: saved } = await supabase.from("saved_articles")
        .select("article_id").eq("user_id", user.id).order("saved_at", { ascending: false });
      if (saved?.length) {
        const ids = saved.map((s: any) => s.article_id);
        const { data: arts } = await supabase.from("articles")
          .select("*").in("id", ids).eq("status", "published");
        if (arts) setArticles(arts);
      }
      const { data: cats } = await supabase.from("categories").select("*");
      if (cats) setCategories(cats);
      setLoading(false);
    })();
  }, [user]);

  const getCatName = (catId: string | null) => {
    if (!catId) return undefined;
    return categories.find(c => c.id === catId)?.name_ar;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <SEOHead title="المقالات المحفوظة" description="المقالات التي حفظتها للقراءة لاحقاً"/>
      <Header/>
      <main className="flex-1 container py-8">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-7 h-7 text-primary"/>
          <h1 className="text-2xl font-black">المقالات المحفوظة</h1>
        </div>

        {authLoading || loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : !user ? (
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4"/>
            <h2 className="text-xl font-bold mb-2">سجّل دخولك لتعرض محفوظاتك</h2>
            <p className="text-muted-foreground mb-6">المقالات المحفوظة متاحة للأعضاء المسجلين فقط</p>
            <Link to="/G63-admin/login"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/85 transition-colors shadow-md">
              <LogIn className="w-4 h-4"/>
              تسجيل الدخول
            </Link>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4"/>
            <h2 className="text-xl font-bold mb-2">لا توجد مقالات محفوظة</h2>
            <p className="text-muted-foreground mb-6">احفظ مقالاتك المفضلة لتجدها هنا</p>
            <Link to="/" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary/85 transition-colors">
              تصفح الأخبار
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(a => (
              <ArticleCard key={a.id} article={a} categoryName={getCatName(a.category_id)}/>
            ))}
          </div>
        )}
      </main>
      <Footer/>
    </div>
  );
};

export default SavedArticlesPage;
