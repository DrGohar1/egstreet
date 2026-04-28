import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SocialShareButtons from "@/components/SocialShareButtons";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import {
  Clock, Eye, Calendar, User, ArrowRight, BookOpen,
  Flame, ChevronLeft, Copy, Check, Facebook, Twitter, Share2
} from "lucide-react";

interface Article {
  id:string; title:string; slug:string; content:string|null; excerpt:string|null;
  featured_image:string|null; featured_image_position?:string|null;
  published_at:string|null; views:number|null;
  custom_author_name:string|null; category_id:string|null; meta_title:string|null;
  meta_description:string|null; author_id:string|null; article_number:number|null;
}
interface Category { id:string; name_ar:string; slug:string; }

const timeAgo = (d:string|null) => {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff/60000);
  if (m<1) return "الآن";
  if (m<60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m/60);
  if (h<24) return `منذ ${h} ساعة`;
  return new Date(d).toLocaleDateString("ar-EG",{day:"numeric",month:"long",year:"numeric"});
};
const readTime = (t:string) => Math.max(1, Math.ceil(t.split(/\s+/).length/200));

export default function ArticlePage() {
  const { slug, categorySlug, articleNumber } = useParams<{slug?:string; categorySlug?:string; articleNumber?:string}>();
  const navigate = useNavigate();
  const [article,  setArticle]  = useState<Article|null>(null);
  const [category, setCategory] = useState<Category|null>(null);
  const [author,   setAuthor]   = useState<string>("");
  const [related,  setRelated]  = useState<Article[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [copied,   setCopied]   = useState(false);
  const [readPct,  setReadPct]  = useState(0);
  const articleRef = useRef<HTMLDivElement>(null);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  // Reading progress
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((window.innerHeight - top) / height) * 100));
      setReadPct(Math.round(pct));
    };
    window.addEventListener("scroll", onScroll, { passive:true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      let q = supabase.from("articles").select("*");
      if (slug)          q = q.eq("slug", slug);
      else if (articleNumber) q = q.eq("article_number", parseInt(articleNumber));
      const { data } = await q.maybeSingle();
      if (!data) { navigate("/404"); return; }
      setArticle(data);

      // Increment views
      await supabase.from("articles").update({ views: (data.views||0)+1 }).eq("id", data.id);

      // Category
      if (data.category_id) {
        const { data: cat } = await supabase.from("categories").select("*").eq("id", data.category_id).maybeSingle();
        if (cat) setCategory(cat);
      }

      // Author
      if (data.custom_author_name) {
        setAuthor(data.custom_author_name);
      } else if (data.author_id) {
        const { data: prof } = await supabase.from("profiles").select("display_name").eq("user_id", data.author_id).maybeSingle();
        setAuthor(prof?.display_name || "");
      }

      // Related
      if (data.category_id) {
        const { data: rel } = await supabase.from("articles")
          .select("id,title,slug,featured_image,published_at")
          .eq("category_id", data.category_id).eq("status","published")
          .neq("id", data.id).limit(4).order("published_at", { ascending:false });
        setRelated(rel || []);
      }
      setLoading(false);
    };
    fetchArticle();
  }, [slug, articleNumber]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, "_blank");
  const shareOnTwitter  = () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(article?.title||"")}`, "_blank");
  const shareOnWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent((article?.title||"")+" "+pageUrl)}`, "_blank");

  if (loading) return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header/>
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded-xl w-3/4"/>
        <div className="h-4 bg-muted rounded w-1/2"/>
        <div className="h-64 bg-muted rounded-2xl"/>
        <div className="space-y-3">{[...Array(6)].map((_,i)=><div key={i} className="h-4 bg-muted rounded"/>)}</div>
      </div>
    </div>
  );

  if (!article) return null;

  const imgPos = article.featured_image_position || "center";
  const desc = article.meta_description || article.excerpt || "";
  const keywords = [category?.name_ar, "أخبار مصر", "الشارع المصري"].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEOHead
        title={article.meta_title || article.title}
        description={desc}
        image={article.featured_image || undefined}
        url={pageUrl}
        type="article"
        publishedAt={article.published_at || undefined}
        authorName={author || undefined}
        categoryName={category?.name_ar}
        keywords={keywords}
      />

      {/* Reading progress bar */}
      <div className="fixed top-0 right-0 left-0 z-50 h-0.5 bg-transparent">
        <div className="h-full bg-primary transition-all duration-150" style={{width:`${readPct}%`}}/>
      </div>

      <Header/>

      {/* ══ Featured Image (Facebook-cover style) ══ */}
      {article.featured_image && (
        <div className="w-full bg-black overflow-hidden" style={{maxHeight:"56vh",aspectRatio:"16/9"}}>
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full"
            style={{objectFit:"cover", objectPosition: imgPos, display:"block"}}
          />
        </div>
      )}

      {/* ══ Article Container ══ */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

        {/* Breadcrumb */}
        {category && (
          <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3">
            <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
            <ChevronLeft className="w-3 h-3"/>
            <Link to={`/category/${category.slug}`} className="hover:text-primary transition-colors">{category.name_ar}</Link>
          </nav>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black leading-tight text-foreground mb-3"
          style={{fontFamily:"'Noto Kufi Arabic', 'Cairo', sans-serif", lineHeight:"1.4"}}>
          {article.title}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-4 pb-4 border-b border-border/50">
          {author && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5"/>
              <span className="font-bold text-foreground">{author}</span>
            </span>
          )}
          {article.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5"/>
              {new Date(article.published_at).toLocaleDateString("ar-EG",{day:"numeric",month:"long",year:"numeric"})}
            </span>
          )}
          {article.published_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5"/>
              {timeAgo(article.published_at)}
            </span>
          )}
          {article.views != null && (
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5"/>
              {article.views.toLocaleString("ar-EG")} مشاهدة
            </span>
          )}
          {article.content && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5"/>
              {readTime(article.content)} دقيقة للقراءة
            </span>
          )}
        </div>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-base text-muted-foreground font-medium leading-relaxed mb-5 pr-3 border-r-2 border-primary/60"
            style={{fontFamily:"'Noto Kufi Arabic', 'Cairo', sans-serif"}}>
            {article.excerpt}
          </p>
        )}

        {/* ══ Article Content ══ */}
        <div
          ref={articleRef}
          className="article-body text-base text-foreground leading-[1.9] space-y-1"
          style={{fontFamily:"'Noto Kufi Arabic', 'Cairo', sans-serif"}}
          dangerouslySetInnerHTML={{ __html: article.content || "" }}
        />

        {/* ══ Share Bar ══ */}
        <div className="mt-8 pt-5 border-t border-border flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Share2 className="w-4 h-4"/> شارك:
          </span>
          <button onClick={shareOnFacebook}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1877F2] text-white text-xs font-bold hover:opacity-85 transition-opacity">
            <Facebook className="w-3.5 h-3.5"/> فيسبوك
          </button>
          <button onClick={shareOnTwitter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:opacity-85 transition-opacity">
            <Twitter className="w-3.5 h-3.5"/> X
          </button>
          <button onClick={shareOnWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:opacity-85 transition-opacity">
            واتساب
          </button>
          <button onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors ml-auto">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500"/> : <Copy className="w-3.5 h-3.5"/>}
            {copied ? "تم النسخ" : "نسخ الرابط"}
          </button>
        </div>

        {/* Tags */}
        {category && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/category/${category.slug}`}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
              {category.name_ar}
            </Link>
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-primary"/>
              <h2 className="font-black text-sm">أخبار ذات صلة</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map(rel => (
                <Link key={rel.id} to={`/article/${rel.slug}`}
                  className="group flex gap-3 p-3 border border-border rounded-xl hover:bg-muted/40 transition-all">
                  {rel.featured_image
                    ? <img src={rel.featured_image} alt={rel.title}
                        className="w-20 h-14 object-cover rounded-lg shrink-0 group-hover:scale-105 transition-transform"/>
                    : <div className="w-20 h-14 rounded-lg bg-muted shrink-0"/>
                  }
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold line-clamp-2 group-hover:text-primary transition-colors leading-snug">{rel.title}</h3>
                    <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5"/>{timeAgo(rel.published_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer/>
    </div>
  );
}
