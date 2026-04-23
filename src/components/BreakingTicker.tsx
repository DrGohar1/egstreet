import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Zap, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BreakingTicker() {
  const [items,   setItems]   = useState<{id:string;title:string;slug:string|null}[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(()=>{
    supabase.from("breaking_news")
      .select("id,title,slug").eq("is_active",true)
      .order("created_at",{ascending:false}).limit(15)
      .then(({data})=>{
        if(data?.length) setItems(data);
        setLoading(false);
      });
  },[]);

  useEffect(()=>{
    if (!items.length || paused) return;
    timer.current = setInterval(()=>next(), 4500);
    return ()=>{ if(timer.current) clearInterval(timer.current); };
  },[items, paused, current]);

  const next = () => setCurrent(c=>(c+1)%Math.max(1,items.length));
  const prev = () => setCurrent(c=>(c-1+Math.max(1,items.length))%Math.max(1,items.length));

  /* Always render the bar — show placeholder if no news */
  const placeholder = [
    { id:"p1", title:"جارٍ تحميل الأخبار العاجلة...", slug:null },
    { id:"p2", title:"تابعوا آخر المستجدات مع جريدة الشارع المصري", slug:null },
  ];
  const display = items.length ? items : (loading ? placeholder : [{ id:"empty", title:"لا توجد أخبار عاجلة حالياً — تابعوا تحديثاتنا", slug:null }]);
  const cur = display[current % display.length];

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
            <span className="text-xs font-black whitespace-nowrap hidden sm:block">عاجل</span>
          </div>
          <div className="w-0 h-0 border-y-[21px] border-y-transparent border-r-[12px] border-r-red-700 shrink-0"/>
        </div>

        <Zap className="w-3.5 h-3.5 mx-2 text-white/50 shrink-0 hidden sm:block"/>

        {/* Scrolling text */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center px-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={cur.id + current}
              initial={{y: 20, opacity:0}}
              animate={{y: 0,  opacity:1}}
              exit  ={{y:-20, opacity:0}}
              transition={{duration:0.35, ease:"easeInOut"}}
              className="absolute inset-0 flex items-center px-2"
            >
              {cur.slug ? (
                <Link
                  to={`/article/${cur.slug}`}
                  className="text-xs sm:text-[13px] font-bold whitespace-nowrap hover:underline underline-offset-2 truncate max-w-full"
                >
                  {loading && !items.length ? (
                    <span className="flex items-center gap-2 opacity-70">
                      <Loader2 className="w-3 h-3 animate-spin"/>
                      {cur.title}
                    </span>
                  ) : cur.title}
                </Link>
              ) : (
                <span className="text-xs sm:text-[13px] font-bold truncate max-w-full opacity-80">
                  {loading && !items.length ? (
                    <span className="flex items-center gap-2 opacity-70">
                      <Loader2 className="w-3 h-3 animate-spin"/>
                      {cur.title}
                    </span>
                  ) : cur.title}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Counter + Nav */}
        {display.length > 1 && (
          <div className="flex items-center gap-1.5 px-2 sm:px-3 shrink-0">
            <button onClick={prev} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
              <ChevronRight className="w-3.5 h-3.5"/>
            </button>
            <div className="hidden sm:flex items-center gap-1">
              {display.slice(0,10).map((_,i)=>(
                <button key={i} onClick={()=>setCurrent(i)}
                  className={`rounded-full transition-all duration-300 ${i===current%display.length?"w-4 h-2 bg-white":"w-1.5 h-1.5 bg-white/35 hover:bg-white/65"}`}/>
              ))}
            </div>
            <span className="sm:hidden text-[10px] font-bold text-white/60">
              {(current%display.length)+1}/{display.length}
            </span>
            <button onClick={next} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
              <ChevronLeft className="w-3.5 h-3.5"/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
