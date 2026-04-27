import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

interface BreakingItem { id: string; title_ar: string; }

export default function BreakingNewsTicker() {
  const [items, setItems] = useState<BreakingItem[]>([]);
  const [paused, setPaused] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("breaking_news")
      .select("id, title_ar")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(20);
    if (data && data.length > 0) setItems(data);
    else {
      // Fallback: use latest published article titles
      const { data: arts } = await supabase
        .from("articles")
        .select("id, title")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10);
      if (arts) setItems(arts.map((a: any) => ({ id: a.id, title_ar: a.title })));
    }
  };

  useEffect(() => {
    fetchItems();
    // Realtime subscription
    const ch = supabase
      .channel("breaking_ticker")
      .on("postgres_changes", { event: "*", schema: "public", table: "breaking_news" }, fetchItems)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "articles" }, fetchItems)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (!items.length) return null;

  // Duplicate items for seamless loop
  const displayItems = [...items, ...items];

  return (
    <div
      className="w-full bg-primary/95 text-white overflow-hidden flex items-center h-9 select-none"
      dir="rtl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Label */}
      <div className="flex items-center gap-1.5 px-3 shrink-0 bg-red-600 h-full font-black text-xs border-l border-white/20 z-10 shadow-md">
        <Zap className="w-3.5 h-3.5 animate-pulse"/>
        <span>عاجل</span>
      </div>

      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex gap-0 whitespace-nowrap"
          style={{
            animation: paused ? "none" : "ticker-scroll 40s linear infinite",
            willChange: "transform",
          }}
        >
          {displayItems.map((item, i) => (
            <Link
              key={`${item.id}-${i}`}
              to={`/article/${item.id}`}
              className="inline-flex items-center gap-2 px-6 text-xs font-semibold hover:text-white/80 transition-colors whitespace-nowrap"
            >
              <span className="text-white/40 text-[10px]">◆</span>
              {item.title_ar}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
