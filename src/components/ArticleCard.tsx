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
  variant?: "hero" | "standard" | "compact" | "featured-side" | "list";
  views?: number;
  isBreaking?: boolean;
}

const ArticleCard = ({ title, excerpt, slug, featuredImage, categoryName, publishedAt, variant = "standard", views, isBreaking }: ArticleCardProps) => {
  const { language } = useLanguage();
  const timeAgo = publishedAt
    ? new Date(publishedAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })
    : "";

  if (variant === "hero") return (
    <Link to={`/article/${slug}`} className="group block relative overflow-hidden rounded-2xl h-full min-h-[360px] md:min-h-[460px]">
      <div className="absolute inset-0 bg-muted">
        {featuredImage && <img src={featuredImage} alt={title} loading="lazy" className="w-full h-full object-cover image-protected transition-transform duration-700 group-hover:scale-105"  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />}
        <div className="absolute inset-0 hero-gradient" />
      </div>
      <div className="absolute top-4 start-4 flex gap-2 flex-wrap">
        {isBreaking && <span className="badge-breaking">{language === "ar" ? "عاجل" : "BREAKING"}</span>}
        {categoryName && <span className="badge-category">{categoryName}</span>}
      </div>
      <div className="absolute bottom-0 p-5 md:p-8 w-full">
        <h2 className="text-xl md:text-3xl font-black text-white leading-tight mb-2 group-hover:text-[hsl(var(--nav-accent))] transition-colors duration-300 drop-shadow-lg text-balance">{title}</h2>
        {excerpt && <p className="text-white/60 text-sm line-clamp-2 max-w-2xl hidden md:block">{excerpt}</p>}
        <div className="flex items-center gap-3 mt-3 text-white/45 text-xs">
          {timeAgo && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>}
          {!!views && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{views.toLocaleString()}</span>}
        </div>
      </div>
    </Link>
  );

  if (variant === "featured-side") return (
    <Link to={`/article/${slug}`} className="group block relative overflow-hidden rounded-xl h-full min-h-[160px]">
      <div className="absolute inset-0 bg-muted">
        {featuredImage && <img src={featuredImage} alt={title} loading="lazy" className="w-full h-full object-cover image-protected transition-transform duration-700 group-hover:scale-105"  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />}
        <div className="absolute inset-0 hero-gradient" />
      </div>
      {categoryName && <div className="absolute top-3 start-3"><span className="badge-category">{categoryName}</span></div>}
      <div className="absolute bottom-0 p-3 w-full">
        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-[hsl(var(--nav-accent))] transition-colors">{title}</h3>
        {timeAgo && <span className="flex items-center gap-1 text-white/40 text-[10px] mt-1"><Clock className="w-2.5 h-2.5" />{timeAgo}</span>}
      </div>
    </Link>
  );

  if (variant === "compact") return (
    <Link to={`/article/${slug}`} className="group flex gap-3 py-2.5 border-b border-border/40 last:border-0 hover:bg-muted/40 px-1.5 -mx-1.5 rounded-lg transition-colors duration-200">
      {featuredImage && (
        <div className="w-[68px] h-[52px] shrink-0 rounded-lg overflow-hidden bg-muted">
          <img src={featuredImage} alt={title} loading="lazy" className="w-full h-full object-cover image-protected transition-transform duration-500 group-hover:scale-110"  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">{title}</h4>
        {timeAgo && <span className="flex items-center gap-1 text-muted-foreground text-[11px] mt-1"><Clock className="w-3 h-3" />{timeAgo}</span>}
      </div>
    </Link>
  );

  if (variant === "list") return (
    <Link to={`/article/${slug}`} className="group flex gap-3 p-3 bg-card rounded-xl border border-border/50 hover:border-[hsl(var(--primary)/0.35)] hover:shadow-lg transition-all duration-300">
      {featuredImage && (
        <div className="w-24 h-[68px] shrink-0 rounded-lg overflow-hidden bg-muted">
          <img src={featuredImage} alt={title} loading="lazy" className="w-full h-full object-cover image-protected transition-transform duration-500 group-hover:scale-110"  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {categoryName && <span className="text-[hsl(var(--primary))] text-[10px] font-black uppercase tracking-wider">{categoryName}</span>}
        <h3 className="text-sm font-bold mt-0.5 leading-snug line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">{title}</h3>
        <div className="flex items-center gap-3 mt-1.5 text-muted-foreground text-[11px]">
          {timeAgo && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>}
          {!!views && <span className="flex items-center gap-1 ms-auto"><Eye className="w-3 h-3" />{views.toLocaleString()}</span>}
        </div>
      </div>
    </Link>
  );

  // standard
  return (
    <Link to={`/article/${slug}`} className="group block bg-card rounded-xl overflow-hidden border border-border/50 hover:border-[hsl(var(--primary)/0.4)] hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.06)] hover:-translate-y-0.5 transition-all duration-300">
      {featuredImage ? (
        <div className="aspect-[16/10] bg-muted overflow-hidden">
          <img src={featuredImage} alt={title} loading="lazy" className="w-full h-full object-cover image-protected transition-transform duration-700 group-hover:scale-105"  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
        </div>
      ) : (
        <div className="aspect-[16/10] bg-muted/60 flex items-center justify-center"><span className="text-3xl opacity-20">📰</span></div>
      )}
      <div className="p-4">
        {categoryName && <span className="text-[hsl(var(--primary))] text-[10px] font-black uppercase tracking-wider">{categoryName}</span>}
        <h3 className="text-base font-bold mt-1 leading-snug line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors duration-200">{title}</h3>
        {excerpt && <p className="text-muted-foreground text-sm mt-2 line-clamp-2 leading-relaxed">{excerpt}</p>}
        <div className="flex items-center gap-3 mt-3 text-muted-foreground text-xs border-t border-border/40 pt-3">
          {timeAgo && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>}
          {!!views && <span className="flex items-center gap-1 ms-auto"><Eye className="w-3 h-3" />{views.toLocaleString()}</span>}
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
