import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Radio } from "lucide-react";

export default function BreakingTicker() {
  const [items, setItems] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(()=>{
    supabase.from("breaking_news").select("id,title,slug").eq("is_active",true)
      .order("created_at",{ascending:false}).limit(10)
      .then(({data})=>{ if(data?.length) setItems(data); });
  },[]);

  useEffect(()=>{
    if (!items.length) return;
    const t = setInterval(()=>setCurrent(c=>(c+1)%items.length), 4000);
    return ()=>clearInterval(t);
  },[items]);

  if (!items.length) return null;

  return (
    <div className="bg-primary text-white flex items-center overflow-hidden select-none" style={{height:"38px"}}>
      {/* Label */}
      <div className="flex items-center gap-0 shrink-0 h-full">
        <div className="flex items-center gap-1.5 bg-red-700 h-full px-3">
          <Radio className="w-3.5 h-3.5 animate-pulse"/>
          <span className="text-xs font-black whitespace-nowrap hidden sm:inline">عاجل</span>
          <Zap className="w-3 h-3 sm:hidden animate-pulse"/>
        </div>
        <div className="w-0 h-0 border-y-[19px] border-y-transparent border-r-[10px] border-r-red-700"/>
      </div>

      {/* Sliding text */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center px-3">
        {items.map((item,i)=>(
          <div key={item.id}
            style={{
              position:"absolute", inset:0,
              display:"flex", alignItems:"center", paddingInline:"12px",
              transition:"opacity 0.4s, transform 0.4s",
              opacity: i===current ? 1 : 0,
              transform: i===current ? "translateY(0)" : "translateY(8px)",
              pointerEvents: i===current ? "auto" : "none"
            }}>
            <Link
              to={item.slug ? `/article/${item.slug}`:"/"}
              className="text-xs sm:text-sm font-bold whitespace-nowrap hover:underline underline-offset-2 truncate max-w-full">
              {item.title}
            </Link>
          </div>
        ))}
      </div>

      {/* Counter + Dots */}
      <div className="flex items-center gap-2 px-3 shrink-0">
        <span className="text-[10px] font-bold text-white/60 hidden sm:inline">
          {current+1}/{items.length}
        </span>
        <div className="flex items-center gap-1">
          {items.map((_,i)=>(
            <button key={i} onClick={()=>setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${i===current?"w-4 h-2 bg-white":"w-1.5 h-1.5 bg-white/40 hover:bg-white/70"}`}/>
          ))}
        </div>
      </div>
    </div>
  );
}
