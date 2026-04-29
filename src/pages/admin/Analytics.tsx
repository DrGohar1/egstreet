import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart2, Users, Eye, Globe, Monitor, Smartphone,
  Clock, TrendingUp, RefreshCw, Loader2, ArrowUp, ArrowDown,
  MapPin, Newspaper, Calendar, Activity, Wifi, Hash
} from "lucide-react";

type ViewRow = {
  id: string; article_id: string | null; user_ip: string | null;
  user_agent: string | null; referrer: string | null;
  country: string | null; created_at: string;
  article_title?: string; article_slug?: string;
};

type TopArticle = { id: string; title: string; slug: string; views: number; published_at: string | null; };
type TopIP = { ip: string; count: number; last_seen: string; };

const deviceType = (ua: string | null) => {
  if (!ua) return "unknown";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
};

const browserName = (ua: string | null) => {
  if (!ua) return "Unknown";
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return "Chrome";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  if (/Edg/i.test(ua)) return "Edge";
  if (/OPR|Opera/i.test(ua)) return "Opera";
  return "Other";
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "الآن";
  if (m < 60) return `${m} دقيقة`;
  const hr = Math.floor(m / 60);
  if (hr < 24) return `${hr} ساعة`;
  return new Date(d).toLocaleDateString("ar-EG");
};

export default function AnalyticsPage() {
  const [views,       setViews]       = useState<ViewRow[]>([]);
  const [articles,    setArticles]    = useState<TopArticle[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [range,       setRange]       = useState<7|30|90>(7);
  const [activeTab,   setActiveTab]   = useState<"overview"|"visitors"|"articles"|"realtime">("overview");

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - range * 86400000).toISOString();

    // Get article views with article info
    const { data: v } = await supabase
      .from("daily_views")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);
    setViews(v || []);

    // Get top articles by views
    const { data: arts } = await supabase
      .from("articles")
      .select("id,title,slug,views,published_at")
      .eq("status", "published")
      .order("views", { ascending: false })
      .limit(20);
    setArticles(arts || []);

    setLoading(false);
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // Computed stats
  const totalViews     = views.length;
  const uniqueIPs      = new Set(views.map(v => v.user_ip).filter(Boolean)).size;
  const mobileCount    = views.filter(v => deviceType(v.user_agent) === "mobile").length;
  const desktopCount   = views.filter(v => deviceType(v.user_agent) === "desktop").length;
  const mobilePercent  = totalViews > 0 ? Math.round((mobileCount / totalViews) * 100) : 0;

  // Top IPs
  const ipMap: Record<string, { count: number; last_seen: string }> = {};
  views.forEach(v => {
    if (!v.user_ip) return;
    if (!ipMap[v.user_ip]) ipMap[v.user_ip] = { count: 0, last_seen: v.created_at };
    ipMap[v.user_ip].count++;
    if (v.created_at > ipMap[v.user_ip].last_seen) ipMap[v.user_ip].last_seen = v.created_at;
  });
  const topIPs: TopIP[] = Object.entries(ipMap)
    .map(([ip, d]) => ({ ip, ...d }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Daily breakdown (last 7 days)
  const dailyMap: Record<string, number> = {};
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  views.forEach(v => {
    const day = v.created_at.slice(0, 10);
    if (day in dailyMap) dailyMap[day]++;
  });
  const dailyData = Object.entries(dailyMap);
  const maxDay = Math.max(...Object.values(dailyMap), 1);

  // Browser stats
  const browserMap: Record<string, number> = {};
  views.forEach(v => {
    const b = browserName(v.user_agent);
    browserMap[b] = (browserMap[b] || 0) + 1;
  });

  // Referrer stats
  const refMap: Record<string, number> = {};
  views.forEach(v => {
    const ref = v.referrer ? (v.referrer.includes("google") ? "Google" :
      v.referrer.includes("facebook") ? "Facebook" :
      v.referrer.includes("twitter") || v.referrer.includes("x.com") ? "X / Twitter" :
      v.referrer.includes("whatsapp") ? "WhatsApp" :
      "Direct") : "Direct";
    refMap[ref] = (refMap[ref] || 0) + 1;
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary"/> التحليلات المتقدمة
          </h1>
          <p className="text-xs text-muted-foreground">مراقبة الزوار والمحتوى في الوقت الفعلي</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-xl p-1 gap-1">
            {([7,30,90] as const).map(d => (
              <button key={d} onClick={() => setRange(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range===d?"bg-card shadow-sm text-foreground":"text-muted-foreground"}`}>
                {d} يوم
              </button>
            ))}
          </div>
          <button onClick={load} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted">
            <RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"إجمالي المشاهدات", val:totalViews.toLocaleString("ar"),  icon:<Eye className="w-4 h-4"/>,      color:"text-blue-500",   bg:"bg-blue-50 dark:bg-blue-950/30" },
          { label:"زوار فريدون",       val:uniqueIPs.toLocaleString("ar"),   icon:<Users className="w-4 h-4"/>,    color:"text-green-500",  bg:"bg-green-50 dark:bg-green-950/30" },
          { label:"من الموبايل",       val:`${mobilePercent}%`,              icon:<Smartphone className="w-4 h-4"/>,color:"text-violet-500", bg:"bg-violet-50 dark:bg-violet-950/30" },
          { label:"أفضل مقال (مشاهدات)",val:articles[0]?.views?.toLocaleString("ar")||"0", icon:<TrendingUp className="w-4 h-4"/>, color:"text-amber-500", bg:"bg-amber-50 dark:bg-amber-950/30" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 border border-border`}>
            <div className={`${s.color} mb-1`}>{s.icon}</div>
            <p className="text-xl font-black">{loading ? "..." : s.val}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
        {[
          { key:"overview",  label:"📊 نظرة عامة" },
          { key:"visitors",  label:"🌐 الزوار والـ IP" },
          { key:"articles",  label:"📰 المقالات" },
          { key:"realtime",  label:"⚡ مباشر" },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab===t.key?"bg-card shadow-sm text-foreground":"text-muted-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
      ) : (
        <>
          {/* ═══ Overview ═══ */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Daily chart */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary"/> المشاهدات اليومية
                </h3>
                <div className="flex items-end gap-1 h-32">
                  {dailyData.map(([day, count]) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[8px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                        {count}
                      </span>
                      <div className="w-full rounded-t-md bg-primary/20 hover:bg-primary transition-colors"
                        style={{ height: `${Math.max(4, (count / maxDay) * 100)}%` }}/>
                      <span className="text-[7px] text-muted-foreground rotate-45 origin-left">
                        {new Date(day).toLocaleDateString("ar", { day:"numeric", month:"short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Browser + Referrer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-black text-sm mb-3 flex items-center gap-2"><Monitor className="w-4 h-4"/> المتصفحات</h3>
                  <div className="space-y-2">
                    {Object.entries(browserMap).sort((a,b)=>b[1]-a[1]).map(([b,c])=>(
                      <div key={b} className="flex items-center gap-2">
                        <span className="text-xs font-bold w-16 truncate">{b}</span>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{width:`${(c/totalViews)*100}%`}}/>
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-left">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-black text-sm mb-3 flex items-center gap-2"><Globe className="w-4 h-4"/> مصادر الزيارات</h3>
                  <div className="space-y-2">
                    {Object.entries(refMap).sort((a,b)=>b[1]-a[1]).map(([ref,c])=>(
                      <div key={ref} className="flex items-center gap-2">
                        <span className="text-xs font-bold w-20 truncate">{ref}</span>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{width:`${(c/totalViews)*100}%`}}/>
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-left">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Visitors / IP ═══ */}
          {activeTab === "visitors" && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-primary"/>
                  <h3 className="font-black text-sm">عناوين IP ({topIPs.length} زائر)</h3>
                </div>
                <div className="divide-y divide-border">
                  {topIPs.map((ip, i) => (
                    <div key={ip.ip} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <span className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center ${i<3?"bg-primary text-white":"bg-muted text-muted-foreground"}`}>
                        {i+1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-bold">{ip.ip}</p>
                        <p className="text-[10px] text-muted-foreground">آخر زيارة: {timeAgo(ip.last_seen)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-bold">
                          {ip.count} مشاهدة
                        </span>
                      </div>
                    </div>
                  ))}
                  {topIPs.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-sm">لا توجد بيانات IP</div>
                  )}
                </div>
              </div>

              {/* Recent visits */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-black text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-primary"/> آخر الزيارات</h3>
                </div>
                <div className="divide-y divide-border">
                  {views.slice(0,30).map(v => (
                    <div key={v.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${deviceType(v.user_agent)==="mobile"?"bg-violet-100 text-violet-600":"bg-blue-100 text-blue-600"}`}>
                        {deviceType(v.user_agent)==="mobile" ? <Smartphone className="w-3.5 h-3.5"/> : <Monitor className="w-3.5 h-3.5"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold">{v.user_ip || "—"}</span>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{browserName(v.user_agent)}</span>
                          {v.referrer && v.referrer.includes("google") && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">Google</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {timeAgo(v.created_at)} · {v.referrer || "مباشر"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ Articles ═══ */}
          {activeTab === "articles" && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-black text-sm flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-primary"/> أكثر المقالات مشاهدة
                </h3>
              </div>
              <div className="divide-y divide-border">
                {articles.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
                    <span className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${i<3?"bg-primary text-white":"bg-muted text-muted-foreground"}`}>
                      {i+1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {a.published_at ? new Date(a.published_at).toLocaleDateString("ar-EG") : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground"/>
                      <span className="text-sm font-black text-primary">{(a.views||0).toLocaleString("ar")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Realtime ═══ */}
          {activeTab === "realtime" && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                  <h3 className="font-black text-sm">النشاط في آخر 24 ساعة</h3>
                </div>
                <div className="space-y-2">
                  {views.filter(v => Date.now() - new Date(v.created_at).getTime() < 86400000).slice(0,50).map(v => (
                    <div key={v.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/40 last:border-0">
                      <span className="text-muted-foreground w-20 shrink-0">{timeAgo(v.created_at)}</span>
                      <span className="font-mono font-bold text-foreground">{v.user_ip || "—"}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${deviceType(v.user_agent)==="mobile"?"bg-violet-100 text-violet-700":"bg-blue-100 text-blue-700"}`}>
                        {deviceType(v.user_agent)}
                      </span>
                      <span className="text-muted-foreground flex-1 truncate">{v.referrer || "Direct"}</span>
                    </div>
                  ))}
                  {views.filter(v => Date.now() - new Date(v.created_at).getTime() < 86400000).length === 0 && (
                    <p className="text-center py-8 text-muted-foreground text-sm">لا يوجد نشاط في آخر 24 ساعة</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
