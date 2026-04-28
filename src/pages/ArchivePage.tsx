import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BreakingTicker from "@/components/BreakingTicker";
import SEOHead from "@/components/SEOHead";
import { Clock, Eye, ChevronDown, Search, Filter, Newspaper, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const timeAgo = (d:string|null)=>{
  if(!d) return "";
  const diff=Date.now()-new Date(d).getTime();
  const m=Math.floor(diff/60000);
  if(m<60) return `منذ ${m} دقيقة`;
  const h=Math.floor(m/60);
  if(h<24) return `منذ ${h} ساعة`;
  const dy=Math.floor(h/24);
  if(dy<30) return `منذ ${dy} يوم`;
  return new Date(d).toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"});
};

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

interface Article {
  id:string; title:string; slug:string; featured_image:string|null;
  published_at:string|null; views:number; excerpt:string|null;
  category_id:string|null;
}
interface Category { id:string; name_ar:string; slug:string; }

export default function ArchivePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [cats,     setCats]     = useState<Category[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [catFilter,setCatFilter]= useState("all");
  const [yearFilter,setYearFilter]=useState("all");
  const [monthFilter,setMonthFilter]=useState("all");
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 20;

  useEffect(()=>{
    Promise.all([
      supabase.from("articles").select("id,title,slug,featured_image,published_at,views,excerpt,category_id")
        .eq("status","published").order("published_at",{ascending:false}).limit(500),
      supabase.from("categories").select("id,name_ar,slug"),
    ]).then(([{data:arts},{data:c}])=>{
      if(arts) setArticles(arts);
      if(c) setCats(c);
      setLoading(false);
    });
  },[]);

  // Available years
  const years = [...new Set(articles.map(a=>a.published_at ? new Date(a.published_at).getFullYear() : null).filter(Boolean))].sort((a,b)=>b!-a!);

  const filtered = articles.filter(a=>{
    const q=search.toLowerCase();
    const matchQ = !q || a.title.toLowerCase().includes(q) || (a.excerpt||"").toLowerCase().includes(q);
    const matchC = catFilter==="all" || a.category_id===catFilter;
    const d = a.published_at ? new Date(a.published_at) : null;
    const matchY = yearFilter==="all" || (d && String(d.getFullYear())===yearFilter);
    const matchM = monthFilter==="all" || (d && String(d.getMonth())===monthFilter);
    return matchQ && matchC && matchY && matchM;
  });

  const paged = filtered.slice(0, page * PER_PAGE);
  const hasMore = paged.length < filtered.length;

  // Group by month for timeline view
  const grouped: Record<string, Article[]> = {};
  paged.forEach(a=>{
    if(!a.published_at) return;
    const d = new Date(a.published_at);
    const key = `${d.getFullYear()} - ${MONTHS_AR[d.getMonth()]}`;
    if(!grouped[key]) grouped[key]=[];
    grouped[key].push(a);
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="أرشيف المقالات" description="أرشيف كامل لجميع مقالات وأخبار جريدة الشارع المصري" url="/archive" type="website"/>
      <Header/>
      <BreakingTicker/>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-6" dir="rtl">

        {/* Hero */}
        <div className="text-center space-y-2 py-6">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7 text-primary"/>
          </div>
          <h1 className="text-3xl font-black text-foreground">أرشيف المقالات</h1>
          <p className="text-muted-foreground">{articles.length.toLocaleString("ar-EG")} مقال ومقالة في الأرشيف</p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
              placeholder="ابحث في الأرشيف..."
              className="w-full bg-muted border border-border rounded-xl ps-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
          </div>
          {/* Dropdowns */}
          <div className="flex flex-wrap gap-2">
            {/* Category */}
            <select value={catFilter} onChange={e=>{setCatFilter(e.target.value);setPage(1);}}
              className="flex-1 min-w-[140px] bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="all">كل الأقسام</option>
              {cats.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
            {/* Year */}
            <select value={yearFilter} onChange={e=>{setYearFilter(e.target.value);setMonthFilter("all");setPage(1);}}
              className="flex-1 min-w-[120px] bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="all">كل السنوات</option>
              {years.map(y=><option key={y} value={String(y)}>{y}</option>)}
            </select>
            {/* Month */}
            <select value={monthFilter} onChange={e=>{setMonthFilter(e.target.value);setPage(1);}}
              className="flex-1 min-w-[130px] bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="all">كل الشهور</option>
              {MONTHS_AR.map((m,i)=><option key={i} value={String(i)}>{m}</option>)}
            </select>
            {(catFilter!=="all"||yearFilter!=="all"||monthFilter!=="all"||search) && (
              <button onClick={()=>{setCatFilter("all");setYearFilter("all");setMonthFilter("all");setSearch("");setPage(1);}}
                className="px-3 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors text-muted-foreground">
                مسح الفلاتر
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length.toLocaleString("ar-EG")} نتيجة</p>
        </div>

        {/* Timeline grouped by month */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_,i)=>(
              <div key={i} className="animate-pulse bg-muted rounded-2xl h-20"/>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([monthKey, arts])=>(
              <div key={monthKey}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0"/>
                  <h2 className="text-sm font-black text-muted-foreground">{monthKey}</h2>
                  <div className="flex-1 h-px bg-border"/>
                  <span className="text-xs text-muted-foreground">{arts.length} مقال</span>
                </div>
                <div className="space-y-2 ps-5">
                  {arts.map((a,i)=>{
                    const cat = cats.find(c=>c.id===a.category_id);
                    return (
                      <motion.div key={a.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0,transition:{delay:i*0.02}}}>
                        <Link to={`/article/${a.slug}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-all group border border-transparent hover:border-border">
                          {a.featured_image
                            ? <img src={a.featured_image} alt={a.title} className="w-14 h-10 object-cover rounded-lg shrink-0"/>
                            : <div className="w-14 h-10 bg-muted rounded-lg shrink-0 flex items-center justify-center"><Newspaper className="w-4 h-4 text-muted-foreground/30"/></div>
                          }
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">{a.title}</h3>
                            <div className="flex items-center gap-3 mt-0.5">
                              {cat && <span className="text-[9px] text-primary font-bold">{cat.name_ar}</span>}
                              <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5"/>{timeAgo(a.published_at)}
                              </span>
                              <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                <Eye className="w-2.5 h-2.5"/>{(a.views||0).toLocaleString("ar-EG")}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
            {filtered.length===0 && (
              <div className="text-center py-20 text-muted-foreground">
                <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-10"/>
                <p className="font-bold">لا توجد نتائج</p>
              </div>
            )}
            {hasMore && (
              <div className="text-center">
                <button onClick={()=>setPage(p=>p+1)}
                  className="flex items-center gap-2 mx-auto bg-card border border-border hover:bg-muted px-6 py-2.5 rounded-xl font-bold text-sm transition-colors">
                  <ChevronDown className="w-4 h-4"/>تحميل المزيد ({filtered.length - paged.length} متبقي)
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}