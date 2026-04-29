import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Clock, Eye, Search, ChevronLeft, Filter, Loader2, Calendar } from "lucide-react";

interface Article {
  id:string; title:string; slug:string; excerpt:string|null;
  featured_image:string|null; published_at:string|null;
  views:number|null; category_id:string|null;
}
interface Category { id:string; name_ar:string; slug:string; }

const timeAgo = (d:string|null) => {
  if(!d) return "";
  const diff = Date.now()-new Date(d).getTime();
  const m = Math.floor(diff/60000);
  if(m<60) return `${m} دقيقة`;
  const h = Math.floor(m/60);
  if(h<24) return `${h} ساعة`;
  return new Date(d).toLocaleDateString("ar-EG",{day:"numeric",month:"long"});
};

export default function Archive() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [cats,     setCats]     = useState<Category[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [selCat,   setSelCat]   = useState<string>("all");
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const PER = 20;

  const load = async () => {
    setLoading(true);
    let q = supabase.from("articles")
      .select("id,title,slug,excerpt,featured_image,published_at,views,category_id", { count:"exact" })
      .eq("status","published")
      .order("published_at", { ascending:false })
      .range((page-1)*PER, page*PER-1);
    if (selCat !== "all") q = q.eq("category_id", selCat);
    if (search.trim())    q = q.ilike("title", `%${search.trim()}%`);
    const { data, count } = await q;
    setArticles(data||[]);
    setTotal(count||0);
    setLoading(false);
  };

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({data})=>setCats(data||[]));
  }, []);

  useEffect(() => { load(); }, [page, selCat]);
  useEffect(() => { setPage(1); load(); }, [search, selCat]);

  const pages = Math.ceil(total/PER);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEOHead title="أرشيف الأخبار | الشارع المصري" description="تصفح جميع أخبار الشارع المصري"/>
      <Header/>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black mb-1">أرشيف الأخبار</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString("ar")} خبر منشور</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
              placeholder="ابحث في الأرشيف..."
              className="w-full pr-10 pl-4 py-2.5 text-sm bg-muted rounded-xl border border-border focus:border-primary focus:outline-none"/>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0"/>
            <button onClick={()=>{setSelCat("all");setPage(1);}}
              className={`shrink-0 text-xs px-3 py-2 rounded-xl font-bold transition-all ${selCat==="all"?"bg-primary text-white":"bg-muted hover:bg-muted/70"}`}>
              الكل
            </button>
            {cats.map(c=>(
              <button key={c.id} onClick={()=>{setSelCat(c.id);setPage(1);}}
                className={`shrink-0 text-xs px-3 py-2 rounded-xl font-bold transition-all ${selCat===c.id?"bg-primary text-white":"bg-muted hover:bg-muted/70"}`}>
                {c.name_ar}
              </button>
            ))}
          </div>
        </div>

        {/* Articles grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-20"/>
            <p className="font-bold">لا توجد نتائج</p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map(a => {
              const cat = cats.find(c=>c.id===a.category_id);
              return (
                <Link key={a.id} to={`/article/${a.slug}`}
                  className="group flex gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all">
                  {a.featured_image
                    ? <img src={a.featured_image} alt={a.title}
                        className="w-24 h-18 object-cover rounded-xl shrink-0 group-hover:scale-105 transition-transform"/>
                    : <div className="w-24 h-18 rounded-xl bg-muted shrink-0"/>
                  }
                  <div className="flex-1 min-w-0">
                    {cat && (
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1.5 inline-block">
                        {cat.name_ar}
                      </span>
                    )}
                    <h2 className="font-black text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1">
                      {a.title}
                    </h2>
                    {a.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{a.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{timeAgo(a.published_at)}</span>
                      {a.views != null && <span className="flex items-center gap-1"><Eye className="w-3 h-3"/>{a.views.toLocaleString("ar")}</span>}
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0 self-center group-hover:text-primary transition-colors"/>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
              className="px-4 py-2 rounded-xl border border-border text-sm font-bold hover:bg-muted disabled:opacity-40 transition-colors">
              السابق
            </button>
            {[...Array(Math.min(pages,7))].map((_,i)=>{
              const p = i+1;
              return (
                <button key={p} onClick={()=>setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page===p?"bg-primary text-white shadow-sm":"border border-border hover:bg-muted"}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages}
              className="px-4 py-2 rounded-xl border border-border text-sm font-bold hover:bg-muted disabled:opacity-40 transition-colors">
              التالي
            </button>
          </div>
        )}
      </main>
      <Footer/>
    </div>
  );
}
