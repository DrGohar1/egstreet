import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Eye, Users, FileText, TrendingUp, Globe, BarChart3, Clock, Flame, ArrowUp, ArrowDown } from "lucide-react";

interface Stats {
  totalArticles: number; publishedArticles: number; draftArticles: number;
  totalViews: number; todayViews: number; subscribers: number;
  totalUsers: number; breakingCount: number; featuredCount: number;
  topArticles: any[]; viewsByCategory: any[]; recentActivity: any[];
}

const StatCard = ({ icon: Icon, label, value, sub, color, trend }: any) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center gap-0.5 text-xs font-bold ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
          {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="text-2xl font-black text-foreground">{typeof value === "number" ? value.toLocaleString("ar-EG") : value}</div>
    <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </motion.div>
);

const AnalyticsDashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [artR, subsR, usersR, viewsR, topR, breakR] = await Promise.all([
      supabase.from("articles").select("id,status,is_featured,is_breaking,views,published_at,title,slug,featured_image,category_id"),
      supabase.from("subscribers").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("daily_views").select("views,date").gte("date", today.toISOString().split("T")[0]).limit(30),
      supabase.from("articles").select("id,title,slug,views,featured_image,published_at").eq("status","published").order("views", { ascending: false }).limit(5),
      supabase.from("breaking_news").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);

    const arts = artR.data || [];
    const totalViews = arts.reduce((sum, a) => sum + (a.views || 0), 0);
    const todayViews = (viewsR.data || []).reduce((s, v) => s + (v.views || 0), 0);

    setStats({
      totalArticles: arts.length,
      publishedArticles: arts.filter(a => a.status === "published").length,
      draftArticles: arts.filter(a => a.status === "draft").length,
      totalViews,
      todayViews,
      subscribers: subsR.count || 0,
      totalUsers: usersR.count || 0,
      breakingCount: breakR.count || 0,
      featuredCount: arts.filter(a => a.is_featured).length,
      topArticles: topR.data || [],
      viewsByCategory: [],
      recentActivity: arts.filter(a => a.status === "published").slice(0, 6),
    });
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!stats) return null;
  const s = stats;

  return (
    <div className="space-y-6 p-1" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><BarChart3 className="text-primary" /> {t("التحليلات", "Analytics")}</h1>
          <p className="text-muted-foreground text-sm">{t("إحصائيات الموقع المباشرة — تتحدث كل 30 ثانية", "Live stats — refreshes every 30s")}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 text-xs px-3 py-1.5 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {t("مباشر", "Live")}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Eye} label={t("إجمالي المشاهدات", "Total Views")} value={s.totalViews} sub={t(`اليوم: ${s.todayViews}`, `Today: ${s.todayViews}`)} color="bg-blue-500" trend={12} />
        <StatCard icon={FileText} label={t("المقالات المنشورة", "Published")} value={s.publishedArticles} sub={t(`مسودة: ${s.draftArticles}`, `Drafts: ${s.draftArticles}`)} color="bg-primary" trend={5} />
        <StatCard icon={Users} label={t("المشتركون", "Subscribers")} value={s.subscribers} sub={t("في النشرة الإخبارية", "Newsletter")} color="bg-purple-500" trend={8} />
        <StatCard icon={Flame} label={t("الأخبار العاجلة", "Breaking News")} value={s.breakingCount} sub={t("نشطة الآن", "Active now")} color="bg-red-500" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label={t("الأخبار المميزة", "Featured")} value={s.featuredCount} color="bg-yellow-500" />
        <StatCard icon={Globe} label={t("إجمالي المقالات", "Total Articles")} value={s.totalArticles} color="bg-teal-500" />
        <StatCard icon={Users} label={t("المستخدمون", "Users")} value={s.totalUsers} sub={t("في لوحة التحكم", "Admin users")} color="bg-indigo-500" />
        <StatCard icon={Clock} label={t("مشاهدات اليوم", "Today Views")} value={s.todayViews} color="bg-orange-500" trend={s.todayViews > 0 ? 100 : 0} />
      </div>

      {/* Top Articles */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-black text-lg mb-4 flex items-center gap-2"><TrendingUp className="text-primary w-5 h-5" /> {t("الأكثر قراءة", "Most Read")}</h2>
        <div className="space-y-3">
          {s.topArticles.length === 0 && <p className="text-muted-foreground text-sm">{t("لا توجد بيانات بعد", "No data yet")}</p>}
          {s.topArticles.map((a, i) => (
            <div key={a.id} className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 ${i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </span>
              {a.featured_image && <img src={a.featured_image} alt="" className="w-12 h-9 object-cover rounded-lg shrink-0" onError={e => (e.target as any).style.display="none"} />}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm line-clamp-1">{a.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" /> {(a.views || 0).toLocaleString("ar-EG")} {t("مشاهدة", "views")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Articles */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-black text-lg mb-4 flex items-center gap-2"><Clock className="text-primary w-5 h-5" /> {t("آخر المنشورات", "Recent Posts")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {s.recentActivity.map(a => (
            <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
              {a.featured_image && <img src={a.featured_image} alt="" className="w-10 h-10 object-cover rounded-lg shrink-0" onError={e => (e.target as any).style.display="none"} />}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold line-clamp-2 leading-snug">{a.title}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{a.published_at ? new Date(a.published_at).toLocaleDateString("ar-EG") : ""}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
