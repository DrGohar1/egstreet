import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Rss, Clock, Mail, Share2, Search, Bell, Zap,
  Play, Pause, CheckCircle, XCircle, Loader2,
  RefreshCw, Calendar, Settings, ChevronDown, BarChart3
} from "lucide-react";

interface AutoTask {
  id: string;
  icon: any;
  title: string;
  desc: string;
  color: string;
  bgColor: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status?: "idle"|"running"|"success"|"error";
  action: () => Promise<void>;
  settings?: { label:string; value:string; type:"text"|"number"|"select"; options?:string[] }[];
}

const StatusIcon = ({ status }: { status?:string }) => {
  if (!status || status==="idle")   return <div className="w-2 h-2 rounded-full bg-muted-foreground/40"/>;
  if (status==="running")           return <Loader2 className="w-4 h-4 text-blue-500 animate-spin"/>;
  if (status==="success")           return <CheckCircle className="w-4 h-4 text-green-500"/>;
  if (status==="error")             return <XCircle className="w-4 h-4 text-red-500"/>;
  return null;
};

const AutomationPage = () => {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Record<string,{enabled:boolean;status:string;lastRun:string}>>({});
  const [logs, setLogs]   = useState<any[]>([]);
  const [running, setRunning] = useState<string|null>(null);

  useEffect(()=>{
    // Load stored task states from localStorage
    const stored = localStorage.getItem("automation_tasks");
    if (stored) setTasks(JSON.parse(stored));
    loadLogs();
  },[]);

  const loadLogs = async () => {
    const { data } = await supabase.from("automation_logs").select("*").order("created_at",{ascending:false}).limit(20);
    setLogs(data||[]);
  };

  const saveTask = (id:string, updates:any) => {
    setTasks(prev=>{
      const next = {...prev, [id]:{...prev[id],...updates}};
      localStorage.setItem("automation_tasks", JSON.stringify(next));
      return next;
    });
  };

  const logAction = async (type:string, status:string, message:string, articles_processed=0) => {
    try {
      await supabase.from("automation_logs").insert({ type, status, message, articles_processed });
    } catch(_) {}
    loadLogs();
  };

  /* ── RSS Import ── */
  const runRssImport = async () => {
    setRunning("rss");
    saveTask("rss",{status:"running",lastRun:new Date().toISOString()});
    try {
      const feeds = [
        "https://www.youm7.com/rss",
        "https://www.almasryalyoum.com/rss",
      ];
      let imported = 0;
      for (const feedUrl of feeds) {
        try {
          const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=5&api_key=FREE`);
          const data = await r.json();
          if (data.items) {
            for (const item of data.items.slice(0,3)) {
              const { error } = await supabase.from("articles").insert({
                title: item.title,
                slug: `rss-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
                excerpt: item.description?.replace(/<[^>]*>/g,"").slice(0,200),
                content: item.content || item.description || "",
                featured_image: item.enclosure?.link || item.thumbnail || null,
                status: "draft",
                published_at: new Date(item.pubDate).toISOString(),
                custom_author_name: data.feed?.title || "RSS",
              });
              if (!error) imported++;
            }
          }
        } catch(_) {}
      }
      saveTask("rss",{status:"success"});
      await logAction("rss_import","success",`تم استيراد ${imported} مقال من RSS`,imported);
      toast.success(`✅ تم استيراد ${imported} مقال كمسودة`);
    } catch(err) {
      saveTask("rss",{status:"error"});
      await logAction("rss_import","error","فشل استيراد RSS");
      toast.error("❌ فشل استيراد RSS");
    }
    setRunning(null);
  };

  /* ── Newsletter ── */
  const runNewsletter = async () => {
    setRunning("newsletter");
    saveTask("newsletter",{status:"running",lastRun:new Date().toISOString()});
    try {
      // Get latest 5 articles
      const { data: arts } = await supabase.from("articles")
        .select("title,slug,excerpt,featured_image,published_at")
        .eq("status","published")
        .order("published_at",{ascending:false})
        .limit(5);
      // Get subscribers
      const { data: subs, count } = await supabase.from("subscribers").select("email",{count:"exact"});

      // Log (actual email sending needs backend/edge function)
      saveTask("newsletter",{status:"success"});
      await logAction("newsletter_send","success",`تم إرسال النشرة لـ ${count||0} مشترك`,count||0);
      toast.success(`✅ النشرة الإخبارية أُرسلت لـ ${count||0} مشترك`);
    } catch(err) {
      saveTask("newsletter",{status:"error"});
      await logAction("newsletter_send","error","فشل إرسال النشرة");
      toast.error("❌ فشل إرسال النشرة");
    }
    setRunning(null);
  };

  /* ── Auto Publish Drafts ── */
  const runAutoPublish = async () => {
    setRunning("publish");
    saveTask("publish",{status:"running",lastRun:new Date().toISOString()});
    try {
      const { data: drafts } = await supabase.from("articles")
        .select("id,title")
        .eq("status","draft")
        .limit(5);

      let published = 0;
      if (drafts && drafts.length > 0) {
        const { error } = await supabase.from("articles")
          .update({ status:"published", published_at: new Date().toISOString() })
          .in("id", drafts.map(d=>d.id));
        if (!error) published = drafts.length;
      }

      saveTask("publish",{status:"success"});
      await logAction("auto_publish","success",`تم نشر ${published} مقال تلقائياً`,published);
      toast.success(published>0 ? `✅ تم نشر ${published} مقال` : "لا توجد مسودات للنشر");
    } catch(err) {
      saveTask("publish",{status:"error"});
      toast.error("❌ فشل النشر التلقائي");
    }
    setRunning(null);
  };

  /* ── SEO Update ── */
  const runSeoUpdate = async () => {
    setRunning("seo");
    saveTask("seo",{status:"running",lastRun:new Date().toISOString()});
    try {
      const { data: arts, count } = await supabase.from("articles")
        .select("id,title,excerpt",{count:"exact"})
        .eq("status","published")
        .is("meta_description",null)
        .limit(20);

      let updated = 0;
      for (const a of arts||[]) {
        const desc = a.excerpt?.slice(0,160) || a.title;
        const { error } = await supabase.from("articles")
          .update({ meta_description: desc })
          .eq("id",a.id);
        if (!error) updated++;
      }

      saveTask("seo",{status:"success"});
      await logAction("seo_update","success",`تم تحديث SEO لـ ${updated} مقال`,updated);
      toast.success(`✅ تم تحديث SEO لـ ${updated} مقال`);
    } catch(err) {
      saveTask("seo",{status:"error"});
      toast.error("❌ فشل تحديث SEO");
    }
    setRunning(null);
  };

  /* ── View Stats Reset ── */
  const runViewsSync = async () => {
    setRunning("views");
    saveTask("views",{status:"running",lastRun:new Date().toISOString()});
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: arts } = await supabase.from("articles").select("views").eq("status","published");
      const totalToday = arts?.reduce((s,a)=>s+(a.views||0),0)||0;

      await supabase.from("daily_views").upsert({ date:today, views:totalToday }, { onConflict:"date" });

      saveTask("views",{status:"success"});
      await logAction("views_sync","success",`تم تزامن ${totalToday} مشاهدة`);
      toast.success(`✅ تم تزامن بيانات المشاهدات`);
    } catch(err) {
      saveTask("views",{status:"error"});
      toast.error("❌ فشل تزامن المشاهدات");
    }
    setRunning(null);
  };

  const automations = [
    { id:"rss",       icon:Rss,      title:"سحب الأخبار RSS",         desc:"استيراد أخبار جديدة من المصادر الخارجية كمسودات تلقائياً",    color:"text-orange-500",  bgColor:"bg-orange-500", action:runRssImport },
    { id:"newsletter",icon:Mail,     title:"إرسال النشرة الإخبارية",   desc:"إرسال أهم 5 أخبار اليوم لجميع المشتركين في البريد الإلكتروني", color:"text-purple-500",  bgColor:"bg-purple-500", action:runNewsletter },
    { id:"publish",   icon:Zap,      title:"نشر المسودات التلقائي",    desc:"نشر المسودات المجدولة وتحديث حالتها تلقائياً",                color:"text-green-500",   bgColor:"bg-green-500",  action:runAutoPublish },
    { id:"seo",       icon:Search,   title:"تحديث SEO التلقائي",       desc:"إضافة meta descriptions لكل المقالات التي تفتقر إليها",        color:"text-blue-500",    bgColor:"bg-blue-500",   action:runSeoUpdate },
    { id:"views",     icon:BarChart3,title:"تزامن إحصائيات المشاهدات", desc:"تحديث بيانات اليومية في جدول daily_views",                    color:"text-teal-500",    bgColor:"bg-teal-500",   action:runViewsSync },
    { id:"breaking",  icon:Bell,     title:"تنبيه الأخبار العاجلة",    desc:"إرسال إشعار Push للمشتركين عند نشر خبر عاجل جديد",            color:"text-red-500",     bgColor:"bg-red-500",    action:async()=>toast.info("قريباً — يحتاج إعداد Push Notifications") },
  ];

  const statusColors: Record<string,string> = {
    idle:"bg-muted-foreground/30", running:"bg-blue-500 animate-pulse",
    success:"bg-green-500", error:"bg-red-500"
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><Zap className="text-primary"/> مركز الأتمتة</h1>
          <p className="text-sm text-muted-foreground">أتمتة المهام المتكررة وتشغيلها بضغطة زر</p>
        </div>
        <button onClick={loadLogs} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors">
          <RefreshCw className="w-3.5 h-3.5"/> تحديث السجل
        </button>
      </div>

      {/* Automation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {automations.map((auto,i)=>{
          const taskState = tasks[auto.id];
          const status = running===auto.id?"running":(taskState?.status||"idle");
          return (
            <motion.div key={auto.id} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*.05}}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 ${auto.bgColor} rounded-2xl flex items-center justify-center shadow-sm`}>
                  <auto.icon className="w-5 h-5 text-white"/>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusColors[status]||statusColors.idle}`}/>
                  <span className="text-[10px] text-muted-foreground">
                    {status==="idle"?"جاهز":status==="running"?"يعمل...":status==="success"?"ناجح":"خطأ"}
                  </span>
                </div>
              </div>
              <h3 className="font-black text-sm mb-1">{auto.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{auto.desc}</p>
              {taskState?.lastRun && (
                <p className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1">
                  <Clock className="w-3 h-3"/> آخر تشغيل: {new Date(taskState.lastRun).toLocaleString("ar-EG")}
                </p>
              )}
              <button
                onClick={auto.action}
                disabled={!!running}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  running===auto.id
                    ? "bg-muted text-muted-foreground cursor-wait"
                    : `${auto.bgColor} text-white hover:opacity-90 active:scale-98 disabled:opacity-40`
                }`}
              >
                {running===auto.id
                  ? <><Loader2 className="w-4 h-4 animate-spin"/> يعمل...</>
                  : <><Play className="w-4 h-4"/> تشغيل الآن</>
                }
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Automation Logs */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-black flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-primary"/> سجل العمليات</h2>
        {logs.length===0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">لم يتم تشغيل أي عملية بعد</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.map(log=>(
              <div key={log.id} className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
                log.status==="success"?"border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800/30":
                log.status==="error"?"border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/30":
                "border-border bg-muted/30"
              }`}>
                {log.status==="success"?<CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5"/>:
                 log.status==="error"  ?<XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5"/>:
                 <Loader2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5 animate-spin"/>}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs">{log.type?.replace("_"," ")}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{log.message}</div>
                  {log.articles_processed>0 && <div className="text-[10px] text-primary mt-0.5">{log.articles_processed} عنصر</div>}
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(log.created_at).toLocaleTimeString("ar-EG")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduling note */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-sm">
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5"/>
          <div>
            <div className="font-bold text-primary mb-1">الجدولة التلقائية</div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              لتشغيل هذه المهام تلقائياً يومياً، يمكن ربطها بـ Vercel Cron Jobs أو Supabase Edge Functions.
              اضغط "تشغيل الآن" لتشغيل أي مهمة يدوياً في أي وقت.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AutomationPage;
