import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";

export default function BreakingTicker() {
  const [items,   setItems]   = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(()=>{
    supabase.from("breaking_news").select("id,title,slug").eq("is_active",true)
      .order("created_at",{ascending:false}).limit(8)
      .then(({data})=>{ if(data?.length) setItems(data); });
  },[]);

  useEffect(()=>{
    if (!items.length) return;
    timerRef.current = setInterval(()=>setCurrent(c=>(c+1)%items.length), 4000);
    return ()=>{ if(timerRef.current) clearInterval(timerRef.current); };
  },[items]);

  if (!items.length) return null;

  return (
    <div className="bg-primary text-white h-9 flex items-center overflow-hidden select-none">
      <div className="flex items-center gap-0 h-full shrink-0">
        <div className="flex items-center gap-2 bg-red-700 h-full px-3">
          <Zap className="w-3.5 h-3.5 animate-pulse"/>
          <span className="text-xs font-black whitespace-nowrap">عاجل</span>
        </div>
        <div className="w-0 h-0 border-y-[18px] border-y-transparent border-r-[10px] border-r-red-700"/>
      </div>
      <div className="flex-1 overflow-hidden px-3 relative h-full flex items-center">
        {items.map((item,i)=>(
          <div key={item.id}
            className={`absolute inset-0 flex items-center px-3 transition-all duration-500 ${i===current?"opacity-100 translate-y-0":"opacity-0 translate-y-2"}`}>
            <Link to={item.slug ? `/article/${item.slug}`:"/"}
              className="text-xs font-bold whitespace-nowrap hover:underline truncate">
              {item.title}
            </Link>
          </div>
        ))}
      </div>
      {/* Dots */}
      <div className="flex items-center gap-1 px-3 shrink-0">
        {items.map((_,i)=>(
          <button key={i} onClick={()=>setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i===current?"bg-white":"bg-white/40"}`}/>
        ))}
      </div>
    </div>
  );
}
