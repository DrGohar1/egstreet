import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FileText, Eye, Users, Zap, TrendingUp, Clock, Star,
  MessageSquare, ArrowUpRight, ArrowDownRight, RefreshCw,
  Plus, Send, BarChart3, Bell, Megaphone, Globe,
  ChevronLeft, Flame, Newspaper, Activity, CalendarDays,
  PenLine, Award, Target, Layers
} from "lucide-react";

const ADMIN = "/G63-admin";

// ─── Mini sparkline (pure SVG, no deps) ──────────────────
const Spark = ({ data, color = "#6366f1" }: { data: number[]; color?: string }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const W = 80; const H = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * H;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// ─── KPI Card ────────────────────────────────────────────
const KpiCard = ({
  icon: Icon, label, value, prev, color, bg, spark, to, prefix = "", suffix = ""
}: any) => {
  const nav = useNavigate();
  const pct = prev > 0 ? ((value - prev) / prev * 100).toFixed(1) : null;
  const up  = pct !== null ? parseFloat(pct) >= 0 : null;
  const fmt = (n: number) => n >= 1_000_000 ? (n/1_000_000).toFixed(1)+"م" : n >= 1_000 ? (n/1_000).toFixed(1)+"ك" : String(n);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 12px 40px -8px rgba(0,0,0,.18)" }}
      onClick={() => to && nav(to)}
      className={`relative overflow-hidden rounded-2xl border border-white/5 p-4 cursor-pointer select-none ${bg || "bg-card"} transition-all duration-200`}
    >
      {/* Glow orb */}
      <div className={`absolute -top-6 -left-6 w-20 h-20 rounded-full blur-2xl opacity-20 ${color}`}/>

      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-15`}>
          <Icon className={`w-5 h-5 ${color.replace("bg-","text-")}`}/>
        </div>
        {pct !== null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-black px-2 py-0.5 rounded-full ${up ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
            {up ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
            {Math.abs(parseFloat(pct))}%
          </span>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-black tracking-tight text-foreground">
            {prefix}{fmt(value)}{suffix}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">{label}</div>
          {prev > 0 && (
            <div className="text-[10px] text-muted-foreground/60 mt-0.5">
              الفترة السابقة: {fmt(prev)}
            </div>
          )}
        </div>
        {spark?.length > 1 && (
          <div className="mb-1">
            <Spark data={spark} color={color.includes("red") ? "#ef4444" : color.includes("green") ? "#22c55e" : color.includes("yellow") ? "#eab308" : color.includes("purple") ? "#a855f7" : color.includes("blue") ? "#3b82f6" : "#6366f1"}/>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Quick Action Button ──────────────────────────────────
const QAction = ({ icon: Icon, label, to, color }: any) => {
  const nav = useNavigate();
  return (
    <motion.button
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
      onClick={() => nav(to)}
      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-border hover:border-primary/40 bg-card transition-all text-center w-full`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 text-white"/>
      </div>
      <span className="text-[10px] font-bold text-muted-foreground leading-tight">{label}</span>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════
const RANGES = [
  { key: "today",  label: "اليوم"     },
  { key: "week",   label: "هذا الأسبوع" },
  { key: "month",  label: "هذا الشهر"  },
  { key: "all",    label: "الكل"       },
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const [range,        setRange]        = useState("month");
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [displayName,  setDisplayName]  = useState("");
  const [greeting,     setGreeting]     = useState("");
  const [stats,        setStats]        = useState({
    articles: 0, prevArticles: 0,
    views: 0, prevViews: 0,
    subscribers: 0, prevSubscribers: 0,
    comments: 0, prevComments: 0,
    breaking: 0, featured: 0,
    drafts: 0, users: 0,
    adClicks: 0, adImpressions: 0,
  });
  const [recent,       setRecent]       = useState<any[]>([]);
  const [top,          setTop]          = useState<any[]>([]);
  const [viewsHistory, setViewsHistory] = useState<number[]>([]);
  const [artHistory,   setArtHistory]   = useState<number[]>([]);

  // greeting
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "صباح النور" : h < 17 ? "مساء النور" : "مساء الخير");
    if (user) {
      supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
        .then(({ data }) => setDisplayName(data?.display_name || user.email?.split("@")[0] || ""));
    }
  }, [user]);

  const rangeFilter = useCallback(() => {
    const now = new Date();
    const d = new Date(now);
    if (range === "today") d.setHours(0,0,0,0);
    else if (range === "week")  d.setDate(d.getDate()-7);
    else if (range === "month") d.setDate(d.getDate()-30);
    else return null;
    return d.toISOString();
  }, [range]);

  const prevRangeFilter = useCallback(() => {
    const now = new Date();
    const d = new Date(now); const d2 = new Date(now);
    if (range === "today") { d.setDate(d.getDate()-1); d.setHours(0,0,0,0); d2.setHours(0,0,0,0); }
    else if (range === "week")  { d.setDate(d.getDate()-14); d2.setDate(d2.getDate()-7); }
    else if (range === "month") { d.setDate(d.getDate()-60); d2.setDate(d2.getDate()-30); }
    else return null;
    return { from: d.toISOString(), to: d2.toISOString() };
  }, [range]);

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    const from = rangeFilter();
    const prev = prevRangeFilter();

    let artQ = supabase.from("articles").select("id,status,is_featured,is_breaking,views,title,slug,published_at,featured_image,created_at");
    if (from) artQ = artQ.gte("created_at", from);
    const { data: arts } = await artQ;

    let prevArtQ = supabase.from("articles").select("id,status,views,created_at");
    if (prev) prevArtQ = prevArtQ.gte("created_at", prev.from).lte("created_at", prev.to);
    const { data: prevArts } = await prevArtQ;

    const [subsR, prevSubsR, commR, prevCommR, usersR, brk, adsR] = await Promise.all([
      supabase.from("newsletter_subscribers").select("id,created_at", { count: "exact" }).then(r => ({ count: r.count || 0 })),
      prev
        ? supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).lte("created_at", prev.to).then(r => ({ count: r.count || 0 }))
        : Promise.resolve({ count: 0 }),
      supabase.from("comments").select("id", { count: "exact", head: true }).then(r => ({ count: r.count || 0 })),
      prev
        ? supabase.from("comments").select("id", { count: "exact", head: true }).lte("created_at", prev.to).then(r => ({ count: r.count || 0 }))
        : Promise.resolve({ count: 0 }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).then(r => ({ count: r.count || 0 })),
      supabase.from("breaking_news").select("id", { count: "exact", head: true }).eq("is_active", true).then(r => ({ count: r.count || 0 })),
      supabase.from("advertisements").select("clicks,impressions").then(r => r),
    ]);

    const published  = (arts || []).filter(a => a.status === "published");
    const totalViews = (arts || []).reduce((s, a) => s + (a.views || 0), 0);
    const prevViews  = (prevArts || []).reduce((s, a) => s + (a.views || 0), 0);
    const adClicks   = (adsR.data || []).reduce((s, a) => s + (a.clicks || 0), 0);
    const adImpr     = (adsR.data || []).reduce((s, a) => s + (a.impressions || 0), 0);

    // Build sparklines: last 7 days views
    const viewsByDay: number[] = Array(7).fill(0);
    const artsByDay:  number[] = Array(7).fill(0);
    (arts || []).forEach(a => {
      const d = new Date(a.created_at || a.published_at || "");
      const daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (daysAgo >= 0 && daysAgo < 7) {
        viewsByDay[6 - daysAgo] += (a.views || 0);
        artsByDay[6 - daysAgo]  += 1;
      }
    });

    setStats({
      articles: published.length,      prevArticles: (prevArts || []).filter(a => a.status === "published").length,
      views:    totalViews,             prevViews,
      subscribers: subsR.count,        prevSubscribers: prevSubsR.count,
      comments:    commR.count,        prevComments:    prevCommR.count,
      breaking: brk.count || 0,        featured: (arts || []).filter(a => a.is_featured).length,
      drafts:   (arts || []).filter(a => a.status === "draft").length,
      users:    usersR.count,
      adClicks, adImpressions: adImpr,
    });
    setRecent([...(arts || [])].filter(a => a.status === "published").sort((x,y) => new Date(y.published_at||0).getTime() - new Date(x.published_at||0).getTime()).slice(0,6));
    setTop([...(arts || [])].filter(a => a.status === "published").sort((x,y) => (y.views||0)-(x.views||0)).slice(0,5));
    setViewsHistory(viewsByDay);
    setArtHistory(artsByDay);

    quiet ? setRefreshing(false) : setLoading(false);
  }, [rangeFilter, prevRangeFilter]);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toLocaleDateString("ar-EG", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  // ── KPI cards config ─────────────────────────────────────
  const kpis = [
    { icon: Newspaper,    label:"المقالات المنشورة",  value:stats.articles,    prev:stats.prevArticles,    color:"bg-primary",   bg:"bg-gradient-to-br from-primary/10 to-primary/5",   spark:artHistory,   to:`${ADMIN}/articles`    },
    { icon: Eye,          label:"إجمالي المشاهدات",   value:stats.views,       prev:stats.prevViews,       color:"bg-blue-500",  bg:"bg-gradient-to-br from-blue-500/10 to-blue-500/5",  spark:viewsHistory, to:`${ADMIN}/analytics`   },
    { icon: Users,        label:"المشتركون",           value:stats.subscribers, prev:stats.prevSubscribers, color:"bg-purple-500",bg:"bg-gradient-to-br from-purple-500/10 to-purple-500/5",spark:[],          to:`${ADMIN}/subscribers` },
    { icon: MessageSquare,label:"التعليقات",           value:stats.comments,   prev:stats.prevComments,    color:"bg-green-500", bg:"bg-gradient-to-br from-green-500/10 to-green-500/5",  spark:[],          to:`${ADMIN}/comments`    },
    { icon: Zap,          label:"الأخبار العاجلة",    value:stats.breaking,   prev:0,                     color:"bg-red-500",   bg:"bg-gradient-to-br from-red-500/10 to-red-500/5",      spark:[],          to:`${ADMIN}/breaking`    },
    { icon: Star,         label:"الأخبار المميزة",    value:stats.featured,   prev:0,                     color:"bg-yellow-500",bg:"bg-gradient-to-br from-yellow-500/10 to-yellow-500/5",  spark:[],         to:`${ADMIN}/articles`    },
    { icon: Globe,        label:"المستخدمون",         value:stats.users,      prev:0,                     color:"bg-teal-500",  bg:"bg-gradient-to-br from-teal-500/10 to-teal-500/5",     spark:[],         to:`${ADMIN}/users`       },
    { icon: Megaphone,    label:"نقرات الإعلانات",    value:stats.adClicks,   prev:0,                     color:"bg-orange-500",bg:"bg-gradient-to-br from-orange-500/10 to-orange-500/5",  spark:[],         to:`${ADMIN}/advertisements` },
  ];

  const quick = [
    { icon:PenLine,   label:"مقال جديد",      to:`${ADMIN}/articles/new`,      color:"bg-primary"      },
    { icon:Zap,       label:"خبر عاجل",       to:`${ADMIN}/breaking`,          color:"bg-red-500"      },
    { icon:Users,     label:"المستخدمون",      to:`${ADMIN}/users`,             color:"bg-purple-500"   },
    { icon:Megaphone, label:"إعلان جديد",     to:`${ADMIN}/advertisements`,    color:"bg-orange-500"   },
    { icon:BarChart3, label:"التحليلات",       to:`${ADMIN}/analytics`,         color:"bg-blue-500"     },
    { icon:Layers,    label:"الأقسام",         to:`${ADMIN}/categories`,        color:"bg-teal-500"     },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8" dir="rtl">

      {/* ── Hero Header ── */}
      <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-primary/20 via-primary/10 to-transparent border border-primary/20 p-5 sm:p-6">
        {/* BG decoration */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute -bottom-8 left-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"/>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
              <span className="text-[11px] text-green-500 font-bold uppercase tracking-wider">Live Dashboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              {greeting}، <span className="text-primary">{displayName}</span> 👋
            </h1>
            <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5"/> {today}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Range selector */}
            <div className="flex bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-0.5 gap-0.5">
              {RANGES.map(r => (
                <button key={r.key} onClick={() => setRange(r.key)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${range===r.key?"bg-primary text-white shadow-sm":"text-muted-foreground hover:text-foreground"}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={() => load(true)} disabled={refreshing}
              className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <RefreshCw className={`w-4 h-4 ${refreshing?"animate-spin":""}`}/>
            </button>
          </div>
        </div>

        {/* Quick stats pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { label:`${stats.articles} منشور`,     color:"bg-primary/15 text-primary",      icon:FileText   },
            { label:`${stats.drafts} مسودة`,        color:"bg-orange-500/15 text-orange-500",icon:Clock      },
            { label:`${stats.views.toLocaleString("ar-EG")} مشاهدة`, color:"bg-blue-500/15 text-blue-500",icon:Eye },
            { label:`${stats.breaking} عاجل`,       color:"bg-red-500/15 text-red-500",      icon:Flame      },
          ].map(p => (
            <span key={p.label} className={`flex items-center gap-1.5 ${p.color} px-3 py-1 rounded-full text-[11px] font-bold`}>
              <p.icon className="w-3 h-3"/> {p.label}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── KPI Grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array(8).fill(0).map((_,i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 h-28 animate-pulse">
              <div className="w-10 h-10 bg-muted rounded-xl mb-3"/>
              <div className="w-16 h-6 bg-muted rounded-lg mb-2"/>
              <div className="w-24 h-3 bg-muted rounded"/>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.04 }}>
              <KpiCard {...k}/>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary"/>
          <h2 className="font-black text-sm">إجراءات سريعة</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {quick.map((q, i) => (
            <motion.div key={q.label} initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i*0.04 }}>
              <QAction {...q}/>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Main content: 2 cols ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Recent articles — 3 cols */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-black text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary"/> آخر المقالات
            </h2>
            <NavLink to={`${ADMIN}/articles`}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-bold">
              عرض الكل <ChevronLeft className="w-3 h-3"/>
            </NavLink>
          </div>
          <div className="divide-y divide-border">
            <AnimatePresence>
              {recent.map((a, i) => (
                <motion.div key={a.id}
                  initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.04 }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors group">
                  {/* Thumbnail */}
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                    {a.featured_image
                      ? <img src={a.featured_image} alt="" className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center"><Newspaper className="w-4 h-4 text-muted-foreground"/></div>
                    }
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold line-clamp-1 group-hover:text-primary transition-colors">{a.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Eye className="w-3 h-3"/> {(a.views||0).toLocaleString("ar-EG")}
                      </span>
                      {a.published_at && (
                        <span className="text-[10px] text-muted-foreground/60">
                          {new Date(a.published_at).toLocaleDateString("ar-EG", { month:"short", day:"numeric" })}
                        </span>
                      )}
                      {a.is_breaking && <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full font-bold">عاجل</span>}
                      {a.is_featured && <span className="text-[9px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded-full font-bold">مميز</span>}
                    </div>
                  </div>
                  <NavLink to={`${ADMIN}/articles/edit/${a.id}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                    <ChevronLeft className="w-4 h-4"/>
                  </NavLink>
                </motion.div>
              ))}
            </AnimatePresence>
            {!loading && recent.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-20"/>
                <p className="text-xs">لا يوجد مقالات بعد</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — 2 cols */}
        <div className="lg:col-span-2 space-y-4">

          {/* Top articles */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
              <TrendingUp className="w-4 h-4 text-primary"/>
              <h2 className="font-black text-sm">الأكثر قراءة</h2>
            </div>
            <div className="p-3 space-y-2">
              {top.map((a, i) => {
                const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
                return (
                  <div key={a.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/50 transition-colors group">
                    <span className="text-base shrink-0 w-6 text-center">{medals[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold line-clamp-1 group-hover:text-primary transition-colors">{a.title}</p>
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Eye className="w-2.5 h-2.5"/> {(a.views||0).toLocaleString("ar-EG")}
                      </span>
                    </div>
                  </div>
                );
              })}
              {top.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-xs">لا توجد بيانات</div>
              )}
            </div>
          </div>

          {/* Ad stats */}
          <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/5 border border-orange-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="w-4 h-4 text-orange-500"/>
              <h3 className="font-black text-sm">أداء الإعلانات</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label:"النقرات",    val:stats.adClicks,      icon:Award,    color:"text-orange-500" },
                { label:"المشاهدات", val:stats.adImpressions, icon:BarChart3, color:"text-yellow-500" },
              ].map(s => (
                <div key={s.label} className="bg-black/10 rounded-xl p-2.5 text-center">
                  <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`}/>
                  <p className="text-lg font-black">{s.val.toLocaleString("ar-EG")}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <NavLink to={`${ADMIN}/advertisements`}
              className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-orange-500 font-bold hover:underline">
              إدارة الإعلانات <ChevronLeft className="w-3 h-3"/>
            </NavLink>
          </div>

          {/* Publish button */}
          <NavLink to={`${ADMIN}/articles/new`}
            className="flex items-center justify-center gap-2 w-full bg-primary text-white font-black py-3.5 rounded-2xl hover:bg-primary/85 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5">
            <Plus className="w-4 h-4"/> كتابة مقال جديد
          </NavLink>
        </div>
      </div>
    </div>
  );
}
