import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveArticleButtonProps {
  articleId: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
  showText?: boolean;
}

const SaveArticleButton = ({
  articleId,
  variant = "ghost",
  size = "sm",
  showText = false,
}: SaveArticleButtonProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkIfSaved = async () => {
      const { data } = await supabase
        .from("saved_articles")
        .select("id")
        .eq("user_id", user.id)
        .eq("article_id", articleId)
        .maybeSingle();

      setIsSaved(!!data);
    };

    checkIfSaved();
  }, [user, articleId]);

  const handleToggleSave = async () => {
    if (!user) {
      toast({
        title: t("تنبيه", "Notice"),
        description: t("يجب تسجيل الدخول أولاً", "Please sign in first"),
      });
      return;
    }

    setLoading(true);

    try {
      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from("saved_articles")
          .delete()
          .eq("user_id", user.id)
          .eq("article_id", articleId);

        if (error) throw error;
        setIsSaved(false);
        toast({ title: t("تم الحذف من المفضلة", "Removed from saved") });
      } else {
        // Add to saved
        const { error } = await supabase.from("saved_articles").insert({
          user_id: user.id,
          article_id: articleId,
        });

        if (error) throw error;
        setIsSaved(true);
        toast({ title: t("تم الحفظ في المفضلة", "Added to saved") });
      }
    } catch (error: any) {
      toast({
        title: t("خطأ", "Error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggleSave}
      disabled={loading}
      variant={variant}
      size={size}
      className={isSaved ? "text-primary" : ""}
    >
      <Bookmark
        className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`}
      />
      {showText && <span className="ms-1">{t("حفظ", "Save")}</span>}
    </Button>
  );
};

export default SaveArticleButton;
