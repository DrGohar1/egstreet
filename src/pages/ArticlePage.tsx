import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Clock, ArrowRight, Share2, Facebook, Twitter } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  category_id: string | null;
  author_id: string | null;
}

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const [articleCategories, setArticleCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [artRes, catRes] = await Promise.all([
        supabase.from("articles").select("*").eq("slug", slug!).eq("status", "published").maybeSingle(),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (artRes.data) {
        setArticle(artRes.data);
        // Fetch article categories from junction table
        const { data: acData } = await supabase
          .from("article_categories")
          .select("category_id")
          .eq("article_id", artRes.data.id);
        const catIds = acData?.map((r: { category_id: string }) => r.category_id) || [];
        setArticleCategories(catIds.length > 0 ? catIds : (artRes.data.category_id ? [artRes.data.category_id] : []));
        // Fetch related
        const { data: related } = await supabase
          .from("articles")
          .select("*")
          .eq("status", "published")
          .neq("id", artRes.data.id)
          .limit(5);
        if (related) setRelatedArticles(related);
      }
      setLoading(false);
    };
    if (slug) fetchData();
  }, [slug]);

  const getCategoryName = (catId: string | null) => {
    if (!catId) return "";
    const cat = categories.find((c) => c.id === catId);
    return cat ? (language === "ar" ? cat.name_ar : cat.name_en) : "";
  };

  const getCategorySlug = (catId: string | null) => {
    if (!catId) return "";
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.slug : "";
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

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

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <CategoryNav categories={categories} />
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("المقال غير موجود", "Article Not Found")}</h2>
          <Link to="/" className="text-primary hover:underline">{t("العودة للرئيسية", "Back to Home")}</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background content-protected">
      <SEOHead title={article.title} description={article.excerpt || article.title} />
      <Header />
      <CategoryNav categories={categories} activeSlug={articleCategories.length > 0 ? getCategorySlug(articleCategories[0]) : ""} />

      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article Content */}
          <article className="lg:col-span-2">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <Link to="/" className="hover:text-primary">{t("الرئيسية", "Home")}</Link>
              <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              {articleCategories.length > 0 && (
                <>
                  <Link to={`/category/${getCategorySlug(articleCategories[0])}`} className="hover:text-primary">
                    {getCategoryName(articleCategories[0])}
                  </Link>
                  <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </>
              )}
              <span className="text-foreground line-clamp-1">{article.title}</span>
            </nav>

            {/* Category Badges */}
            <div className="flex gap-2 flex-wrap mb-3">
              {articleCategories.map((catId) => (
                <Link key={catId} to={`/category/${getCategorySlug(catId)}`}
                  className="inline-block bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded">
                  {getCategoryName(catId)}
                </Link>
              ))}
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground leading-tight mb-4">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-4 border-b border-border">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(article.published_at)}
              </span>
              <div className="flex items-center gap-2 ms-auto">
                <button className="p-2 rounded-full hover:bg-muted transition-colors"><Share2 className="w-4 h-4" /></button>
                <button className="p-2 rounded-full hover:bg-muted transition-colors text-[#1877f2]"><Facebook className="w-4 h-4" /></button>
                <button className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"><Twitter className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Featured Image */}
            {article.featured_image && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img src={article.featured_image} alt={article.title} className="w-full h-auto object-cover image-protected" />
              </div>
            )}

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-lg font-semibold text-foreground/90 mb-6 leading-relaxed border-r-4 border-primary pr-4 rtl:border-r-0 rtl:border-l-4 rtl:pl-4 rtl:pr-0">
                {article.excerpt}
              </p>
            )}

            {/* Content */}
            <div
              className="prose prose-lg max-w-none text-foreground/90 leading-loose"
              dangerouslySetInnerHTML={{ __html: article.content || "" }}
            />
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-lg font-bold text-foreground border-b-2 border-primary pb-2 mb-3">
                {t("أخبار ذات صلة", "Related News")}
              </h3>
              <div className="space-y-0">
                {relatedArticles.map((a) => (
                  <Link key={a.id} to={`/article/${a.slug}`}
                    className="group flex gap-3 py-3 border-b border-border last:border-0">
                    {a.featured_image && (
                      <div className="w-20 h-16 shrink-0 rounded overflow-hidden bg-muted">
                        <img src={a.featured_image} alt={a.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{a.title}</h4>
                      {a.published_at && (
                        <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(a.published_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArticlePage;
