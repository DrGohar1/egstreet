import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Facebook, Twitter, Mail, Share2, MessageCircle, Send, Link2, Copy, Check, X } from "lucide-react";

interface Props {
  articleTitle: string; articleSlug: string;
  articleExcerpt?: string; articleId?: string; articleImage?: string;
}

const SocialShareButtons = ({ articleTitle, articleSlug, articleExcerpt, articleId, articleImage }: Props) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [panel, setPanel] = useState(false);

  const url   = `${window.location.origin}/article/${articleSlug}`;
  const text  = `${articleTitle} — جريدة الشارع المصري`;

  const track = async (platform: string) => {
    if (articleId) {
      try { await supabase.from("share_tracking").insert({ article_id: articleId, platform }); }
      catch (_) {}
    }
  };

  const open = (platform: string, shareUrl: string) => {
    track(platform);
    window.open(shareUrl, "_blank", "width=620,height=440,noopener");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    track("copy"); setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: articleTitle, text: articleExcerpt || text, url }); track("native"); }
      catch (_) {}
    } else setPanel(true);
  };

  const btns = [
    { id:"whatsapp", label:"واتساب",  color:"bg-green-500 hover:bg-green-600",  icon:<MessageCircle className="w-5 h-5"/>, url:`https://wa.me/?text=${encodeURIComponent(text+"\n"+url)}` },
    { id:"facebook", label:"فيسبوك", color:"bg-blue-600 hover:bg-blue-700",   icon:<Facebook className="w-5 h-5"/>,      url:`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { id:"twitter",  label:"تويتر",  color:"bg-black hover:bg-gray-800",       icon:<Twitter className="w-5 h-5"/>,       url:`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { id:"telegram", label:"تيليغرام",color:"bg-sky-500 hover:bg-sky-600",    icon:<Send className="w-5 h-5"/>,          url:`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { id:"email",    label:"إيميل",   color:"bg-red-500 hover:bg-red-600",     icon:<Mail className="w-5 h-5"/>,          url:`mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent((articleExcerpt||text)+"\n\n"+url)}` },
  ];

  return (
    <div className="relative" dir="rtl">
      {/* Compact bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-muted-foreground flex items-center gap-1"><Share2 className="w-4 h-4"/>شارك:</span>
        {btns.slice(0,3).map(b=>(
          <button key={b.id} onClick={()=>open(b.id,b.url)}
            className={`${b.color} text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-sm`}>
            <span className="w-4 h-4">{b.icon}</span>
            <span className="hidden sm:inline">{b.label}</span>
          </button>
        ))}
        <button onClick={()=>setPanel(true)}
          className="text-xs font-bold px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-all flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5"/> المزيد
        </button>
        <button onClick={copy}
          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${copied?"border-green-500 text-green-600 bg-green-50 dark:bg-green-950":"border-border hover:bg-muted"}`}>
          {copied?<Check className="w-3.5 h-3.5"/>:<Copy className="w-3.5 h-3.5"/>}
          {copied?"تم النسخ!":"نسخ"}
        </button>
      </div>

      {/* Full share panel */}
      <AnimatePresence>
        {panel && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/60 z-50" onClick={()=>setPanel(false)}/>
            <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:30}}
              className="fixed bottom-0 inset-x-0 z-50 bg-card rounded-t-3xl p-5 shadow-2xl border-t border-border max-w-lg mx-auto">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4"/>
              <button onClick={()=>setPanel(false)}
                className="absolute top-4 end-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4"/>
              </button>
              {/* Article preview */}
              <div className="flex items-start gap-3 mb-5 p-3 bg-muted/50 rounded-2xl">
                {articleImage && <img src={articleImage} alt="" className="w-16 h-12 object-cover rounded-xl shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold line-clamp-2 leading-snug">{articleTitle}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">الشارع المصري — egstreet.vercel.app</p>
                </div>
              </div>
              {/* All buttons */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {btns.map(b=>(
                  <button key={b.id} onClick={()=>{open(b.id,b.url);setPanel(false);}}
                    className={`${b.color} text-white rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95`}>
                    {b.icon}
                    <span className="text-[9px] font-bold">{b.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={()=>{copy();setPanel(false);}}
                className="w-full flex items-center justify-center gap-2 border border-border rounded-2xl py-3 text-sm font-bold hover:bg-muted transition-colors mb-3">
                <Link2 className="w-4 h-4"/> نسخ الرابط
              </button>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button onClick={()=>{nativeShare();setPanel(false);}}
                  className="w-full bg-primary text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4"/> مشاركة عبر التطبيقات
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
export default SocialShareButtons;
