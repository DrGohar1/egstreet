import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Users, CheckCircle, AlertTriangle, Zap, Eye } from "lucide-react";

const DashboardOverview = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ articles: 0, pending: 0, users: 0, published: 0, drafts: 0, breaking: 0, totalViews: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [artRes, pendRes, profRes, pubRes, draftRes, breakRes, viewsRes] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("is_breaking", true),
        supabase.from("articles").select("views").eq("status", "published"),
      ]);
      const totalViews = viewsRes.data?.reduce((sum: number, a: { views: number }) => sum + (a.views || 0), 0) ?? 0;
      setStats({
        articles: artRes.count ?? 0,
        pending: pendRes.count ?? 0,
        users: profRes.count ?? 0,
        published: pubRes.count ?? 0,
        drafts: draftRes.count ?? 0,
        breaking: breakRes.count ?? 0,
        totalViews,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: t("إجمالي المقالات", "Total Articles"), value: stats.articles, icon: FileText, color: "text-primary" },
    { label: t("منشورة", "Published"), value: stats.published, icon: CheckCircle, color: "text-green-500" },
    { label: t("مسودات", "Drafts"), value: stats.drafts, icon: FileText, color: "text-muted-foreground" },
    { label: t("مراجعة معلقة", "Pending Review"), value: stats.pending, icon: Clock, color: "text-yellow-500" },
    { label: t("أخبار عاجلة", "Breaking News"), value: stats.breaking, icon: Zap, color: "text-destructive" },
    { label: t("المستخدمون", "Total Users"), value: stats.users, icon: Users, color: "text-blue-500" },
    { label: t("إجمالي المشاهدات", "Total Views"), value: stats.totalViews.toLocaleString(), icon: Eye, color: "text-purple-500" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {t("نظرة عامة", "Overview")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.label} className="news-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
