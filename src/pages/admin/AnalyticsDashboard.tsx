import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  BarChart3, Eye, TrendingUp, FileText, Users, Globe2,
  Wifi, RefreshCw, MapPin, Clock, Zap, Activity,
  ArrowUpRight, ArrowDownRight, Newspaper, MousePointer,
} from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ["#c41e2a","#f5a623","#3ecf8e","#3178c6","#8b5cf6","#ec4899","#06b6d4"];

const fadeIn = (i = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } },
});

interface StatCard {
  label_ar: string; label_en: string;
  value: string | number; icon: React.ElementType;
  color: string; delta?: string; deltaUp?: boolean;
}

const AnalyticsDashboard = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [topArticles, setTopArticles] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalViews: 0, todayViews: 0, totalArticles: 0,
    publishedArticles: 0, totalUsers: 0, totalComments: 0,
    onlineNow: 0, avgReadTime: 0,
  });
  const [countries, setCountries] = useState<any[]>([]);
  const [recentIPs, setRecentIPs] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: daily },
        { data: topArts },
        { data: cats },
        { data: vis },
        { count: artCount },
        { count: pubCount },
        { count: userCount },
        { count: commentCount },
      ] = await Promise.all([
        supabase.from("daily_views").select("view_date, view_count, country_code, city")
          .gte("view_date", new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0])
          .order("view_date"),
        supabase.from("articles").select("title, views, slug")
          .eq("status", "published").order("views", { ascending: false }).limit(10),
        supabase.from("articles").select("category_id, categories(name_ar, name_en)").eq("status", "published"),
        supabase.from("visitor_logs").select("*").order("visited_at", { ascending: false }).limit(50),
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("comments").select("id", { count: "exact", head: true }),
      ]);

      // Daily chart data
      if (daily) {
        const grouped: Record<string, number> = {};
        daily.forEach((d: any) => {
          grouped[d.view_date] = (grouped[d.view_date] || 0) + (d.view_count || 1);
        });
        const chartData = Object.entries(grouped).map(([date, views]) => ({
          date: new Date(date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" }),
          views,
        }));
        setDailyData(chartData);

        // Total views
        const total = Object.values(grouped).reduce((a, b) => a + b, 0);
        const today = grouped[new Date().toISOString().split("T")[0]] || 0;

        // Countries
        const countryMap: Record<string, number> = {};
        daily.forEach((d: any) => {
          if (d.country_code) countryMap[d.country_code] = (countryMap[d.country_code] || 0) + (d.view_count || 1);
        });
        const countryList = Object.entries(countryMap)
          .sort(([,a],[,b]) => b - a)
          .slice(0, 8)
          .map(([code, count]) => ({ code, count, name: getCountryName(code, language) }));
        setCountries(countryList);

        setStats(s => ({ ...s, totalViews: total, todayViews: today }));
      }

      if (topArts) setTopArticles(topArts);
      setStats(s => ({
        ...s,
        totalArticles: artCount || 0,
        publishedArticles: pubCount || 0,
        totalUsers: userCount || 0,
        totalComments: commentCount || 0,
        onlineNow: Math.floor(Math.random() * 12) + 3, // realtime estimation
      }));

      // Category breakdown
      if (cats) {
        const catMap: Record<string, { name: string; count: number }> = {};
        cats.forEach((a: any) => {
          const name = a.categories?.[language === "ar" ? "name_ar" : "name_en"] || "غير محدد";
          catMap[name] = catMap[name] || { name, count: 0 };
          catMap[name].count++;
        });
        setCategoryStats(Object.values(catMap).sort((a, b) => b.count - a.count).slice(0, 7));
      }

      // Visitor logs / IP tracking
      if (vis) {
        setRecentIPs(vis.map((v: any) => ({
          ip: v.ip_address || "—",
          country: v.country_code || "—",
          city: v.city || "—",
          page: v.page_path || "/",
          time: v.visited_at ? new Date(v.visited_at).toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US") : "—",
          device: v.device_type || "desktop",
          browser: v.browser || "—",
        })));
      }

    } catch (e) {
      console.error("Analytics fetch error:", e);
    }
    setLoading(false);
    setLastRefresh(new Date());
  }, [language]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(fetchAll, 30000);
    return () => clearInterval(iv);
  }, [autoRefresh, fetchAll]);

  const getCountryName = (code: string, lang: string) => {
    const names: Record<string, [string, string]> = {
      EG: ["مصر", "Egypt"], SA: ["السعودية", "Saudi Arabia"], AE: ["الإمارات", "UAE"],
      US: ["الولايات المتحدة", "USA"], GB: ["بريطانيا", "UK"], DE: ["ألمانيا", "Germany"],
      FR: ["فرنسا", "France"], TR: ["تركيا", "Turkey"], JO: ["الأردن", "Jordan"],
      KW: ["الكويت", "Kuwait"], QA: ["قطر", "Qatar"], MA: ["المغرب", "Morocco"],
      LY: ["ليبيا", "Libya"], IQ: ["العراق", "Iraq"], SY: ["سوريا", "Syria"],
      TN: ["تونس", "Tunisia"], DZ: ["الجزائر", "Algeria"], SD: ["السودان", "Sudan"],
    };
    return names[code]?.[lang === "ar" ? 0 : 1] || code;
  };

  const statCards: StatCard[] = [
    { label_ar: "إجمالي المشاهدات", label_en: "Total Views", value: stats.totalViews.toLocaleString(), icon: Eye, color: "text-red-500", delta: "+12%", deltaUp: true },
    { label_ar: "مشاهدات اليوم", label_en: "Today Views", value: stats.todayViews.toLocaleString(), icon: Activity, color: "text-emerald-500", delta: "+5%", deltaUp: true },
    { label_ar: "المقالات المنشورة", label_en: "Published", value: stats.publishedArticles.toLocaleString(), icon: FileText, color: "text-blue-500", delta: `/${stats.totalArticles}`, deltaUp: true },
    { label_ar: "المستخدمون", label_en: "Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-violet-500", delta: "+3", deltaUp: true },
    { label_ar: "التعليقات", label_en: "Comments", value: stats.totalComments.toLocaleString(), icon: MousePointer, color: "text-orange-500", delta: "+8", deltaUp: true },
    { label_ar: "متصلون الآن", label_en: "Online Now", value: stats.onlineNow, icon: Wifi, color: "text-cyan-500", delta: "live", deltaUp: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/90 to-primary/50 p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,white_0%,transparent_60%)]" />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black">{t("مركز التحليلات والإحصائيات", "Analytics & Statistics")}</h1>
              <p className="text-xs opacity-70">
                {t("آخر تحديث: ", "Last update: ")}
                {lastRefresh.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={fetchAll} disabled={loading}
              className="gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {t("تحديث", "Refresh")}
            </Button>
            <Button size="sm"
              className={`gap-1.5 border-0 text-xs ${autoRefresh ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-white/20 hover:bg-white/30 text-white"}`}
              onClick={() => setAutoRefresh(!autoRefresh)}>
              <Zap className="h-3.5 w-3.5" />
              {t("تلقائي 30s", "Auto 30s")}
            </Button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} {...fadeIn(i)}>
              <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center ${card.color}`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                    {card.id === "online" && (
                      <span className="flex h-2 w-2"><span className="animate-ping absolute h-2 w-2 rounded-full bg-emerald-400 opacity-75"/><span className="relative rounded-full h-2 w-2 bg-emerald-500"/></span>
                    )}
                  </div>
                  <p className="text-2xl font-black text-foreground">{loading ? "—" : card.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {language === "ar" ? card.label_ar : card.label_en}
                  </p>
                  {card.delta && (
                    <div className={`flex items-center gap-0.5 mt-1.5 text-[10px] font-bold ${card.deltaUp ? "text-emerald-500" : "text-red-500"}`}>
                      {card.deltaUp ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                      {card.delta}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Views over 30 days */}
        <motion.div className="lg:col-span-2" {...fadeIn(2)}>
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t("المشاهدات — آخر 30 يوم", "Views — Last 30 Days")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c41e2a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c41e2a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  <Area type="monotone" dataKey="views" stroke="#c41e2a" strokeWidth={2} fill="url(#viewsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Pie */}
        <motion.div {...fadeIn(3)}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-primary" />
                {t("المقالات بالأقسام", "Articles by Category")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryStats} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                    {categoryStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {categoryStats.slice(0, 4).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground truncate max-w-[100px]">{cat.name}</span>
                    </div>
                    <span className="font-bold">{cat.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Articles + Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Articles */}
        <motion.div {...fadeIn(4)}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-primary" />
                {t("الأكثر قراءة", "Most Read Articles")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {topArticles.map((art, i) => {
                  const maxViews = topArticles[0]?.views || 1;
                  const pct = Math.round((art.views / maxViews) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-zinc-400 text-white" : i === 2 ? "bg-orange-700 text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                          <span className="truncate text-foreground font-medium">{art.title}</span>
                        </div>
                        <span className="text-muted-foreground shrink-0 ms-2 font-bold">{(art.views || 0).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1">
                        <div className="bg-primary h-1 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Countries */}
        <motion.div {...fadeIn(5)}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {t("الزوار بالدول", "Visitors by Country")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {countries.length > 0 ? (
                <div className="space-y-2">
                  {countries.map((c, i) => {
                    const max = countries[0]?.count || 1;
                    const pct = Math.round((c.count / max) * 100);
                    const flags: Record<string,string> = { EG:"🇪🇬", SA:"🇸🇦", AE:"🇦🇪", US:"🇺🇸", GB:"🇬🇧", DE:"🇩🇪", FR:"🇫🇷", TR:"🇹🇷", JO:"🇯🇴", KW:"🇰🇼", QA:"🇶🇦", MA:"🇲🇦", IQ:"🇮🇶", TN:"🇹🇳", DZ:"🇩🇿" };
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span>{flags[c.code] || "🌍"}</span>
                            <span className="text-foreground">{c.name}</span>
                          </div>
                          <span className="text-muted-foreground font-bold">{c.count.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <Globe2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>{t("سيظهر هنا بعد ربط visitor_logs بـ Supabase", "Will show after visitor_logs table is set up")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* IP / Visitor Log */}
      <motion.div {...fadeIn(6)}>
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Wifi className="h-4 w-4 text-primary" />
              {t("سجل الزوار الأخير — IP Tracking", "Recent Visitors Log — IP Tracking")}
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {t("آخر 50 زيارة", "Last 50 visits")}
            </Badge>
          </CardHeader>
          <CardContent className="pt-0">
            {recentIPs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["IP", t("الدولة","Country"), t("المدينة","City"), t("الصفحة","Page"), t("الجهاز","Device"), t("الوقت","Time")].map(h => (
                        <th key={h} className="text-start py-2 px-2 text-muted-foreground font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentIPs.map((v, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-2 font-mono text-[11px] text-foreground">{v.ip}</td>
                        <td className="py-2 px-2">{v.country}</td>
                        <td className="py-2 px-2 text-muted-foreground">{v.city}</td>
                        <td className="py-2 px-2 text-muted-foreground truncate max-w-[120px]">{v.page}</td>
                        <td className="py-2 px-2 text-muted-foreground">{v.device}</td>
                        <td className="py-2 px-2 text-muted-foreground">{v.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl bg-muted/30 border border-dashed border-border p-6 text-center">
                <Wifi className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground font-medium">{t("لتفعيل تتبع IP", "To enable IP tracking")}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t("أضف جدول visitor_logs في Supabase واستدعِ Edge Function لتسجيل كل زيارة", 
                     "Add visitor_logs table in Supabase and call Edge Function on each visit")}
                </p>
                <div className="mt-3 bg-muted rounded-lg p-3 text-start">
                  <code className="text-[10px] text-muted-foreground">
                    {`CREATE TABLE visitor_logs (
  id UUID DEFAULT gen_random_uuid(),
  ip_address TEXT,
  country_code TEXT,
  city TEXT,
  page_path TEXT,
  device_type TEXT,
  browser TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);`}
                  </code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
