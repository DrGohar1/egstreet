import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BreakingTicker() {
  const [items,   setItems]   = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(()=>{
    supabase.from("breaking_news")
      .select("id,title,slug").eq("is_active",true)
      .order("created_at",{ascending:false}).limit(12)
      .then(({data})=>{ if(data?.length) setItems(data); });
  },[]);

  useEffect(()=>{
    if (!items.length || paused) return;
    timer.current = setInterval(()=>next(), 4500);
    return ()=>{ if(timer.current) clearInterval(timer.current); };
  },[items, paused, current]);

  const next = () => setCurrent(c=>(c+1)%items.length);
  const prev = () => setCurrent(c=>(c-1+items.length)%items.length);

  if (!items.length) return null;

  return (
    <div
      className="w-full z-50 bg-[hsl(var(--primary))] text-white select-none"
      style={{height:"42px"}}
      onMouseEnter={()=>setPaused(true)}
      onMouseLeave={()=>setPaused(false)}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center gap-0">

        {/* Badge عاجل */}
        <div className="flex items-center gap-0 h-full shrink-0">
          <div className="flex items-center gap-1.5 bg-red-700 h-full px-3 sm:px-4">
            <Radio className="w-3.5 h-3.5 animate-pulse shrink-0"/>
            <span className="text-xs font-black whitespace-nowrap">عاجل</span>
          </div>
          {/* Triangle */}
          <div className="w-0 h-0 border-y-[21px] border-y-transparent border-r-[12px] border-r-red-700 shrink-0"/>
        </div>

        {/* Zap separator */}
        <Zap className="w-3.5 h-3.5 mx-2 text-white/50 shrink-0 hidden sm:block"/>

        {/* Scrolling text */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center px-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{y: 20, opacity:0}}
              animate={{y: 0,  opacity:1}}
              exit  ={{y:-20, opacity:0}}
              transition={{duration:0.35, ease:"easeInOut"}}
              className="absolute inset-0 flex items-center px-2"
            >
              <Link
                to={items[current]?.slug ? `/article/${items[current].slug}` : "/"}
                className="text-xs sm:text-[13px] font-bold whitespace-nowrap hover:underline underline-offset-2 truncate max-w-full"
              >
                {items[current]?.title}
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Counter + Dots + Nav */}
        <div className="flex items-center gap-1.5 px-2 sm:px-3 shrink-0">
          {/* Prev */}
          <button onClick={prev} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
            <ChevronRight className="w-3.5 h-3.5"/>
          </button>

          {/* Dots */}
          <div className="hidden sm:flex items-center gap-1">
            {items.map((_,i)=>(
              <button key={i} onClick={()=>setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${i===current?"w-4 h-2 bg-white":"w-1.5 h-1.5 bg-white/35 hover:bg-white/65"}`}/>
            ))}
          </div>

          {/* Counter mobile */}
          <span className="sm:hidden text-[10px] font-bold text-white/60">
            {current+1}/{items.length}
          </span>

          {/* Next */}
          <button onClick={next} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>
    </div>
  );
}
