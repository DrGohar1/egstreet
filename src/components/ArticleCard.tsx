import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";

interface ArticleCardProps {
  title: string;
  excerpt?: string;
  slug: string;
  featuredImage?: string;
  categoryName?: string;
  publishedAt?: string;
  variant?: "hero" | "standard" | "compact";
}

const ArticleCard = ({
  title,
  excerpt,
  slug,
  featuredImage,
  categoryName,
  publishedAt,
  variant = "standard",
}: ArticleCardProps) => {
  const { t } = useLanguage();

  const timeAgo = publishedAt
    ? new Date(publishedAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })
    : "";

  if (variant === "hero") {
    return (
      <Link to={`/article/${slug}`} className="group block relative overflow-hidden rounded-lg news-card-hover">
        <div className="aspect-[16/9] bg-muted">
          {featuredImage && (
            <img src={featuredImage} alt={title} className="w-full h-full object-cover image-protected" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        </div>
        <div className="absolute bottom-0 p-6">
          {categoryName && (
            <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded mb-3">
              {categoryName}
            </span>
          )}
          <h2 className="text-2xl md:text-3xl font-bold text-card leading-tight mb-2 group-hover:underline decoration-primary decoration-2">
            {title}
          </h2>
          {excerpt && <p className="text-card/80 text-sm line-clamp-2">{excerpt}</p>}
          {timeAgo && (
            <span className="flex items-center gap-1 text-card/60 text-xs mt-3">
              <Clock className="w-3 h-3" /> {timeAgo}
            </span>
          )}
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link to={`/article/${slug}`} className="group flex gap-3 py-3 border-b border-border last:border-0 news-card-hover">
        {featuredImage && (
          <div className="w-20 h-20 shrink-0 rounded overflow-hidden bg-muted">
            <img src={featuredImage} alt={title} className="w-full h-full object-cover image-protected" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h4>
          {timeAgo && (
            <span className="flex items-center gap-1 text-muted-foreground text-xs mt-1.5">
              <Clock className="w-3 h-3" /> {timeAgo}
            </span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/article/${slug}`} className="group block bg-card rounded-lg overflow-hidden border border-border news-card-hover">
      {featuredImage && (
        <div className="aspect-[16/10] bg-muted">
          <img src={featuredImage} alt={title} className="w-full h-full object-cover image-protected" />
        </div>
      )}
      <div className="p-4">
        {categoryName && (
          <span className="text-primary text-xs font-bold uppercase tracking-wider">
            {categoryName}
          </span>
        )}
        <h3 className="text-lg font-bold mt-1 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        {excerpt && <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{excerpt}</p>}
        {timeAgo && (
          <span className="flex items-center gap-1 text-muted-foreground text-xs mt-3">
            <Clock className="w-3 h-3" /> {timeAgo}
          </span>
        )}
      </div>
    </Link>
  );
};

export default ArticleCard;
