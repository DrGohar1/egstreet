import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { BarChart3, Eye, TrendingUp, FileText } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const AnalyticsDashboard = () => {
  const { t, language } = useLanguage();
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [topArticles, setTopArticles] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // Daily views (last 14 days)
      const { data: daily } = await supabase
        .from("daily_views")
        .select("view_date, view_count")
        .gte("view_date", new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0])
        .order("view_date");

      if (daily) {
        const grouped: Record<string, number> = {};
        daily.forEach((d: any) => {
          grouped[d.view_date] = (grouped[d.view_date] || 0) + d.view_count;
        });
        setDailyData(Object.entries(grouped).map(([date, views]) => ({
          date: new Date(date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" }),
          views,
        })));
      }

      // Top articles by views
      const { data: top } = await supabase
        .from("articles")
        .select("title, views")
        .eq("status", "published")
        .order("views", { ascending: false })
        .limit(10);
      if (top) setTopArticles(top.map((a: any) => ({ name: a.title.slice(0, 30) + (a.title.length > 30 ? "..." : ""), views: a.views })));

      // Category stats
      const [catRes, acRes] = await Promise.all([
        supabase.from("categories").select("id, name_ar, name_en"),
        supabase.from("article_categories").select("category_id"),
      ]);
      if (catRes.data && acRes.data) {
        const counts: Record<string, number> = {};
        acRes.data.forEach((ac: any) => { counts[ac.category_id] = (counts[ac.category_id] || 0) + 1; });
        setCategoryStats(
          catRes.data
            .map((c: any) => ({ name: language === "ar" ? c.name_ar : c.name_en, value: counts[c.id] || 0 }))
            .filter((c: any) => c.value > 0)
            .sort((a: any, b: any) => b.value - a.value)
        );
      }
    };
    fetchAnalytics();
  }, [language]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary" />
        {t("التحليلات المتقدمة", "Advanced Analytics")}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Views Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t("المشاهدات اليومية (آخر 14 يوم)", "Daily Views (Last 14 Days)")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              {t("أكثر المقالات مشاهدة", "Most Viewed Articles")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topArticles} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {t("توزيع الأقسام", "Category Distribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                  {categoryStats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
