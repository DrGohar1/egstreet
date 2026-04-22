import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SocialShareButtons from "@/components/SocialShareButtons";
import SEOHead from "@/components/SEOHead";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Eye, Calendar, User, ArrowRight, BookOpen,
  Volume2, VolumeX, Flame, ChevronLeft
} from "lucide-react";

interface Article {
  id:string; title:string; slug:string; content:string|null; excerpt:string|null;
  featured_image:string|null; published_at:string|null; views:number|null;
  custom_author_name:string|null; category_id:string|null; meta_title:string|null;
  meta_description:string|null; author_id:string|null;
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
  const { slug } = useParams<{slug:string}>();
  const navigate  = useNavigate();
  const bodyRef   = useRef<HTMLDivElement>(null);
  const [article,   setArticle]   = useState<Article|null>(null);
  const [category,  setCategory]  = useState<Category|null>(null);
  const [related,   setRelated]   = useState<Article[]>([]);
  const [progress,  setProgress]  = useState(0);
  const [speaking,  setSpeaking]  = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(()=>{
    if (!slug) return;
    setLoading(true);
    supabase.from("articles").select("*").eq("slug",slug).eq("status","published").maybeSingle()
      .then(({data})=>{
        if (!data) { navigate("/404"); return; }
        setArticle(data as Article);
        setLoading(false);
        // increment views
        supabase.from("articles").update({ views:(data.views||0)+1 }).eq("id",data.id).then(()=>{});
        // load category
        if (data.category_id) {
          supabase.from("categories").select("id,name_ar,slug").eq("id",data.category_id).maybeSingle()
            .then(({data:c})=>setCategory(c as Category));
          // load related
          supabase.from("articles").select("id,title,slug,featured_image,published_at,views,category_id")
            .eq("status","published").eq("category_id",data.category_id).neq("id",data.id).limit(4)
            .then(({data:r})=>setRelated((r as Article[])||[]));
        }
      });
  },[slug]);

  // Reading progress
  useEffect(()=>{
    const onScroll = () => {
      const el = bodyRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const h = el.offsetHeight;
      const pct = Math.min(100, Math.max(0, (-rect.top / (h - window.innerHeight)) * 100));
      setProgress(isNaN(pct) ? 0 : pct);
    };
    window.addEventListener("scroll", onScroll, {passive:true});
    return () => window.removeEventListener("scroll", onScroll);
  },[article]);

  const toggleSpeech = () => {
    if (!article) return;
    if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return; }
    const text = (article.title + ". " + (article.content||"")).replace(/<[^>]+>/g,"");
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "ar-EG"; utt.rate = 0.9;
    const voices = speechSynthesis.getVoices().filter(v=>v.lang.startsWith("ar"));
    if (voices.length) utt.voice = voices[0];
    utt.onend = ()=>setSpeaking(false);
    speechSynthesis.speak(utt);
    setSpeaking(true);
  };

  const renderContent = (raw:string) => {
    return raw
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-black mt-8 mb-3 text-foreground leading-tight">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2 text-foreground">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
      .replace(/_(.+?)_/g, '<em class="italic">$1</em>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-r-4 border-primary pr-4 my-4 text-muted-foreground italic text-lg">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li class="mr-4 mb-1">$1</li>')
      .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc list-inside my-3 space-y-1">$&</ul>')
      .replace(/\n\n/g, '</p><p class="leading-[2] text-base md:text-lg text-foreground/90 mb-4">')
      .replace(/^/, '<p class="leading-[2] text-base md:text-lg text-foreground/90 mb-4">')
      .replace(/$/, '</p>');
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <div className="h-14 bg-card border-b"/>
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-3/4"/>
        <div className="h-64 bg-muted rounded-2xl animate-pulse"/>
        <div className="space-y-3">{[...Array(6)].map((_,i)=><div key={i} className={`h-4 bg-muted rounded animate-pulse ${i%3===2?"w-2/3":"w-full"}`}/>)}</div>
      </div>
    </div>
  );

  if (!article) return null;

  const rt = readTime(article.content||"");
  const url = `${window.location.origin}/article/${article.slug}`;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEOHead
        title={article.meta_title||article.title}
        description={article.meta_description||article.excerpt||""}
        image={article.featured_image||""}
        url={url}
      />
      <Header/>

      {/* Progress bar */}
      <div className="fixed top-14 inset-x-0 z-30 h-0.5 bg-border">
        <motion.div className="h-full bg-primary" style={{width:`${progress}%`}} transition={{ease:"linear"}}/>
      </div>

      {/* Floating share + listen */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-2">
        <SocialShareButtons title={article.title} url={url} image={article.featured_image||""} floating/>
        <button onClick={toggleSpeech}
          className={`w-10 h-10 rounded-full border border-border flex items-center justify-center shadow-sm transition-all ${speaking?"bg-primary text-white border-primary":"bg-card hover:bg-muted"}`}
          title={speaking?"إيقاف الاستماع":"استمع للخبر"}>
          {speaking ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
        </button>
      </div>

      <main className="max-w-3xl mx-auto px-4 pb-20 pt-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
          <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <ChevronLeft className="w-3 h-3"/>
          {category && <>
            <Link to={`/category/${category.slug}`} className="hover:text-primary transition-colors">{category.name_ar}</Link>
            <ChevronLeft className="w-3 h-3"/>
          </>}
          <span className="text-foreground font-medium line-clamp-1">{article.title}</span>
        </nav>

        {/* Category badge */}
        {category && (
          <Link to={`/category/${category.slug}`}
            className="inline-block text-xs font-black text-white bg-primary px-3 py-1 rounded-full mb-4 hover:bg-primary/80 transition-colors">
            {category.name_ar}
          </Link>
        )}

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-black leading-tight text-foreground mb-4">{article.title}</h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-5 pb-4 border-b border-border">
          {article.custom_author_name && (
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-[10px]">
                {article.custom_author_name[0]}
              </div>
              {article.custom_author_name}
            </span>
          )}
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{timeAgo(article.published_at)}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3"/>{rt} دقيقة للقراءة</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3"/>{(article.views||0).toLocaleString("ar-EG")} قراءة</span>
          {/* Mobile: listen */}
          <button onClick={toggleSpeech}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all lg:hidden ${speaking?"bg-primary text-white border-primary":"border-border hover:bg-muted"}`}>
            {speaking?<VolumeX className="w-3 h-3"/>:<Volume2 className="w-3 h-3"/>}
            {speaking?"إيقاف":"استمع"}
          </button>
        </div>

        {/* Hero image */}
        {article.featured_image && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="mb-6 rounded-2xl overflow-hidden">
            <img src={article.featured_image} alt={article.title} className="w-full object-cover max-h-[480px]"/>
          </motion.div>
        )}

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-base text-muted-foreground bg-muted/40 border-r-4 border-primary pr-4 py-3 rounded-l-xl mb-6 leading-relaxed font-medium italic">
            {article.excerpt}
          </p>
        )}

        {/* Content */}
        <div ref={bodyRef}
          className="prose prose-sm max-w-none article-body"
          dangerouslySetInnerHTML={{__html: renderContent(article.content||"")}}
          style={{fontFamily:"'Noto Naskh Arabic','Amiri',serif", lineHeight:"2.1", fontSize:"1.075rem"}}
        />

        {/* Share row */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm font-black mb-3">شارك الخبر</p>
          <SocialShareButtons title={article.title} url={url} image={article.featured_image||""} inline/>
        </div>

        {/* Tags / source */}
        <div className="mt-4 flex flex-wrap gap-2">
          {category && (
            <Link to={`/category/${category.slug}`}
              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary hover:text-white transition-all font-bold border border-border">
              # {category.name_ar}
            </Link>
          )}
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-primary"/>
              <h2 className="font-black text-base">أخبار ذات صلة</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map(r => (
                <Link key={r.id} to={`/article/${r.slug}`}
                  className="group flex gap-3 p-3 border border-border rounded-xl hover:bg-muted/40 transition-all">
                  {r.featured_image
                    ? <img src={r.featured_image} alt={r.title} className="w-20 h-14 object-cover rounded-lg shrink-0 group-hover:scale-105 transition-transform"/>
                    : <div className="w-20 h-14 rounded-lg bg-muted shrink-0"/>
                  }
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors leading-snug">{r.title}</h3>
                    <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5"/>{timeAgo(r.published_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
      <Footer/>
      <div className="h-16 lg:hidden"/>
    </div>
  );
}
