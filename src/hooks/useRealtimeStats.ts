import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  articles: number;
  pending: number;
  published: number;
  drafts: number;
  breaking: number;
  users: number;
  totalViews: number;
  subscribers: number;
  comments: number;
  pendingComments: number;
  categories: number;
  tags: number;
}

export const useRealtimeStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    articles: 0, pending: 0, published: 0, drafts: 0,
    breaking: 0, users: 0, totalViews: 0, subscribers: 0,
    comments: 0, pendingComments: 0, categories: 0, tags: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const [
      artRes, pendRes, profRes, pubRes, draftRes, breakRes, viewsRes,
      subsRes, commRes, pendCommRes, catRes, tagRes,
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
      subscribers: subsRes.count ?? 0,
      comments: commRes.count ?? 0,
      pendingComments: pendCommRes.count ?? 0,
      categories: catRes.count ?? 0,
      tags: tagRes.count ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();

    // Subscribe to realtime changes for live updates
    const channel = supabase
      .channel("dashboard-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "newsletter_subscribers" }, () => fetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { stats, loading, refetch: fetchStats };
};
