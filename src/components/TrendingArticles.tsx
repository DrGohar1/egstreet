import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { TrendingUp, Flame } from "lucide-react";

interface TrendingArticle {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  published_at: string | null;
}

const TrendingArticles = () => {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<TrendingArticle[]>([]);

  useEffect(() => {
    const fetch = async () => {
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

      if (data) {
        const articles = data
          .map((item: any) => item.articles)
          .filter((a: any) => a);
        setArticles(articles);
      }
    };

    fetch();
  }, []);

  if (articles.length === 0) return null;

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-black text-foreground">
          {t("رائج الآن", "Trending Now")}
        </h3>
      </div>
      <div className="space-y-0">
        {articles.map((article, index) => (
          <Link
            key={article.id}
            to={`/article/${article.slug}`}
            className="group flex gap-3 py-3 border-b border-border last:border-0"
          >
            <span className="shrink-0 w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 font-bold text-sm flex items-center justify-center">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
              </h4>
              {article.published_at && (
                <span className="text-xs text-muted-foreground mt-1 block">
                  {new Date(article.published_at).toLocaleDateString("ar-EG", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TrendingArticles;
