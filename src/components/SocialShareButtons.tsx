import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Facebook, Twitter, Mail, Share2, MessageCircle, Send, Link2, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SocialShareButtonsProps {
  articleTitle: string;
  articleSlug: string;
  articleExcerpt?: string;
  articleId?: string;
  articleImage?: string;
}

const SocialShareButtons = ({ articleTitle, articleSlug, articleExcerpt, articleId, articleImage }: SocialShareButtonsProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const articleUrl = `${window.location.origin}/article/${articleSlug}`;
  const shareText = `${articleTitle} — جريدة الشارع المصري`;

  const trackShare = async (platform: string) => {
    if (!articleId) return;
    try {
      await supabase.from("share_tracking").insert({ article_id: articleId, platform });
    } catch (_) {}
  };

  const openShare = (platform: string, url: string) => {
    trackShare(platform);
    window.open(url, "_blank", "width=620,height=450,noopener");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(articleUrl);
    setCopied(true);
    trackShare("copy");
    setTimeout(() => setCopied(false), 2500);
  };

  // Native share (mobile)
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: articleTitle, text: articleExcerpt || shareText, url: articleUrl });
        trackShare("native");
      } catch (_) {}
    } else {
      setShowPanel(true);
    }
  };

  const buttons = [
    {
      id: "whatsapp", label: "WhatsApp",
      color: "bg-green-500 hover:bg-green-600",
      icon: <MessageCircle className="w-4 h-4" />,
      url: `https://wa.me/?text=${encodeURIComponent(shareText + "
" + articleUrl)}`,
    },
    {
      id: "facebook", label: "Facebook",
      color: "bg-blue-600 hover:bg-blue-700",
      icon: <Facebook className="w-4 h-4" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}&quote=${encodeURIComponent(articleTitle)}`,
    },
    {
      id: "twitter", label: "X / Twitter",
      color: "bg-black hover:bg-gray-800",
      icon: <Twitter className="w-4 h-4" />,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      id: "telegram", label: "Telegram",
      color: "bg-sky-500 hover:bg-sky-600",
      icon: <Send className="w-4 h-4" />,
      url: `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      id: "email", label: "Email",
      color: "bg-red-500 hover:bg-red-600",
      icon: <Mail className="w-4 h-4" />,
      url: `mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent((articleExcerpt || shareText) + "

" + articleUrl)}`,
    },
  ];

  return (
    <div className="relative" dir="rtl">
      {/* Compact share bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-muted-foreground flex items-center gap-1">
          <Share2 className="w-4 h-4" /> شارك:
        </span>
        {/* Quick share buttons */}
        {buttons.slice(0, 3).map((b) => (
          <button
            key={b.id}
            onClick={() => openShare(b.id, b.url)}
            className={`${b.color} text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-sm`}
          >
            {b.icon}
            <span className="hidden sm:inline">{b.label}</span>
          </button>
        ))}
        {/* More button */}
        <button
          onClick={() => setShowPanel(true)}
          className="text-xs font-bold px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-all flex items-center gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" /> المزيد
        </button>
        {/* Copy */}
        <button
          onClick={copyLink}
          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${copied ? "border-green-500 text-green-600 bg-green-50" : "border-border hover:bg-muted"}`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "تم النسخ!" : "نسخ"}
        </button>
      </div>

      {/* Full share panel */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowPanel(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-card rounded-t-3xl p-5 shadow-2xl border-t border-border"
            >
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
              <button
                onClick={() => setShowPanel(false)}
                className="absolute top-4 end-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Article preview card */}
              <div className="flex items-start gap-3 mb-5 p-3 bg-muted/50 rounded-2xl">
                {articleImage && (
                  <img
                    src={articleImage}
                    alt={articleTitle}
                    className="w-16 h-12 object-cover rounded-xl shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold line-clamp-2 leading-snug">{articleTitle}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    الشارع المصري — {window.location.host}
                  </p>
                </div>
              </div>

              {/* All share buttons */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {buttons.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { openShare(b.id, b.url); setShowPanel(false); }}
                    className={`${b.color} text-white rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95`}
                  >
                    <span className="text-xl">{b.icon}</span>
                    <span className="text-[10px] font-bold">{b.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => { copyLink(); setShowPanel(false); }}
                  className="bg-muted hover:bg-muted/70 rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all border border-border"
                >
                  <Link2 className="w-5 h-5" />
                  <span className="text-[10px] font-bold">نسخ الرابط</span>
                </button>
              </div>

              {/* Native share on mobile */}
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={() => { nativeShare(); setShowPanel(false); }}
                  className="w-full bg-primary text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> مشاركة عبر التطبيقات
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
