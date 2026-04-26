import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import { Clock, Eye, Newspaper, Loader2 } from "lucide-react";

interface Article { id:string; title:string; slug:string; excerpt:string|null; featured_image:string|null; published_at:string|null; views:number|null; }
interface Category { id:string; name_ar:string; name_en:string; slug:string; description:string|null; }

const timeAgo = (d:string|null) => {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff/60000);
  if (m<60) return "منذ "+ m +" دقيقة";
  const h = Math.floor(m/60);
  if (h<24) return "منذ "+h+" ساعة";
  return new Date(d).toLocaleDateString("ar-EG");
};

export default function CategoryPage() {
  const { slug } = useParams<{slug:string}>();
  const [category, setCategory] = useState<Category|null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sort,     setSort]     = useState<"latest"|"popular">("latest");
  const [page,     setPage]     = useState(0);
  const PAGE_SIZE = 12;

  useEffect(()=>{
    if (!slug) return;
    setLoading(true); setPage(0);
    supabase.from("categories").select("*").eq("slug",slug).maybeSingle()
      .then(({data})=>setCategory(data as Category));
  },[slug]);

  useEffect(()=>{
    if (!category) return;
    setLoading(true);
    const q = supabase.from("articles")
      .select("id,title,slug,excerpt,featured_image,published_at,views")
      .eq("status","published").eq("category_id",category.id)
      .range(page*PAGE_SIZE, page*PAGE_SIZE+PAGE_SIZE-1);
    (sort==="popular" ? q.order("views",{ascending:false}) : q.order("published_at",{ascending:false}))
      .then(({data})=>{ setArticles(a=>page===0?(data as Article[]):([...a,...(data as Article[])])); setLoading(false); });
  },[category,sort,page]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {category && <SEOHead title={category.name_ar+" — الشارع المصري"} description={category.description||""}/>}
      <Header/>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 bg-primary rounded-full"/>
              <h1 className="text-2xl font-black">{category?.name_ar||"..."}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{articles.length} مقال</p>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
            {(["latest","popular"] as const).map(s=>(
              <button key={s} onClick={()=>{setSort(s);setPage(0);}}
                className={"text-xs font-bold px-3 py-1.5 rounded-lg transition-all "+(sort===s?"bg-card shadow-sm text-foreground":"text-muted-foreground")}>
                {s==="latest"?"الأحدث":"الأكثر قراءة"}
              </button>
            ))}
          </div>
        </div>
        {loading && page===0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_,i)=><div key={i} className="bg-muted rounded-2xl aspect-[3/4] animate-pulse"/>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {articles.map(a=>(
              <Link key={a.id} to={"/article/"+a.slug}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5">
                <div className="aspect-video overflow-hidden bg-muted">
                  {a.featured_image
                    ? <img src={a.featured_image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    : <div className="w-full h-full flex items-center justify-center"><Newspaper className="w-6 h-6 text-muted-foreground/20"/></div>}
                </div>
                <div className="p-3">
                  <h2 className="font-bold text-xs leading-snug line-clamp-3 group-hover:text-primary transition-colors">{a.title}</h2>
                  <div className="flex items-center justify-between mt-2 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Clock className="w-2 h-2"/>{timeAgo(a.published_at)}</span>
                    <span className="flex items-center gap-0.5"><Eye className="w-2 h-2"/>{(a.views||0).toLocaleString("ar-EG")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {articles.length >= PAGE_SIZE*(page+1) && (
          <div className="text-center mt-8">
            <button onClick={()=>setPage(p=>p+1)} disabled={loading}
              className="bg-primary text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto">
              {loading?<><Loader2 className="w-4 h-4 animate-spin"/>جاري التحميل...</>:"تحميل المزيد"}
            </button>
          </div>
        )}
      </main>
      
    </div>
  );
}
