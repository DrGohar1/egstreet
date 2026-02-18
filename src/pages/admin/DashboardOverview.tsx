import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  FileText, Clock, Users, CheckCircle, Zap, Eye, TrendingUp,
  MessageSquare, Mail, ArrowUpRight, Activity, Layers,
  PenTool, AlertTriangle, Calendar, Sparkles
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
  id: string; title: string; slug: string; status: string;
  views: number; created_at: string; author_id: string | null;
}

interface RecentComment {
  id: string; content: string; status: string;
  created_at: string; article_id: string;
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
        { name: t("مسودات", "Drafts"), value: drafts, color: "hsl(220, 10%, 60%)" },
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
    { label: t("منشورة", "Published"), value: stats.published, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30", link: "/dashboard/articles" },
    { label: t("مراجعة معلقة", "Pending Review"), value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", alert: stats.pending > 0, link: "/dashboard/articles" },
    { label: t("مسودات", "Drafts"), value: stats.drafts, icon: PenTool, color: "text-muted-foreground", bg: "bg-muted", link: "/dashboard/articles" },
    { label: t("أخبار عاجلة", "Breaking"), value: stats.breaking, icon: Zap, color: "text-destructive", bg: "bg-destructive/10", link: "/dashboard/breaking" },
    { label: t("المستخدمون", "Users"), value: stats.users, icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", link: "/dashboard/users" },
    { label: t("المشاهدات", "Views"), value: stats.totalViews.toLocaleString(), icon: Eye, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/30", link: "/dashboard/analytics" },
    { label: t("المشتركون", "Subscribers"), value: stats.subscribers, icon: Mail, color: "text-teal-600", bg: "bg-teal-100 dark:bg-teal-900/30", link: "/dashboard/subscribers" },
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
      {/* Page Header */}
      <div className="rounded-2xl bg-gradient-to-l from-secondary to-secondary/80 p-6 text-secondary-foreground">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-black">{t("نظرة عامة", "Dashboard Overview")}</h1>
                <p className="text-sm opacity-80">{t("ملخص شامل لأداء الموقع والمحتوى", "Comprehensive site performance summary")}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0">
                <Link to="/dashboard/articles" className="gap-1.5">
                  <FileText className="h-4 w-4" />
                  {t("المقالات", "Articles")}
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/dashboard/analytics">
                  <TrendingUp className="h-4 w-4" />
                  {t("التحليلات", "Analytics")}
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Alert */}
      {(stats.pending > 0 || stats.pendingComments > 0) && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-foreground">
                {stats.pending > 0 && t(`${stats.pending} مقالة بانتظار المراجعة`, `${stats.pending} article(s) pending review`)}
                {stats.pending > 0 && stats.pendingComments > 0 && " · "}
                {stats.pendingComments > 0 && t(`${stats.pendingComments} تعليق بانتظار الموافقة`, `${stats.pendingComments} comment(s) pending`)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card, i) => (
          <motion.div key={card.label} variants={fadeUp} custom={i} initial="hidden" animate="visible">
            <Link to={card.link}>
              <Card className="group cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-transparent hover:border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${card.bg} transition-transform group-hover:scale-110`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    {card.alert && (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-foreground">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div className="lg:col-span-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  {t("المشاهدات اليومية", "Daily Views")}
                </CardTitle>
                <Button asChild size="sm" variant="ghost" className="text-xs">
                  <Link to="/dashboard/analytics">{t("عرض الكل", "View all")} <ArrowUpRight className="h-3 w-3 ms-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dailyViews.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyViews}>
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#viewsGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">{t("لا توجد بيانات بعد", "No data yet")}</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t("حالة المقالات", "Article Status")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {statusData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
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
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {t("أحدث المقالات", "Recent Articles")}
                </CardTitle>
                <Button asChild size="sm" variant="ghost" className="text-xs">
                  <Link to="/dashboard/articles">{t("عرض الكل", "View all")} <ArrowUpRight className="h-3 w-3 ms-1" /></Link>
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
                            <Eye className="h-3 w-3" />{article.views}
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
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  {t("أحدث التعليقات", "Recent Comments")}
                </CardTitle>
                <Button asChild size="sm" variant="ghost" className="text-xs">
                  <Link to="/dashboard/comments">{t("عرض الكل", "View all")} <ArrowUpRight className="h-3 w-3 ms-1" /></Link>
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
                        <p className="text-sm text-foreground truncate">{comment.content}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">{t("إجراءات سريعة", "Quick Actions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t("مقال جديد", "New Article"), icon: FileText, link: "/dashboard/articles", color: "bg-primary/10 text-primary" },
              { label: t("إضافة قسم", "Add Category"), icon: Layers, link: "/dashboard/categories", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
              { label: t("إدارة التعليقات", "Manage Comments"), icon: MessageSquare, link: "/dashboard/comments", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600" },
              { label: t("الإعدادات", "Settings"), icon: Sparkles, link: "/dashboard/settings", color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600" },
            ].map((action) => (
              <Link key={action.link} to={action.link}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                  <div className={`p-3 rounded-xl ${action.color} transition-transform group-hover:scale-110`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
