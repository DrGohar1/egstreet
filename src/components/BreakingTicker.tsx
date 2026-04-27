import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Zap } from "lucide-react";

interface TickerItem { id: string; title: string; slug: string | null; }

export default function BreakingTicker() {
  const [items,  setItems]  = useState<TickerItem[]>([]);
  const [paused, setPaused] = useState(false);

  const fetchItems = async () => {
    // 1. Try breaking_news table
    const { data: breaking } = await supabase
      .from("breaking_news")
      .select("id, title, slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(20);

    if (breaking && breaking.length > 0) {
      setItems(breaking);
      return;
    }

    // 2. Fallback: latest published articles
    const { data: arts } = await supabase
      .from("articles")
      .select("id, title, slug")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(15);

    if (arts) setItems(arts.map((a: any) => ({ id: a.id, title: a.title, slug: a.slug })));
  };

  useEffect(() => {
    fetchItems();
    // Live realtime
    const ch = supabase
      .channel("ticker_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "breaking_news" }, fetchItems)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "articles" }, fetchItems)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (!items.length) return (
    <div className="w-full bg-primary text-white flex items-center h-10 select-none" dir="rtl">
      <div className="flex items-center gap-1.5 bg-red-700 px-4 h-full shrink-0">
        <Radio className="w-3.5 h-3.5 animate-pulse"/>
        <span className="text-xs font-black">عاجل</span>
      </div>
      <span className="text-xs px-4 opacity-70">جارٍ تحميل الأخبار...</span>
    </div>
  );

  // Triple for seamless infinite loop
  const all = [...items, ...items, ...items];
  const speed = Math.max(30, items.length * 8); // dynamic speed

  return (
    <div
      className="w-full bg-primary text-white overflow-hidden flex items-center h-10 select-none"
      dir="rtl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="أخبار عاجلة"
    >
      {/* عاجل Badge */}
      <div className="flex items-center gap-1.5 bg-red-700 px-4 h-full shrink-0 z-10 shadow-md">
        <Radio className="w-3.5 h-3.5 animate-pulse"/>
        <span className="text-xs font-black whitespace-nowrap">عاجل</span>
      </div>

      {/* Separator arrow */}
      <div className="w-0 h-0 border-y-[20px] border-y-transparent border-r-[10px] border-r-red-700 shrink-0"/>

      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="inline-flex items-center gap-0"
          style={{
            animation: `ticker-rtl ${speed}s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
            willChange: "transform",
          }}
        >
          {all.map((item, i) => (
            <span key={`${item.id}-${i}`} className="inline-flex items-center gap-2 px-5 whitespace-nowrap">
              <Zap className="w-3 h-3 text-yellow-300 shrink-0"/>
              {item.slug
                ? <Link to={`/article/${item.slug}`}
                    className="text-xs sm:text-[13px] font-semibold hover:underline underline-offset-2 hover:text-white/80 transition-colors">
                    {item.title}
                  </Link>
                : <span className="text-xs sm:text-[13px] font-semibold">{item.title}</span>
              }
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker-rtl {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
