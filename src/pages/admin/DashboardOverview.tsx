import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  FileText, Clock, Users, CheckCircle, Zap, Eye, TrendingUp,
  MessageSquare, Mail, ArrowUpRight, BarChart3, Activity, Layers,
  PenTool, AlertTriangle, Calendar, Sparkles, Globe
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  }),
};

interface RecentArticle {
  id: string;
  title: string;
  slug: string;
  status: string;
  views: number;
  created_at: string;
  author_id: string | null;
}

interface RecentComment {
  id: string;
  content: string;
  status: string;
  created_at: string;
  article_id: string;
}

const DashboardOverview = () => {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({
    articles: 0, pending: 0, users: 0, published: 0,
    drafts: 0, breaking: 0, totalViews: 0, subscribers: 0,
    comments: 0, pendingComments: 0, categories: 0, tags: 0,
  });
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([]);
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);
  const [dailyViews, setDailyViews] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [
        artRes, pendRes, profRes, pubRes, draftRes, breakRes, viewsRes,
        subsRes, commRes, pendCommRes, catRes, tagRes,
        recentArtRes, recentCommRes, dailyRes
      ] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("is_breaking", true),
        supabase.from("articles").select("views").eq("status", "published"),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("comments").select("id", { count: "exact", head: true }),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("tags").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id, title, slug, status, views, created_at, author_id").order("created_at", { ascending: false }).limit(5),
        supabase.from("comments").select("id, content, status, created_at, article_id").order("created_at", { ascending: false }).limit(5),
        supabase.from("daily_views").select("view_date, view_count").order("view_date", { ascending: false }).limit(14),
      ]);

      const totalViews = viewsRes.data?.reduce((sum: number, a: { views: number }) => sum + (a.views || 0), 0) ?? 0;
      const published = pubRes.count ?? 0;
      const drafts = draftRes.count ?? 0;
      const pending = pendRes.count ?? 0;

      setStats({
        articles: artRes.count ?? 0, pending, users: profRes.count ?? 0,
        published, drafts, breaking: breakRes.count ?? 0, totalViews,
        subscribers: subsRes.count ?? 0, comments: commRes.count ?? 0,
        pendingComments: pendCommRes.count ?? 0, categories: catRes.count ?? 0,
        tags: tagRes.count ?? 0,
      });

      setStatusData([
        { name: t("منشورة", "Published"), value: published, color: "hsl(142, 76%, 36%)" },
        { name: t("مسودات", "Drafts"), value: drafts, color: "hsl(220, 10%, 46%)" },
        { name: t("مراجعة", "Pending"), value: pending, color: "hsl(45, 93%, 47%)" },
      ]);

      if (recentArtRes.data) setRecentArticles(recentArtRes.data);
      if (recentCommRes.data) setRecentComments(recentCommRes.data);
      if (dailyRes.data) {
        setDailyViews(
          dailyRes.data.reverse().map((d: any) => ({
            date: new Date(d.view_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" }),
            views: d.view_count,
          }))
        );
      }
      setLoading(false);
    };
    fetchAll();
  }, [t, language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const statCards = [
    { label: t("إجمالي المقالات", "Total Articles"), value: stats.articles, icon: FileText, color: "text-primary", bg: "bg-primary/10", link: "/dashboard/articles" },
    { label: t("منشورة", "Published"), value: stats.published, icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", link: "/dashboard/articles" },
    { label: t("مراجعة معلقة", "Pending Review"), value: stats.pending, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", alert: stats.pending > 0, link: "/dashboard/articles" },
    { label: t("مسودات", "Drafts"), value: stats.drafts, icon: PenTool, color: "text-muted-foreground", bg: "bg-muted", link: "/dashboard/articles" },
    { label: t("أخبار عاجلة", "Breaking News"), value: stats.breaking, icon: Zap, color: "text-destructive", bg: "bg-destructive/10", link: "/dashboard/breaking" },
    { label: t("المستخدمون", "Users"), value: stats.users, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", link: "/dashboard/users" },
    { label: t("المشاهدات", "Views"), value: stats.totalViews.toLocaleString(), icon: Eye, color: "text-purple-500", bg: "bg-purple-500/10", link: "/dashboard/analytics" },
    { label: t("المشتركون", "Subscribers"), value: stats.subscribers, icon: Mail, color: "text-emerald-500", bg: "bg-emerald-500/10", link: "/dashboard/subscribers" },
    { label: t("التعليقات", "Comments"), value: stats.comments, icon: MessageSquare, color: "text-orange-500", bg: "bg-orange-500/10", link: "/dashboard/comments" },
    { label: t("الأقسام", "Categories"), value: stats.categories, icon: Layers, color: "text-indigo-500", bg: "bg-indigo-500/10", link: "/dashboard/categories" },
  ];

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      published: { label: t("منشور", "Published"), variant: "default" },
      draft: { label: t("مسودة", "Draft"), variant: "secondary" },
      pending_review: { label: t("مراجعة", "Review"), variant: "outline" },
      archived: { label: t("مؤرشف", "Archived"), variant: "secondary" },
      pending: { label: t("معلق", "Pending"), variant: "outline" },
      approved: { label: t("موافق", "Approved"), variant: "default" },
    };
    return map[s] || { label: s, variant: "secondary" as const };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {t("نظرة عامة", "Dashboard Overview")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("ملخص شامل لأداء الموقع", "Comprehensive site performance summary")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard/articles" className="gap-1">
              <FileText className="h-4 w-4" />
              {t("المقالات", "Articles")}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/dashboard/analytics" className="gap-1">
              <BarChart3 className="h-4 w-4" />
              {t("التحليلات", "Analytics")}
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Alert */}
      {(stats.pending > 0 || stats.pendingComments > 0) && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
              <p className="text-sm text-foreground">
                {stats.pending > 0 && t(`${stats.pending} مقالة بانتظار المراجعة`, `${stats.pending} article(s) pending review`)}
                {stats.pending > 0 && stats.pendingComments > 0 && " · "}
                {stats.pendingComments > 0 && t(`${stats.pendingComments} تعليق بانتظار الموافقة`, `${stats.pendingComments} comment(s) pending approval`)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((card, i) => (
          <motion.div key={card.label} variants={fadeUp} custom={i} initial="hidden" animate="visible">
            <Link to={card.link}>
              <Card className="news-card-hover relative overflow-hidden group cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${card.bg} transition-transform group-hover:scale-110`}>
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                    {card.alert && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
                      </span>
                    )}
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-2xl font-black text-foreground">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div className="lg:col-span-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  {t("المشاهدات اليومية", "Daily Views")}
                </CardTitle>
                <Button asChild size="sm" variant="ghost" className="text-xs">
                  <Link to="/dashboard/analytics">
                    {t("عرض الكل", "View all")}
                    <ArrowUpRight className="h-3 w-3 ms-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dailyViews.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyViews}>
                    <defs>
                      <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#viewsGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                  {t("لا توجد بيانات بعد", "No data yet")}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t("حالة المقالات", "Article Status")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-bold text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {t("أحدث المقالات", "Recent Articles")}
                </CardTitle>
                <Button asChild size="sm" variant="ghost" className="text-xs">
                  <Link to="/dashboard/articles">
                    {t("عرض الكل", "View all")}
                    <ArrowUpRight className="h-3 w-3 ms-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentArticles.map((article) => {
                  const sl = statusLabel(article.status);
                  return (
                    <div key={article.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0 me-3">
                        <p className="text-sm font-medium text-foreground truncate">{article.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(article.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.views}
                          </span>
                        </div>
                      </div>
                      <Badge variant={sl.variant}>{sl.label}</Badge>
                    </div>
                  );
                })}
                {recentArticles.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">{t("لا توجد مقالات بعد", "No articles yet")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-orange-500" />
                  {t("أحدث التعليقات", "Recent Comments")}
                </CardTitle>
                <Button asChild size="sm" variant="ghost" className="text-xs">
                  <Link to="/dashboard/comments">
                    {t("عرض الكل", "View all")}
                    <ArrowUpRight className="h-3 w-3 ms-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentComments.map((comment) => {
                  const sl = statusLabel(comment.status);
                  return (
                    <div key={comment.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0 me-3">
                        <p className="text-sm text-foreground line-clamp-1">{comment.content}</p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(comment.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })}
                        </span>
                      </div>
                      <Badge variant={sl.variant}>{sl.label}</Badge>
                    </div>
                  );
                })}
                {recentComments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">{t("لا توجد تعليقات بعد", "No comments yet")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              {t("إجراءات سريعة", "Quick Actions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: t("مقال جديد", "New Article"), icon: PenTool, to: "/dashboard/articles", color: "text-primary" },
                { label: t("إدارة الأقسام", "Categories"), icon: Layers, to: "/dashboard/categories", color: "text-indigo-500" },
                { label: t("مراجعة التعليقات", "Review Comments"), icon: MessageSquare, to: "/dashboard/comments", color: "text-orange-500" },
                { label: t("الإعدادات", "Settings"), icon: Activity, to: "/dashboard/settings", color: "text-muted-foreground" },
              ].map((action) => (
                <Button key={action.to} asChild variant="outline" className="h-auto py-4 flex-col gap-2 group">
                  <Link to={action.to}>
                    <action.icon className={`h-5 w-5 ${action.color} transition-transform group-hover:scale-110`} />
                    <span className="text-xs">{action.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;
