import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { FileText, Eye, Users, Zap, TrendingUp, Clock, Star, Globe, ArrowLeft } from "lucide-react";
import { NavLink } from "react-router-dom";

const ADMIN = "/G63-admin";

const Card = ({ icon: Icon, label, value, color, to }: any) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
    className="bg-card border border-border rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 group">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {to && (
        <NavLink to={to} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
          <ArrowLeft className="w-4 h-4" />
        </NavLink>
      )}
    </div>
    <div className="text-3xl font-black text-foreground mt-2">{String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
    <div className="text-sm font-medium text-muted-foreground mt-1">{label}</div>
  </motion.div>
);

const DashboardOverview = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ articles: 0, views: 0, subscribers: 0, breaking: 0, featured: 0, drafts: 0, users: 0, comments: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [topArticles, setTopArticles] = useState<any[]>([]);
  const [greeting, setGreeting] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "صباح الخير" : h < 17 ? "مساء النور" : "مساء الخير");
    if (user) {
      supabase.from("profiles").select("display_name").eq("id", user.id).single()
        .then(({ data }) => setDisplayName(data?.display_name || user.email?.split("@")[0] || ""));
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    const [artR, subsR, brk, usersR, commR] = await Promise.all([
      supabase.from("articles").select("id,status,is_featured,is_breaking,views,title,slug,published_at,featured_image"),
      supabase.from("subscribers").select("id", { count: "exact", head: true }),
      supabase.from("breaking_news").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("comments").select("id", { count: "exact", head: true }),
    ]);

    const arts = artR.data || [];
    setStats({
      articles: arts.filter(a => a.status === "published").length,
      views: arts.reduce((s, a) => s + (a.views || 0), 0),
      subscribers: subsR.count || 0,
      breaking: brk.count || 0,
      featured: arts.filter(a => a.is_featured).length,
      drafts: arts.filter(a => a.status === "draft").length,
      users: usersR.count || 0,
      comments: commR.count || 0,
    });
    setRecent(arts.filter(a => a.status === "published").slice(0, 5));
    setTopArticles([...arts].filter(a => a.status === "published").sort((x, y) => (y.views || 0) - (x.views || 0)).slice(0, 5));
  };

  return (
    <div className="space-y-6 p-1" dir="rtl">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
        <div className="text-2xl font-black">{greeting}، {displayName} 👋</div>
        <div className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <div className="flex flex-wrap gap-2 mt-4 text-sm">
          <span className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
            <FileText className="w-3.5 h-3.5" /> {stats.articles} منشور
          </span>
          <span className="flex items-center gap-1 bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full font-bold">
            <Clock className="w-3.5 h-3.5" /> {stats.drafts} مسودة
          </span>
          <span className="flex items-center gap-1 bg-green-500/10 text-green-600 px-3 py-1 rounded-full font-bold">
            <Eye className="w-3.5 h-3.5" /> {stats.views.toLocaleString("ar-EG")} مشاهدة
          </span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={FileText} label="المقالات المنشورة" value={stats.articles} color="bg-primary" to={`${ADMIN}/articles`} />
        <Card icon={Eye} label="إجمالي المشاهدات" value={stats.views} color="bg-blue-500" to={`${ADMIN}/analytics`} />
        <Card icon={Users} label="المشتركون" value={stats.subscribers} color="bg-purple-500" to={`${ADMIN}/subscribers`} />
        <Card icon={Zap} label="الأخبار العاجلة" value={stats.breaking} color="bg-red-500" to={`${ADMIN}/breaking`} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Star} label="الأخبار المميزة" value={stats.featured} color="bg-yellow-500" />
        <Card icon={Clock} label="المسودات" value={stats.drafts} color="bg-orange-500" to={`${ADMIN}/articles`} />
        <Card icon={Globe} label="المستخدمون" value={stats.users} color="bg-teal-500" to={`${ADMIN}/users`} />
        <Card icon={TrendingUp} label="التعليقات" value={stats.comments} color="bg-indigo-500" to={`${ADMIN}/comments`} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recent */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> آخر المقالات</h2>
            <NavLink to={`${ADMIN}/articles`} className="text-xs text-primary hover:underline flex items-center gap-1">
              عرض الكل <ArrowLeft className="w-3 h-3" />
            </NavLink>
          </div>
          <div className="space-y-3">
            {recent.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 group">
                {a.featured_image && <img src={a.featured_image} alt="" className="w-12 h-9 object-cover rounded-lg shrink-0" onError={e => (e.target as any).style.display="none"} />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold line-clamp-1">{a.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Eye className="w-3 h-3" /> {a.views || 0}
                    {a.published_at && <span>· {new Date(a.published_at).toLocaleDateString("ar-EG")}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Top articles */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> الأكثر قراءة</h2>
            <NavLink to={`${ADMIN}/analytics`} className="text-xs text-primary hover:underline flex items-center gap-1">
              التحليلات <ArrowLeft className="w-3 h-3" />
            </NavLink>
          </div>
          <div className="space-y-3">
            {topArticles.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 ${["bg-yellow-500","bg-gray-400","bg-amber-700","bg-muted","bg-muted"][i]}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold line-clamp-1">{a.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" /> {(a.views || 0).toLocaleString("ar-EG")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
