import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CommentSection from "@/components/CommentSection";
import SocialShareButtons from "@/components/SocialShareButtons";
import SEOHead from "@/components/SEOHead";
import SaveArticleButton from "@/components/SaveArticleButton";
import BreakingTicker from "@/components/BreakingTicker";
import {
  Clock, Eye, Calendar, User, ArrowLeft, Flame, Share2,
  BookOpen, ChevronUp, Facebook, Twitter, Link as LinkIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Article {
  id: string; title: string; slug: string; content: string;
  excerpt: string | null; featured_image: string | null;
  published_at: string | null; custom_author_name: string | null;
  views: number; category_id: string | null;
  is_featured: boolean | null; is_breaking: boolean | null;
  meta_title: string | null; meta_description: string | null;
  tags?: { id: string; name_ar: string; slug: string }[];
}

interface Category { id: string; name_ar: string; name_en: string; slug: string; }

const readingTime = (html: string) => {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

const formatDate = (date: string | null) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ar-EG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
};

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [breaking, setBreaking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight;
      const scrolled = Math.max(0, -rect.top);
      setReadProgress(Math.min(100, Math.round((scrolled / total) * 100)));
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    const { data, error } = await supabase
      .from("articles")
      .select(`
        *,
        article_tags (
          tags ( id, name_ar, slug )
        )
      `)
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) { setNotFound(true); setLoading(false); return; }

    // Increment views
    supabase.from("articles").update({ views: (data.views || 0) + 1 }).eq("id", data.id);

    const tags = (data.article_tags || []).map((at: any) => at.tags).filter(Boolean);
    setArticle({ ...data, tags });

    // Load category
    if (data.category_id) {
      const { data: cat } = await supabase.from("categories").select("*").eq("id", data.category_id).single();
      setCategory(cat);

      // Related articles
      const { data: rel } = await supabase
        .from("articles")
        .select("id,title,slug,featured_image,published_at,views,category_id")
        .eq("status", "published")
        .eq("category_id", data.category_id)
        .neq("id", data.id)
        .order("published_at", { ascending: false })
        .limit(4);
      setRelated(rel || []);
    }

    // Breaking news for ticker
    const { data: brk } = await supabase.from("breaking_news").select("title,slug").eq("is_active", true).limit(5);
    setBreaking(brk || []);

    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t("تم نسخ الرابط!", "Link copied!"));
    setShowShareMenu(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-3/4" />
        <div className="h-6 bg-muted rounded-xl w-1/2" />
        <div className="aspect-[16/9] bg-muted rounded-3xl" />
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-muted rounded-full" style={{width: `${90 - i*5}%`}} />)}
        </div>
      </div>
    </div>
  );

  if (notFound || !article) return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-black mb-2">{t("المقال غير موجود", "Article not found")}</h1>
        <p className="text-muted-foreground mb-6">{t("ربما تم حذف المقال أو تغيير رابطه", "The article may have been deleted or moved")}</p>
        <Link to="/" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">
          {t("العودة للرئيسية", "Back to home")}
        </Link>
      </div>
    </div>
  );

  const minRead = readingTime(article.content || "");

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEOHead
        title={article.meta_title || article.title}
        description={article.meta_description || article.excerpt || ""}
        image={article.featured_image || undefined}
      />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 inset-x-0 z-[100] h-1 bg-border">
        <motion.div
          className="h-full bg-primary"
          style={{ width: `${readProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Breaking ticker */}
      {breaking.length > 0 && (
        <BreakingTicker
          headlines={breaking.map(b => b.title)}
          slugs={breaking.map(b => b.slug || "")}
        />
      )}
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">{t("الرئيسية", "Home")}</Link>
          <span>›</span>
          {category && (
            <>
              <Link to={`/category/${category.slug}`} className="hover:text-primary transition-colors">
                {language === "ar" ? category.name_ar : category.name_en}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-foreground font-medium line-clamp-1">{article.title}</span>
        </nav>

        {/* Labels */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {article.is_breaking && (
            <span className="flex items-center gap-1 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full animate-pulse">
              <Flame className="w-3 h-3" /> {t("عاجل", "Breaking")}
            </span>
          )}
          {category && (
            <Link to={`/category/${category.slug}`}
              className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
              {language === "ar" ? category.name_ar : category.name_en}
            </Link>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-snug text-foreground mb-4">
          {article.title}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-base text-muted-foreground leading-relaxed mb-5 border-s-4 border-primary ps-4 italic">
            {article.excerpt}
          </p>
        )}

        {/* Meta bar */}
        <div className="flex items-center flex-wrap gap-x-5 gap-y-2 pb-5 border-b border-border mb-6 text-sm text-muted-foreground">
          {article.custom_author_name && (
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-black">
                {article.custom_author_name[0]}
              </div>
              {article.custom_author_name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(article.published_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {(article.views || 0).toLocaleString("ar-EG")} {t("مشاهدة", "views")}
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {minRead} {t("دقيقة قراءة", "min read")}
          </span>
          {/* Share + Save */}
          <div className="flex items-center gap-2 ms-auto">
            <SaveArticleButton articleId={article.id} />
            <div className="relative">
              <button onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-muted transition-colors text-xs font-bold">
                <Share2 className="w-3.5 h-3.5" /> {t("مشاركة", "Share")}
              </button>
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute start-0 top-full mt-2 bg-card border border-border rounded-2xl shadow-xl p-2 z-50 w-44 space-y-1">
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 text-sm font-medium text-blue-600 transition-colors">
                      <Facebook className="w-4 h-4" /> Facebook
                    </a>
                    <a href={`https://twitter.com/intent/tweet?url=${window.location.href}&text=${article.title}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-sm font-medium transition-colors">
                      <Twitter className="w-4 h-4" /> Twitter / X
                    </a>
                    <button onClick={copyLink}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-sm font-medium transition-colors">
                      <LinkIcon className="w-4 h-4" /> {t("نسخ الرابط", "Copy link")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        {article.featured_image && (
          <figure className="mb-8 -mx-4 sm:mx-0">
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full sm:rounded-3xl object-cover max-h-[520px] shadow-lg"
              onError={e => (e.target as HTMLImageElement).style.display = "none"}
            />
          </figure>
        )}

        {/* Article Content */}
        <div ref={contentRef}
          className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:font-black prose-headings:text-foreground
            prose-p:text-foreground/90 prose-p:leading-8 prose-p:text-base
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-2xl prose-img:shadow-md
            prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-xl prose-blockquote:py-1
            prose-code:bg-muted prose-code:rounded-lg prose-code:px-1.5
            text-right"
          dangerouslySetInnerHTML={{ __html: article.content || "" }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-sm font-bold text-muted-foreground mb-3">{t("الوسوم", "Tags")}</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link key={tag.id} to={`/tag/${tag.slug}`}
                  className="bg-muted hover:bg-primary hover:text-white text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-full transition-all">
                  #{tag.name_ar}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author card */}
        {article.custom_author_name && (
          <div className="mt-8 bg-card border border-border rounded-3xl p-5 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black text-xl shrink-0">
              {article.custom_author_name[0]}
            </div>
            <div>
              <div className="font-black text-base">{article.custom_author_name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t("محرر في الشارع المصري", "Editor at EgStreet News")}</div>
            </div>
          </div>
        )}

        {/* Share footer */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm font-bold mb-3 text-center text-muted-foreground">{t("شارك هذا المقال", "Share this article")}</p>
          <SocialShareButtons url={window.location.href} title={article.title} />
        </div>

        {/* Comments */}
        <div className="mt-10">
          <CommentSection articleId={article.id} />
        </div>
      </article>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="border-t border-border bg-muted/30 py-10" dir="rtl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="font-black text-xl mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              {t("مقالات ذات صلة", "Related Articles")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.slice(0, 4).map(r => (
                <Link key={r.id} to={`/article/${r.slug}`}
                  className="flex items-start gap-3 bg-card border border-border rounded-2xl p-3 hover:shadow-md transition-shadow group">
                  {r.featured_image && (
                    <img src={r.featured_image} alt={r.title}
                      className="w-24 h-16 object-cover rounded-xl shrink-0 group-hover:scale-105 transition-transform" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">{r.title}</h3>
                    <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                      <Eye className="w-3 h-3" />{(r.views||0).toLocaleString("ar-EG")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 end-6 w-11 h-11 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center z-50 hover:bg-primary/90 transition-colors">
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default ArticlePage;
