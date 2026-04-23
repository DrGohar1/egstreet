import { useCallback, useEffect, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "react-router-dom";
import { Clock, Eye, ChevronRight, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeroArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image?: string | null;
  published_at?: string | null;
  views?: number;
  categoryName?: string;
  is_breaking?: boolean | null;
}

const HeroSlider = ({ articles }: { articles: HeroArticle[] }) => {
  const { language, t } = useLanguage();
  const isRtl = language === "ar";
  const [selectedIndex, setSelectedIndex] = useState(0);

  const autoplayRef = useRef(Autoplay({ delay: 5500, stopOnInteraction: true }));
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, direction: isRtl ? "rtl" : "ltr" },
    [autoplayRef.current]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  if (!articles.length) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl group">
      <div ref={emblaRef} className="overflow-hidden rounded-2xl">
        <div className="flex touch-pan-y">
          {articles.map((a, i) => {
            const timeAgo = a.published_at
              ? new Date(a.published_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US", { month: "short", day: "numeric" })
              : "";
            return (
              <div key={a.id} className="flex-none w-full min-w-0">
                <Link to={`/article/${a.slug}`} className="block relative overflow-hidden min-h-[260px] sm:min-h-[380px] md:min-h-[500px] bg-muted">
                  {a.featured_image && (
                    <img
                      src={a.featured_image} alt={a.title}
                      loading={i === 0 ? "eager" : "lazy"}
                      className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <div className="absolute top-4 start-4 flex gap-2 flex-wrap">
                    {a.is_breaking && <span className="badge-breaking animate-pulse">{isRtl ? "عاجل" : "BREAKING"}</span>}
                    {a.categoryName && <span className="badge-category">{a.categoryName}</span>}
                  </div>
                  <div className="absolute bottom-0 p-6 md:p-10 w-full">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-3 drop-shadow-lg text-balance max-w-3xl">
                      {a.title}
                    </h2>
                    {a.excerpt && (
                      <p className="text-white/60 text-sm line-clamp-2 max-w-2xl mb-4 hidden md:block">{a.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-white/45 text-xs">
                      {timeAgo && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>}
                      {!!a.views && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.views.toLocaleString()}</span>}
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2 rounded-full">
                      {t("اقرأ المزيد", "Read More")}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Arrows */}
      <button onClick={() => emblaApi?.scrollPrev()}
        className="absolute top-1/2 start-3 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-primary active:bg-primary z-10">
        {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
      <button onClick={() => emblaApi?.scrollNext()}
        className="absolute top-1/2 end-3 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-primary active:bg-primary z-10">
        {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 end-6 flex gap-2 z-10">
        {articles.map((_, i) => (
          <button key={i} onClick={() => emblaApi?.scrollTo(i)}
            className={`transition-all duration-300 rounded-full ${selectedIndex === i ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute top-4 end-4 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full z-10">
        {selectedIndex + 1} / {articles.length}
      </div>
    </div>
  );
};

export default HeroSlider;
