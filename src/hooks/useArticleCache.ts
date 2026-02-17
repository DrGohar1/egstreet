import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useArticles = (options?: any) => {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useArticleBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      return data;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useTrendingArticles = () => {
  return useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trending_articles")
        .select(
          `
          score,
          articles:article_id (
            id,
            title,
            slug,
            featured_image,
            published_at
          )
        `
        )
        .order("score", { ascending: false })
        .limit(5);

      return data
        ?.map((item: any) => item.articles)
        .filter((a: any) => a) || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useMostReadArticles = () => {
  return useQuery({
    queryKey: ["most-read"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, slug, views, featured_image, published_at")
        .eq("status", "published")
        .order("views", { ascending: false })
        .limit(5);
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useInfiniteArticles = (pageSize = 20) => {
  return useInfiniteQuery({
    queryKey: ["articles-infinite"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(pageParam, pageParam + pageSize - 1);
      return data || [];
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < pageSize) return undefined;
      return pages.length * pageSize;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
