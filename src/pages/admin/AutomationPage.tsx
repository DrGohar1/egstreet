import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Rss, TrendingUp, Globe, Trash2, Play, Loader2, CheckCircle, XCircle, AlertCircle, Clock, Calendar, BarChart3, RefreshCw, FileText, Eye, Users, Zap } from "lucide-react";

const toSlug = (t: string) =>
  t.trim().slice(0,60).replace(/[^\u0600-\u06FFa-zA-Z0-9 ]/g,"").replace(/ +/g,"-").toLowerCase() + "-" + Date.now().toString(36);

export default function AutomationPage() {
  const [tsk, setTsk] = useState<Record<string,{enabled:boolean;status:string;lastRun:string}>>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [running, setRunning] = useState<string|null>(null);
  const [stats, setStats] = useState({articles:0,today:0,subscribers:0});

  useEffect(()=>{ loadStates(); loadLogs(); loadStats(); },[]);

  const loadStates = async () => {
    const {data} = await supabase.from("site_settings").select("key,value").in("key",["auto_rss","auto_trending","auto_sitemap","auto_cleanup"]);
    const m:Record<string,any>={};
    (data||[]).forEach(d=>{ try{m[d.key.replace("auto_","")]=JSON.parse(d.value);}catch{} });
    setTsk(m);
  };
  const saveState = async (id:string, upd:any) => {
    const next={...tsk[id],...upd};
    setTsk(p=>({...p,[id]:next}));
    await supabase.from("site_settings").upsert({key:`auto_${id}`,value:JSON.stringify(next)});
  };
  const loadLogs = async () => {
    const {data}=await supabase.from("automation_logs").select("*").order("created_at",{ascending:false}).limit(30);
    setLogs(data||[]);
  };
  const loadStats = async () => {
    const [a,b,c]=await Promise.all([
      supabase.from("articles").select("id",{count:"exact",head:true}),
      supabase.from("articles").select("id",{count:"exact",head:true}).gte("created_at",new Date(Date.now()-864e5).toISOString()),
      supabase.from("subscribers").select("id",{count:"exact",head:true}).eq("is_active",true),
    ]);
    setStats({articles:a.count||0,today:b.count||0,subscribers:c.count||0});
  };
  const log = async (type:string,status:string,msg:string,n=0) => {
    await supabase.from("automation_logs").insert({type,status,message:msg,articles_processed:n});
    loadLogs();
  };

  const runRss = async () => {
    const {data:fd}=await supabase.from("site_settings").select("value").eq("key","rss_feeds").single();
    let feeds:any[]=[];
    try{feeds=JSON.parse(fd?.value||"[]").filter((f:any)=>f.active);}catch{}
    if(!feeds.length){toast.error("أضف مصادر RSS أولاً من صفحة سحب الأخبار");return "0 مقال";}
    const {data:cats}=await supabase.from("categories").select("id").limit(1);
    const catId=cats?.[0]?.id||null;
    const {data:ex}=await supabase.from("articles").select("source_url").not("source_url","is",null).limit(500);
    const urls=new Set((ex||[]).map((a:any)=>a.source_url));
    let ok=0;
    for(const feed of feeds.slice(0,5)){
      try{
        const r=await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=8`);
        const d=await r.json();
        for(const item of (d.items||[]).slice(0,4)){
          const link=item.link||item.guid||"";
          if(urls.has(link)) continue;
          await supabase.from("articles").insert({
            title:item.title,slug:toSlug(item.title),
            excerpt:(item.description||"").replace(/<[^>]*>/g,"").slice(0,200),
            content:item.content||item.description||"",
            featured_image:item.enclosure?.link||item.thumbnail||null,
            status:"draft",category_id:feed.category_id||catId,
            source_url:link,source_name:feed.name,custom_author_name:feed.name,
            published_at:item.pubDate?new Date(item.pubDate).toISOString():new Date().toISOString(),
          });
          ok++;urls.add(link);
        }
      }catch{}
    }
    await log("rss_import","success",`RSS: ${ok} مقال جديد`,ok);
    loadStats();
    return `${ok} مقال جديد`;
  };

  const runTrending = async () => {
    try{await supabase.rpc("update_trending_scores" as any);}catch{}
    await log("trending","success","تحديث درجات المقالات الرائجة");
    return "تم التحديث";
  };

  const runSitemap = async () => {
    const [{data:arts},{data:cats}]=await Promise.all([
      supabase.from("articles").select("slug,updated_at").eq("status","published").limit(1000),
      supabase.from("categories").select("slug").eq("is_active",true),
    ]);
    const base="https://egst.vercel.app";
    const urls=[
      `<url><loc>${base}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${base}/archive</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
      ...(cats||[]).map((c:any)=>`<url><loc>${base}/category/${c.slug}</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>`),
      ...(arts||[]).map((a:any)=>`<url><loc>${base}/article/${a.slug}</loc><lastmod>${(a.updated_at||"").slice(0,10)}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`),
    ];
    const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
    await supabase.from("site_settings").upsert({key:"sitemap_xml",value:xml});
    await supabase.from("site_settings").upsert({key:"sitemap_updated",value:new Date().toISOString()});
    await log("sitemap","success",`Sitemap: ${urls.length} رابط`,urls.length);
    return `${urls.length} رابط`;
  };

  const runCleanup = async () => {
    const cutoff=new Date(Date.now()-30*864e5).toISOString();
    const {data}=await supabase.from("articles").delete().eq("status","draft").lt("created_at",cutoff).select("id");
    const n=data?.length||0;
    await log("cleanup","success",`حذف ${n} مسودة قديمة`,n);
    return `${n} مسودة`;
  };

  const runTask = async (id:string, fn:()=>Promise<string>) => {
    if(running) return;
    setRunning(id); saveState(id,{status:"running",lastRun:new Date().toISOString()});
    try{ const r=await fn(); saveState(id,{status:"success"}); toast.success(`✅ ${r}`); }
    catch(e:any){ saveState(id,{status:"error"}); toast.error(`❌ ${e.message||"حدث خطأ"}`); }
    setRunning(null);
  };

  const TASKS=[
    {id:"rss",      icon:Rss,        color:"text-blue-500",  bg:"bg-blue-500/10",  title:"استيراد RSS",         desc:"يجلب أخبار المصادر المفعّلة",           fn:runRss},
    {id:"trending", icon:TrendingUp, color:"text-amber-500", bg:"bg-amber-500/10", title:"المقالات الرائجة",    desc:"يحسب درجات الشعبية والحداثة",           fn:runTrending},
    {id:"sitemap",  icon:Globe,      color:"text-green-500", bg:"bg-green-500/10", title:"توليد Sitemap",       desc:"خريطة الموقع لمحركات البحث",             fn:runSitemap},
    {id:"cleanup",  icon:Trash2,     color:"text-red-500",   bg:"bg-red-500/10",   title:"تنظيف المسودات",      desc:"حذف المسودات القديمة +30 يوم",           fn:runCleanup},
  ];

  const SI=({s}:{s?:string})=>{
    if(!s||s==="idle") return <div className="w-2 h-2 rounded-full bg-muted-foreground/30"/>;
    if(s==="running") return <Loader2 className="w-4 h-4 text-blue-500 animate-spin"/>;
    if(s==="success") return <CheckCircle className="w-4 h-4 text-green-500"/>;
    return <XCircle className="w-4 h-4 text-red-500"/>;
  };

  return (
    <div className="space-y-4 p-4 max-w-5xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2"><Zap className="w-6 h-6 text-primary"/>مركز الأتمتة</h1>
        <p className="text-sm text-muted-foreground">تشغيل المهام التلقائية ومتابعة السجلات</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{icon:FileText,val:stats.articles,label:"المقالات",c:"text-blue-500"},
          {icon:Eye,val:stats.today,label:"اليوم",c:"text-green-500"},
          {icon:Users,val:stats.subscribers,label:"المشتركون",c:"text-purple-500"}
        ].map(s=>(
          <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.c}`}/>
            <div className={`text-xl font-black ${s.c}`}>{s.val.toLocaleString("ar-EG")}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TASKS.map(task=>{
          const st=tsk[task.id];
          return (
            <motion.div key={task.id} className="bg-card border border-border rounded-2xl p-4 space-y-3" whileHover={{y:-1}}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${task.bg} flex items-center justify-center shrink-0`}>
                    <task.icon className={`w-5 h-5 ${task.color}`}/>
                  </div>
                  <div>
                    <h3 className="font-black text-sm">{task.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{task.desc}</p>
                  </div>
                </div>
                <SI s={st?.status}/>
              </div>
              {st?.lastRun && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/>آخر تشغيل: {new Date(st.lastRun).toLocaleString("ar-EG",{hour:"2-digit",minute:"2-digit",month:"short",day:"numeric"})}</p>}
              <div className="flex gap-2">
                <button onClick={()=>runTask(task.id,task.fn)} disabled={!!running}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all ${running===task.id?"bg-blue-500/20 text-blue-600":"bg-primary text-white hover:bg-primary/85 disabled:opacity-40"}`}>
                  {running===task.id?<><Loader2 className="w-3.5 h-3.5 animate-spin"/>جارٍ...</>:<><Play className="w-3.5 h-3.5"/>تشغيل</>}
                </button>
                <button onClick={()=>saveState(task.id,{enabled:!st?.enabled})}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${st?.enabled?"border-green-500/50 bg-green-500/10 text-green-600":"border-border text-muted-foreground hover:bg-muted"}`}>
                  {st?.enabled?"✓ مجدولة":"جدولة"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5"/>
          <div>
            <p className="font-black text-sm text-primary mb-1">جدولة عبر Vercel Cron</p>
            <p className="text-xs text-muted-foreground mb-2">أضف في <code className="bg-muted px-1 rounded">vercel.json</code> للتشغيل التلقائي</p>
            <pre className="bg-muted rounded-xl p-3 text-[10px] overflow-x-auto" dir="ltr">{`{"crons":[{"path":"/api/cron/rss","schedule":"0 */3 * * *"},{"path":"/api/cron/sitemap","schedule":"0 4 * * *"}]}`}</pre>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-black text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary"/>سجل العمليات</h3>
          <button onClick={loadLogs} className="w-7 h-7 hover:bg-muted rounded-lg flex items-center justify-center"><RefreshCw className="w-3.5 h-3.5"/></button>
        </div>
        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {!logs.length?<div className="p-6 text-center text-sm text-muted-foreground">لا توجد سجلات بعد</div>:logs.map(l=>(
            <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
              {l.status==="success"?<CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0"/>:l.status==="error"?<XCircle className="w-3.5 h-3.5 text-red-500 shrink-0"/>:<AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0"/>}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{l.message}</p>
                <p className="text-[10px] text-muted-foreground">{l.type}</p>
              </div>
              {l.articles_processed>0&&<span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">+{l.articles_processed}</span>}
              <span className="text-[10px] text-muted-foreground shrink-0">{new Date(l.created_at).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
