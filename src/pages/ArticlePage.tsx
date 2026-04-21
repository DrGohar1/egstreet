import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import CommentSection from "@/components/CommentSection";
import { Clock, ArrowRight, Eye, Bookmark, BookmarkCheck } from "lucide-react";
import MostReadWidget from "@/components/MostReadWidget";
import SocialShareButtons from "@/components/SocialShareButtons";

interface Article {
  id: string; title: string; slug: string; content: string | null;
  excerpt: string | null; featured_image: string | null;
  published_at: string | null; category_id: string | null;
  author_id: string | null; custom_author_name: string | null;
  views_count?: number;
}
interface Category { id: string; name_ar: string; name_en: string; slug: string; }

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [articleCategories, setArticleCategories] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      if (total > 0) setReadProgress(Math.round((scrolled / total) * 100));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [artRes, catRes] = await Promise.all([
        supabase.from("articles").select("*").eq("slug", slug!).eq("status", "published").maybeSingle(),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (artRes.data) {
        const artData = artRes.data as Article;
        setArticle(artData);
        if (artData.custom_author_name) {
          setAuthorName(artData.custom_author_name);
        } else if (artData.author_id) {
          const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", artData.author_id).maybeSingle();
          setAuthorName(profile?.display_name || "");
        }
        supabase.rpc("increment_article_views", { article_id: artData.id });
        supabase.rpc("track_daily_view", { p_article_id: artData.id });
        const { data: acData } = await supabase.from("article_categories").select("category_id").eq("article_id", artData.id);
        const catIds = acData?.map((r: any) => r.category_id) || [];
        setArticleCategories(catIds.length > 0 ? catIds : artData.category_id ? [artData.category_id] : []);
        const { data: related } = await supabase.from("articles").select("*").eq("status", "published").neq("id", artData.id).limit(5);
        if (related) setRelatedArticles(related as Article[]);
      }
      setLoading(false);
    };
    if (slug) fetchData();
  }, [slug]);

  const getCatName = (id: string | null) => {
    const cat = categories.find(c => c.id === id);
    return cat ? (language === "ar" ? cat.name_ar : cat.name_en) : "";
  };
  const getCatSlug = (id: string | null) => categories.find(c => c.id === id)?.slug || "";
  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-4xl mx-auto space-y-4">
        <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-8 bg-muted rounded w-full animate-pulse" />
        <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
        {[1,2,3,4].map(i => <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{width:`${95-i*5}%`}} />)}
      </div>
    </div>
  );

  if (!article) return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryNav categories={categories} />
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">{t("المقال غير موجود", "Article Not Found")}</h2>
        <Link to="/" className="text-primary hover:underline">{t("العودة للرئيسية", "Back to Home")}</Link>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background content-protected">
      <SEOHead title={article.title} description={article.excerpt || article.title} image={article.featured_image || undefined} />

      {/* Reading progress */}
      <div className="fixed top-0 start-0 h-0.5 bg-primary z-[9999] transition-all duration-150" style={{ width: `${readProgress}%` }} />

      <Header />
      <CategoryNav categories={categories} activeSlug={articleCategories.length > 0 ? getCatSlug(articleCategories[0]) : ""} />

      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <article className="lg:col-span-2">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4 flex-wrap">
              <Link to="/" className="hover:text-primary">{t("الرئيسية", "Home")}</Link>
              <ArrowRight className="w-3 h-3 rtl:rotate-180 shrink-0" />
              {articleCategories[0] && <>
                <Link to={`/category/${getCatSlug(articleCategories[0])}`} className="hover:text-primary">{getCatName(articleCategories[0])}</Link>
                <ArrowRight className="w-3 h-3 rtl:rotate-180 shrink-0" />
              </>}
              <span className="text-foreground line-clamp-1">{article.title}</span>
            </nav>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap mb-3">
              {articleCategories.map(id => (
                <Link key={id} to={`/category/${getCatSlug(id)}`} className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded hover:bg-primary/80 transition-colors">
                  {getCatName(id)}
                </Link>
              ))}
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground leading-tight mb-4">{article.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-5 pb-4 border-b border-border">
              <div className="flex items-center gap-3 flex-wrap flex-1">
                {authorName && <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded text-xs">✍️ {authorName}</span>}
                <span className="flex items-center gap-1 text-xs"><Clock className="w-3.5 h-3.5" />{formatDate(article.published_at)}</span>
                {article.views_count ? <span className="flex items-center gap-1 text-xs"><Eye className="w-3.5 h-3.5" />{article.views_count.toLocaleString("ar-EG")}</span> : null}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSaved(s => !s)} className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors">
                  {saved ? <BookmarkCheck className="w-3.5 h-3.5 text-primary" /> : <Bookmark className="w-3.5 h-3.5" />}
                </button>
                <SocialShareButtons articleTitle={article.title} articleSlug={article.slug} articleExcerpt={article.excerpt || ""} articleId={article.id} />
              </div>
            </div>

            {/* Image */}
            {article.featured_image && (
              <figure className="mb-6 rounded-xl overflow-hidden shadow-md">
                <img src={article.featured_image} alt={article.title} className="w-full h-auto object-cover image-protected" loading="lazy" />
              </figure>
            )}

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-lg font-semibold text-foreground/90 mb-6 leading-relaxed border-s-4 border-primary ps-4 bg-primary/5 py-3 rounded-e-lg">
                {article.excerpt}
              </p>
            )}

            {/* Body */}
            <div
              className="prose prose-lg max-w-none text-foreground/90 leading-loose prose-headings:font-black prose-headings:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: article.content || "" }}
            />

            {/* Category tags */}
            <div className="mt-8 pt-6 border-t border-border flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-bold">{t("الأقسام:", "Sections:")}</span>
              {articleCategories.map(id => (
                <Link key={id} to={`/category/${getCatSlug(id)}`} className="text-xs px-3 py-1 rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                  {getCatName(id)}
                </Link>
              ))}
            </div>

            {/* Share footer */}
            <div className="mt-6 p-4 bg-muted/50 rounded-xl flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm font-bold text-foreground">{t("شارك المقال", "Share article")}</p>
              <SocialShareButtons articleTitle={article.title} articleSlug={article.slug} articleExcerpt={article.excerpt || ""} articleId={article.id} />
            </div>

            <CommentSection articleId={article.id} />
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-base font-black text-foreground border-b-2 border-primary pb-2 mb-3">{t("أخبار ذات صلة", "Related News")}</h3>
              <div className="divide-y divide-border">
                {relatedArticles.map(a => (
                  <Link key={a.id} to={`/article/${a.slug}`} className="group flex gap-3 py-3 first:pt-0 last:pb-0">
                    {a.featured_image && (
                      <div className="w-20 h-14 shrink-0 rounded-lg overflow-hidden bg-muted">
                        <img src={a.featured_image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{a.title}</h4>
                      {a.published_at && (
                        <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{new Date(a.published_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <MostReadWidget />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArticlePage;
