import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Clock, Eye } from "lucide-react";

interface ArticleCardProps {
  title: string;
  excerpt?: string;
  slug: string;
  featuredImage?: string;
  categoryName?: string;
  publishedAt?: string;
  variant?: "hero" | "standard" | "compact" | "featured-side";
  views?: number;
}

const ArticleCard = ({
  title,
  excerpt,
  slug,
  featuredImage,
  categoryName,
  publishedAt,
  variant = "standard",
  views,
}: ArticleCardProps) => {
  const { language } = useLanguage();

  const timeAgo = publishedAt
    ? new Date(publishedAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })
    : "";

  if (variant === "hero") {
    return (
      <Link to={`/article/${slug}`} className="group block relative overflow-hidden rounded-2xl">
        <div className="aspect-[16/9] bg-muted">
          {featuredImage && (
            <img src={featuredImage} alt={title} className="w-full h-full object-cover image-protected transition-transform duration-700 group-hover:scale-105" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
        <div className="absolute bottom-0 p-5 md:p-8">
          {categoryName && (
            <span className="inline-block bg-primary text-primary-foreground text-[11px] font-bold px-3 py-1 rounded-full mb-3 backdrop-blur-sm">
              {categoryName}
            </span>
          )}
          <h2 className="text-xl md:text-3xl font-black text-white leading-tight mb-2 group-hover:text-primary transition-colors duration-300 drop-shadow-lg">
            {title}
          </h2>
          {excerpt && <p className="text-white/70 text-sm line-clamp-2 max-w-2xl">{excerpt}</p>}
          <div className="flex items-center gap-3 mt-3 text-white/50 text-xs">
            {timeAgo && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {timeAgo}
              </span>
            )}
            {views !== undefined && views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {views.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "featured-side") {
    return (
      <Link to={`/article/${slug}`} className="group block relative overflow-hidden rounded-2xl h-full min-h-[200px]">
        <div className="absolute inset-0 bg-muted">
          {featuredImage && (
            <img src={featuredImage} alt={title} className="w-full h-full object-cover image-protected transition-transform duration-700 group-hover:scale-105" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        <div className="absolute bottom-0 p-4">
          {categoryName && (
            <span className="inline-block bg-primary/90 text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2">
              {categoryName}
            </span>
          )}
          <h3 className="text-sm md:text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          {timeAgo && (
            <span className="flex items-center gap-1 text-white/50 text-[10px] mt-1.5">
              <Clock className="w-2.5 h-2.5" /> {timeAgo}
            </span>
          )}
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link to={`/article/${slug}`} className="group flex gap-3 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 px-1 -mx-1 rounded-lg transition-colors duration-200">
        {featuredImage && (
          <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-muted ring-1 ring-border/30">
            <img src={featuredImage} alt={title} className="w-full h-full object-cover image-protected transition-transform duration-500 group-hover:scale-110" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {title}
          </h4>
          {timeAgo && (
            <span className="flex items-center gap-1 text-muted-foreground text-[11px] mt-1.5">
              <Clock className="w-3 h-3" /> {timeAgo}
            </span>
          )}
        </div>
      </Link>
    );
  }

  // Standard card
  return (
    <Link to={`/article/${slug}`} className="group block bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      {featuredImage && (
        <div className="aspect-[16/10] bg-muted overflow-hidden">
          <img src={featuredImage} alt={title} className="w-full h-full object-cover image-protected transition-transform duration-700 group-hover:scale-105" />
        </div>
      )}
      <div className="p-4">
        {categoryName && (
          <span className="text-primary text-[11px] font-bold uppercase tracking-wider">
            {categoryName}
          </span>
        )}
        <h3 className="text-base font-bold mt-1 leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>
        {excerpt && <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{excerpt}</p>}
        <div className="flex items-center gap-3 mt-3 text-muted-foreground text-xs">
          {timeAgo && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo}
            </span>
          )}
          {views !== undefined && views > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {views.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
