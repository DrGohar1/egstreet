import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, Facebook, Send } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  title: string;
  url: string;
  image?: string;
  floating?: boolean;
  inline?: boolean;
}

const PLATFORMS = [
  { id:"whatsapp", label:"واتساب",  color:"bg-green-500",  icon:MessageCircle,
    href:(t:string,u:string)=>`https://api.whatsapp.com/send?text=${encodeURIComponent(t+" "+u)}` },
  { id:"facebook", label:"فيسبوك",  color:"bg-blue-600",   icon:Facebook,
    href:(t:string,u:string)=>`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { id:"twitter",  label:"تويتر",   color:"bg-sky-500",    icon:Twitter,
    href:(t:string,u:string)=>`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { id:"telegram", label:"تيليغرام",color:"bg-blue-400",   icon:Send,
    href:(t:string,u:string)=>`https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
];

export default function SocialShareButtons({ title, url, image, floating, inline }: Props) {
  const [copied,  setCopied]  = useState(false);
  const [showAll, setShowAll] = useState(false);

  const copy = ()=>{
    navigator.clipboard.writeText(url).then(()=>{ setCopied(true); toast.success("تم نسخ الرابط!"); setTimeout(()=>setCopied(false),2000); });
  };

  const native = ()=>{
    if (navigator.share) navigator.share({ title, url }).catch(()=>{});
    else setShowAll(s=>!s);
  };

  /* Inline mode: horizontal row */
  if (inline) return (
    <div className="flex flex-wrap items-center gap-2">
      {PLATFORMS.map(p=>(
        <a key={p.id} href={p.href(title,url)} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-1.5 text-white text-xs font-bold px-3 py-2 rounded-xl ${p.color} hover:opacity-80 transition-all active:scale-95`}>
          <p.icon className="w-3.5 h-3.5"/>
          {p.label}
        </a>
      ))}
      <button onClick={copy}
        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-border transition-all ${copied?"bg-green-500 text-white border-green-500":"hover:bg-muted"}`}>
        {copied?<Check className="w-3.5 h-3.5"/>:<Copy className="w-3.5 h-3.5"/>}
        {copied?"تم النسخ":"نسخ الرابط"}
      </button>
    </div>
  );

  /* Floating mode: vertical pill */
  if (floating) return (
    <div className="flex flex-col gap-1.5">
      <button onClick={native}
        className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-muted transition-all hover:scale-105"
        title="مشاركة">
        <Share2 className="w-4 h-4"/>
      </button>
      <AnimatePresence>
        {showAll && PLATFORMS.map((p,i)=>(
          <motion.a key={p.id} href={p.href(title,url)} target="_blank" rel="noopener noreferrer"
            initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1,transition:{delay:i*.05}}} exit={{opacity:0,scale:.8}}
            className={`w-10 h-10 rounded-full ${p.color} text-white flex items-center justify-center shadow-sm hover:opacity-80 transition-all hover:scale-110`}
            title={p.label}>
            <p.icon className="w-4 h-4"/>
          </motion.a>
        ))}
      </AnimatePresence>
      <button onClick={copy}
        className={`w-10 h-10 rounded-full border border-border flex items-center justify-center shadow-sm transition-all hover:scale-105 ${copied?"bg-green-500 text-white border-green-500":"bg-card hover:bg-muted"}`}>
        {copied?<Check className="w-4 h-4"/>:<Copy className="w-4 h-4"/>}
      </button>
    </div>
  );

  return null;
}
