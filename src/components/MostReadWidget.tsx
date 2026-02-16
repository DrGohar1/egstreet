import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { TrendingUp, Eye, Clock } from "lucide-react";

interface MostReadArticle {
  id: string;
  title: string;
  slug: string;
  views: number;
  featured_image: string | null;
  published_at: string | null;
}

const MostReadWidget = () => {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<MostReadArticle[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, slug, views, featured_image, published_at")
        .eq("status", "published")
        .order("views", { ascending: false })
        .limit(5);
      if (data) setArticles(data);
    };
    fetch();
  }, []);

  if (articles.length === 0) return null;

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-black text-foreground">{t("الأكثر قراءة", "Most Read")}</h3>
      </div>
      <div className="space-y-0">
        {articles.map((a, i) => (
          <Link
            key={a.id}
            to={`/article/${a.slug}`}
            className="group flex gap-3 py-3 border-b border-border last:border-0"
          >
            <span className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {a.title}
              </h4>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {a.views.toLocaleString()}
                </span>
                {a.published_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(a.published_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MostReadWidget;
