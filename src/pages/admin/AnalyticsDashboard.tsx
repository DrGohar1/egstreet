import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Eye, Users, FileText, TrendingUp, Share2, Zap, ArrowUp, ArrowDown, Clock, BarChart3, Activity, RefreshCw } from "lucide-react";

/* ── Sparkline ── */
const Spark = ({ data, color="#e11d48" }: { data:number[]; color?:string }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1), W=80, H=28;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*W},${H-(v/max)*H}`).join(" ");
  return (
    <svg width={W} height={H} className="opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

/* ── Line Chart (SVG) ── */
const LineChart = ({ days }: { days:{date:string;views:number}[] }) => {
  if (days.length < 2) return <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">لا توجد بيانات كافية</div>;
  const max = Math.max(...days.map(d=>d.views),1), W=560, H=100, PAD=8;
  const pts = days.map((d,i)=>({
    x: PAD+(i/(days.length-1))*(W-PAD*2),
    y: H-PAD-(d.views/max)*(H-PAD*2), ...d
  }));
  const path = pts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`;
  const tick = Math.ceil(days.length/6);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
        <defs>
          <linearGradient id="agrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e11d48" stopOpacity=".25"/>
            <stop offset="100%" stopColor="#e11d48" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#agrad)"/>
        <path d={path} fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#e11d48"/>)}
      </svg>
      <div className="flex justify-between mt-1 px-0.5">
        {days.filter((_,i)=>i%tick===0).map(d=>(
          <span key={d.date} className="text-[9px] text-muted-foreground">
            {new Date(d.date).toLocaleDateString("ar-EG",{day:"numeric",month:"short"})}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── Horizontal Bar Chart ── */
const HBar = ({ data }: { data:{label:string;value:number;color?:string}[] }) => {
  const max = Math.max(...data.map(d=>d.value),1);
  const colors = ["#e11d48","#3b82f6","#10b981","#f59e0b","#8b5cf6","#06b6d4"];
  return (
    <div className="space-y-2.5">
      {data.map((d,i)=>(
        <div key={i} className="flex items-center gap-2">
          <div className="w-16 text-xs text-muted-foreground truncate shrink-0 text-end">{d.label}</div>
          <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
            <motion.div initial={{width:0}} animate={{width:`${(d.value/max)*100}%`}}
              transition={{duration:.8,delay:i*.06,ease:"easeOut"}}
              className="h-full rounded-full" style={{backgroundColor:d.color||colors[i%6]}}/>
          </div>
          <div className="text-xs font-bold w-14 shrink-0">{d.value.toLocaleString("ar-EG")}</div>
        </div>
      ))}
    </div>
  );
};

/* ── Stat Card ── */
const Card = ({ icon:Icon, label, value, sub, color, trend, spark }: any) => (
  <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}
    className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white"/>
      </div>
      <div className="flex flex-col items-end gap-1">
        {trend!==undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-bold ${trend>=0?"text-green-500":"text-red-500"}`}>
            {trend>=0?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>}{Math.abs(trend)}%
          </span>
        )}
        {spark && <Spark data={spark}/>}
      </div>
    </div>
    <div className="text-2xl font-black">{typeof value==="number"?value.toLocaleString("ar-EG"):value}</div>
    <div className="text-sm font-medium mt-0.5">{label}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </motion.div>
);

/* ── Main ── */
const AnalyticsDashboard = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [ts, setTs] = useState(new Date());
  const [stats, setStats] = useState({ totalViews:0,todayViews:0,weekViews:0,totalArticles:0,published:0,drafts:0,subscribers:0,newSubs:0,breaking:0,featured:0,shares:0,comments:0 });
  const [topArts, setTopArts] = useState<any[]>([]);
  const [catData, setCatData] = useState<any[]>([]);
  const [daily, setDaily]     = useState<{date:string;views:number}[]>([]);
  const [recent, setRecent]   = useState<any[]>([]);

  const load = useCallback(async () => {
    const now = new Date(), weekAgo = new Date(now.getTime()-7*864e5);
    const todayStr = now.toISOString().split("T")[0];
    const weekStr  = weekAgo.toISOString().split("T")[0];

    const [artR,subsR,brkR,usersR,commR,dvR,shrR,catR] = await Promise.all([
      supabase.from("articles").select("id,status,is_featured,views,published_at,title,slug,featured_image,category_id"),
      supabase.from("subscribers").select("id,created_at"),
      supabase.from("breaking_news").select("id",{count:"exact",head:true}).eq("is_active",true),
      supabase.from("profiles").select("id",{count:"exact",head:true}),
      supabase.from("comments").select("id",{count:"exact",head:true}),
      supabase.from("daily_views").select("views,date").order("date",{ascending:true}).limit(30),
      supabase.from("share_tracking").select("id",{count:"exact",head:true}),
      supabase.from("categories").select("id,name_ar"),
    ]);

    const arts = artR.data||[], subs = subsR.data||[], dv = dvR.data||[], cats = catR.data||[];
    const totalViews = arts.reduce((s,a)=>s+(a.views||0),0);
    const todayViews = dv.find(d=>d.date===todayStr)?.views||0;
    const weekViews  = dv.filter(d=>d.date>=weekStr).reduce((s,d)=>s+(d.views||0),0);
    const newSubs    = subs.filter(s=>new Date(s.created_at)>=weekAgo).length;

    const top = [...arts].filter(a=>a.status==="published").sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,8);

    const catV: Record<string,number> = {};
    arts.forEach(a=>{ if(a.category_id) catV[a.category_id]=(catV[a.category_id]||0)+(a.views||0); });
    const catBars = cats.map(c=>({label:c.name_ar,value:catV[c.id]||0})).sort((a,b)=>b.value-a.value).slice(0,7);

    setStats({ totalViews,todayViews,weekViews,totalArticles:arts.length,published:arts.filter(a=>a.status==="published").length,drafts:arts.filter(a=>a.status==="draft").length,subscribers:subs.length,newSubs,breaking:brkR.count||0,featured:arts.filter(a=>a.is_featured).length,shares:shrR.count||0,comments:commR.count||0 });
    setTopArts(top); setCatData(catBars); setDaily(dv);
    setRecent(arts.filter(a=>a.status==="published").slice(0,6));
    setTs(new Date()); setLoading(false);
  }, []);

  useEffect(() => { load(); const t=setInterval(load,30000); return ()=>clearInterval(t); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const spark7 = daily.slice(-7).map(d=>d.views);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><BarChart3 className="text-primary"/> التحليلات</h1>
          <p className="text-xs text-muted-foreground">آخر تحديث: {ts.toLocaleTimeString("ar-EG")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 text-xs px-3 py-1.5 rounded-full font-bold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> مباشر
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors">
            <RefreshCw className="w-3.5 h-3.5"/> تحديث
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Card icon={Eye}        label="إجمالي المشاهدات"  value={stats.totalViews}  sub={`اليوم: ${stats.todayViews.toLocaleString("ar-EG")}`} color="bg-blue-500"   trend={12} spark={spark7}/>
        <Card icon={Activity}   label="مشاهدات الأسبوع"  value={stats.weekViews}   color="bg-indigo-500" trend={8} spark={spark7}/>
        <Card icon={FileText}   label="مقالات منشورة"    value={stats.published}   sub={`مسودات: ${stats.drafts}`} color="bg-primary"/>
        <Card icon={Users}      label="المشتركون"         value={stats.subscribers} sub={`+${stats.newSubs} هذا الأسبوع`} color="bg-purple-500" trend={stats.newSubs>0?15:0}/>
        <Card icon={Share2}     label="المشاركات"         value={stats.shares}      color="bg-green-500"/>
        <Card icon={Zap}        label="أخبار عاجلة"      value={stats.breaking}    sub="نشطة الآن" color="bg-red-500"/>
        <Card icon={TrendingUp} label="أخبار مميزة"      value={stats.featured}    color="bg-yellow-500"/>
        <Card icon={Clock}      label="التعليقات"         value={stats.comments}    color="bg-teal-500"/>
      </div>

      {/* Line Chart */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-black flex items-center gap-2 mb-4"><Activity className="w-4 h-4 text-primary"/> المشاهدات اليومية (30 يوم)</h2>
        <LineChart days={daily}/>
      </div>

      {/* Two cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Articles */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-black flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-primary"/> الأكثر قراءة</h2>
          <div className="space-y-3">
            {topArts.map((a,i)=>{
              const maxV = topArts[0]?.views||1;
              const medals = ["bg-yellow-500","bg-gray-400","bg-amber-600"];
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 ${medals[i]||"bg-muted text-muted-foreground"}`}>{i+1}</span>
                  {a.featured_image && <img src={a.featured_image} alt="" className="w-10 h-8 object-cover rounded-lg shrink-0" onError={e=>(e.target as any).style.display="none"}/>}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold line-clamp-1">{a.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{width:`${((a.views||0)/maxV)*100}%`}}/>
                      </div>
                      <span className="text-xs font-bold text-primary shrink-0">{(a.views||0).toLocaleString("ar-EG")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category bars */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-black flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-primary"/> المشاهدات حسب القسم</h2>
          <HBar data={catData}/>
        </div>
      </div>

      {/* Recent table */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-black flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-primary"/> آخر المنشورات</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-start pb-2 ps-1 font-bold">المقال</th>
                <th className="text-start pb-2 font-bold hidden sm:table-cell">النشر</th>
                <th className="text-start pb-2 font-bold">المشاهدات</th>
                <th className="text-start pb-2 font-bold hidden md:table-cell">الأداء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {recent.map(a=>{
                const maxV = Math.max(...recent.map(x=>x.views||0),1);
                return (
                  <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 ps-1">
                      <div className="flex items-center gap-2">
                        {a.featured_image && <img src={a.featured_image} alt="" className="w-9 h-7 object-cover rounded-lg shrink-0" onError={e=>(e.target as any).style.display="none"}/>}
                        <span className="font-medium line-clamp-1 max-w-[180px] text-xs">{a.title}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                      {a.published_at?new Date(a.published_at).toLocaleDateString("ar-EG"):"—"}
                    </td>
                    <td className="py-2.5 font-black text-primary text-sm">{(a.views||0).toLocaleString("ar-EG")}</td>
                    <td className="py-2.5 hidden md:table-cell">
                      <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{width:`${((a.views||0)/maxV)*100}%`}}/>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsDashboard;
