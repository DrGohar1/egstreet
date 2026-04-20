import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Facebook,
  Twitter,
  Mail,
  Share2,
  MessageCircle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialShareButtonsProps {
  articleTitle: string;
  articleSlug: string;
  articleExcerpt?: string;
  articleId?: string;
}

const SocialShareButtons = ({
  articleTitle,
  articleSlug,
  articleExcerpt,
  articleId,
}: SocialShareButtonsProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const articleUrl = `${window.location.origin}/article/${articleSlug}`;
  const shareText = `${articleTitle} - ${t("جريدة الشارع المصري", "EgStreet News")}`;

  const trackShare = async (platform: string) => {
    if (!articleId) return;
    try {
      await supabase.from("share_tracking").insert({
        article_id: articleId,
        platform,
      });
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  };

  const handleShare = (platform: string, url: string) => {
    trackShare(platform);
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareButtons = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "hover:text-blue-600",
      onClick: () =>
        handleShare(
          "facebook",
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`
        ),
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "hover:text-blue-400",
      onClick: () =>
        handleShare(
          "twitter",
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}`
        ),
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "hover:text-green-500",
      onClick: () =>
        handleShare(
          "whatsapp",
          `https://wa.me/?text=${encodeURIComponent(shareText + " " + articleUrl)}`
        ),
    },
    {
      name: "Telegram",
      icon: Send,
      color: "hover:text-blue-500",
      onClick: () =>
        handleShare(
          "telegram",
          `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}`
        ),
    },
    {
      name: "Email",
      icon: Mail,
      color: "hover:text-red-500",
      onClick: () =>
        handleShare(
          "email",
          `mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent(articleExcerpt || shareText + "\n\n" + articleUrl)}`
        ),
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(articleUrl);
    toast({
      title: t("تم النسخ", "Copied"),
      description: t("تم نسخ الرابط إلى الحافظة", "Link copied to clipboard"),
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {shareButtons.map((button) => (
        <Button
          key={button.name}
          variant="ghost"
          size="sm"
          onClick={button.onClick}
          className={`${button.color} transition-colors`}
          title={button.name}
        >
          <button.icon className="w-4 h-4" />
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyLink}
        className="hover:text-primary transition-colors"
        title={t("نسخ الرابط", "Copy link")}
      >
        <Share2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default SocialShareButtons;
