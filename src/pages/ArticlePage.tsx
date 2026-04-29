import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SocialShareButtons from "@/components/SocialShareButtons";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import {
  Clock, Eye, Calendar, User, BookOpen,
  Flame, ChevronLeft, ArrowUp, Bookmark, BookmarkCheck,
  LayoutList, Hash, AlignRight, Printer
} from "lucide-react";

interface Article {
  id:string; title:string; slug:string; content:string|null; excerpt:string|null;
  featured_image:string|null; published_at:string|null; views:number|null;
  custom_author_name:string|null; category_id:string|null;
  meta_title:string|null; meta_description:string|null;
  author_id:string|null; article_number:number|null;
}
interface Category { id:string; name_ar:string; slug:string; color?:string; }

const timeAgo = (d:string|null) => {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff/60000);
  if (m<1) return "الآن";
  if (m<60) return `منذ ${m} دقيقة`;
  const hr = Math.floor(m/60);
  if (hr<24) return `منذ ${hr} ساعة`;
  const days = Math.floor(hr/24);
  if (days<7) return `منذ ${days} يوم`;
  return new Date(d).toLocaleDateString("ar-EG",{day:"numeric",month:"long",year:"numeric"});
};
const readTime = (t:string) => Math.max(1, Math.ceil(t.replace(/<[^>]+>/g,"").split(/\s+/).filter(Boolean).length/200));

export default function ArticlePage() {
  const { slug, articleNumber } = useParams<{slug?:string; articleNumber?:string}>();
  const navigate = useNavigate();
  const [article,   setArticle]   = useState<Article|null>(null);
  const [category,  setCategory]  = useState<Category|null>(null);
  const [author,    setAuthor]    = useState<string>("");
  const [related,   setRelated]   = useState<Article[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [readPct,   setReadPct]   = useState(0);
  const [saved,     setSaved]     = useState(false);
  const [showToc,   setShowToc]   = useState(false);
  const [headings,  setHeadings]  = useState<{id:string; text:string; level:number}[]>([]);
  const articleRef = useRef<HTMLDivElement>(null);
  const topRef     = useRef<HTMLDivElement>(null);

  // Reading progress bar
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
    const fetch = async () => {
      setLoading(true);
      let q = supabase.from("articles").select("*");
      if (slug)          q = q.eq("slug", slug);
      else if (articleNumber) q = q.eq("article_number", parseInt(articleNumber));
      const { data } = await q.maybeSingle();
      if (!data) { navigate("/404"); return; }
      setArticle(data);
      // Increment views
      await supabase.from("articles").update({ views: (data.views||0)+1 }).eq("id", data.id);
      // Track in daily_views
      await supabase.from("daily_views").insert({ article_id: data.id }).catch(()=>{});

      if (data.category_id) {
        const { data: cat } = await supabase.from("categories").select("*").eq("id", data.category_id).maybeSingle();
        if (cat) setCategory(cat);
      }
      if (data.custom_author_name) {
        setAuthor(data.custom_author_name);
      } else if (data.author_id) {
        const { data: prof } = await supabase.from("profiles").select("display_name").eq("id", data.author_id).maybeSingle();
        setAuthor(prof?.display_name || "");
      }
      if (data.category_id) {
        const { data: rel } = await supabase.from("articles")
          .select("id,title,slug,featured_image,published_at,views")
          .eq("category_id", data.category_id).eq("status","published")
          .neq("id", data.id).limit(5).order("published_at", { ascending:false });
        setRelated(rel||[]);
      }
      setLoading(false);
    };
    fetch();
  }, [slug, articleNumber]);

  // Extract headings from HTML content
  useEffect(() => {
    if (!article?.content) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(article.content, "text/html");
    const els = doc.querySelectorAll("h2, h3");
    const toc = Array.from(els).map((el, i) => ({
      id: `heading-${i}`,
      text: el.textContent || "",
      level: parseInt(el.tagName[1]),
    }));
    setHeadings(toc);
  }, [article?.content]);

  // Inject IDs into headings in the rendered content
  const processedContent = () => {
    if (!article?.content) return "";
    let i = 0;
    return article.content.replace(/<(h[23])[^>]*>/g, (match, tag) => {
      return `<${tag} id="heading-${i++}">`;
    });
  };

  const scrollToTop = () => topRef.current?.scrollIntoView({ behavior:"smooth" });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-2xl px-4">
        <div className="h-8 bg-muted rounded-xl animate-pulse"/>
        <div className="h-64 bg-muted rounded-2xl animate-pulse"/>
        <div className="space-y-2">
          {[...Array(6)].map((_,i)=><div key={i} className={`h-4 bg-muted rounded animate-pulse`} style={{width:`${90-i*5}%`}}/>)}
        </div>
      </div>
    </div>
  );
  if (!article) return null;

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const rt = article.content ? readTime(article.content) : 1;

  return (
    <div className="min-h-screen bg-background" dir="rtl" ref={topRef}>
      <SEOHead
        title={article.meta_title || article.title}
        description={article.meta_description || article.excerpt || ""}
        image={article.featured_image || ""}
        url={pageUrl}
        type="article"
      />
      <Header/>

      {/* ── Reading Progress Bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-violet-500 to-primary origin-left"
          style={{ scaleX: readPct / 100 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: readPct / 100 }}
          transition={{ duration: 0.1 }}
        />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">

          {/* ─── Main column ─── */}
          <article className="min-w-0">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
              <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
              <ChevronLeft className="w-3 h-3"/>
              {category && (
                <>
                  <Link to={`/category/${category.slug}`} className="hover:text-primary transition-colors">
                    {category.name_ar}
                  </Link>
                  <ChevronLeft className="w-3 h-3"/>
                </>
              )}
              <span className="text-foreground font-bold truncate max-w-[200px]">{article.title.slice(0,40)}…</span>
            </nav>

            {/* Category badge */}
            {category && (
              <Link to={`/category/${category.slug}`}
                className="inline-flex items-center gap-1 bg-primary text-white text-xs font-black px-3 py-1.5 rounded-full mb-4 hover:bg-primary/85 transition-colors">
                <Hash className="w-3 h-3"/>{category.name_ar}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black leading-tight text-foreground mb-4"
              style={{fontFamily:"'Noto Kufi Arabic', 'Cairo', sans-serif", lineHeight:"1.6"}}>
              {article.title}
            </h1>

            {/* Meta bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-5 pb-4 border-b border-border">
              {author && (
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                    <User className="w-3 h-3 text-primary"/>
                  </div>
                  <span className="font-bold text-foreground">{author}</span>
                </div>
              )}
              {article.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3"/>
                  {new Date(article.published_at).toLocaleDateString("ar-EG",{day:"numeric",month:"long",year:"numeric"})}
                </span>
              )}
              {article.published_at && (
                <span className="flex items-center gap-1 text-muted-foreground/70">
                  <Clock className="w-3 h-3"/>
                  {timeAgo(article.published_at)}
                </span>
              )}
              {article.views != null && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3"/>
                  {article.views.toLocaleString("ar-EG")} مشاهدة
                </span>
              )}
              <span className="flex items-center gap-1 mr-auto">
                <BookOpen className="w-3 h-3"/>
                <span className="font-bold">{rt}</span> دقيقة للقراءة
              </span>
            </div>

            {/* Featured Image */}
            {article.featured_image && (
              <figure className="mb-6 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="w-full max-h-[480px] object-cover"
                />
              </figure>
            )}

            {/* Excerpt (lead) */}
            {article.excerpt && (
              <p className="text-base sm:text-lg text-foreground/80 font-medium leading-relaxed mb-6 pr-4 border-r-4 border-primary bg-primary/5 py-3 rounded-l-xl"
                style={{fontFamily:"'Noto Kufi Arabic', 'Cairo', sans-serif"}}>
                {article.excerpt}
              </p>
            )}

            {/* Article body */}
            <div
              ref={articleRef}
              className="article-body prose-custom"
              dangerouslySetInnerHTML={{ __html: processedContent() }}
            />

            {/* Share + Actions */}
            <div className="mt-10 pt-6 border-t border-border space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <SocialShareButtons url={pageUrl} title={article.title}/>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSaved(s=>!s)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all ${saved?"bg-amber-500 text-white border-amber-500":"border-border hover:bg-muted"}`}>
                    {saved ? <BookmarkCheck className="w-4 h-4"/> : <Bookmark className="w-4 h-4"/>}
                    {saved ? "تم الحفظ" : "حفظ"}
                  </button>
                  <button onClick={() => window.print()}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors">
                    <Printer className="w-4 h-4"/> طباعة
                  </button>
                </div>
              </div>

              {/* Tags */}
              {category && (
                <div className="flex flex-wrap gap-2">
                  <Link to={`/category/${category.slug}`}
                    className="px-3 py-1 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary text-xs font-bold transition-colors">
                    #{category.name_ar}
                  </Link>
                </div>
              )}
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <section className="mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-4 h-4 text-red-500"/>
                  <h2 className="font-black text-sm">أخبار ذات صلة</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {related.map(rel => (
                    <Link key={rel.id} to={`/article/${rel.slug}`}
                      className="group flex gap-3 p-3 border border-border rounded-2xl hover:border-primary/40 hover:bg-muted/30 transition-all">
                      {rel.featured_image
                        ? <img src={rel.featured_image} alt={rel.title}
                            className="w-20 h-14 object-cover rounded-xl shrink-0 group-hover:scale-105 transition-transform"/>
                        : <div className="w-20 h-14 rounded-xl bg-muted shrink-0 flex items-center justify-center">
                            <AlignRight className="w-4 h-4 text-muted-foreground"/>
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold line-clamp-2 group-hover:text-primary transition-colors leading-snug">{rel.title}</h3>
                        <span className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5"/>{timeAgo(rel.published_at)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* ─── Sidebar ─── */}
          <aside className="hidden lg:block space-y-4 sticky-sidebar">
            {/* TOC */}
            {headings.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-black text-xs flex items-center gap-2">
                    <LayoutList className="w-3.5 h-3.5 text-primary"/> محتويات المقال
                  </h4>
                </div>
                <nav className="space-y-1">
                  {headings.map(h => (
                    <a key={h.id} href={`#${h.id}`}
                      className={`block text-xs hover:text-primary transition-colors py-1 leading-snug ${h.level===3?"pr-3 text-muted-foreground/70":"font-bold text-muted-foreground"}`}>
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Reading progress */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-black mb-2 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-primary"/> تقدم القراءة
              </p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full"
                  animate={{ width: `${readPct}%` }} transition={{ duration: 0.3 }}/>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-left">{readPct}%</p>
            </div>

            {/* Related mini */}
            {related.slice(0,3).length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <h4 className="font-black text-xs mb-3 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-red-500"/> مقالات ذات صلة
                </h4>
                <div className="space-y-3">
                  {related.slice(0,3).map(r => (
                    <Link key={r.id} to={`/article/${r.slug}`}
                      className="flex gap-2 group hover:bg-muted/30 rounded-xl p-1.5 -mx-1.5 transition-colors">
                      {r.featured_image
                        ? <img src={r.featured_image} alt="" className="w-12 h-10 object-cover rounded-lg shrink-0"/>
                        : <div className="w-12 h-10 rounded-lg bg-muted shrink-0"/>}
                      <p className="text-[11px] font-bold line-clamp-2 group-hover:text-primary transition-colors leading-snug">{r.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Back to top */}
      {readPct > 20 && (
        <motion.button
          initial={{ opacity:0, scale:0.8 }}
          animate={{ opacity:1, scale:1 }}
          exit={{ opacity:0 }}
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 w-10 h-10 bg-primary text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-primary/85 transition-colors z-40">
          <ArrowUp className="w-4 h-4"/>
        </motion.button>
      )}

      <Footer/>
    </div>
  );
}
