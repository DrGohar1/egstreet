import { useState } from "react";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NewsletterFooter = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("subscribers").insert({ email: email.trim() });
    setLoading(false);
    if (error) {
      toast({
        title: error.code === "23505"
          ? t("أنت مشترك بالفعل!", "Already subscribed!")
          : t("حدث خطأ", "Error"),
        variant: error.code === "23505" ? "default" : "destructive",
      });
    } else {
      toast({ title: t("تم الاشتراك بنجاح! 🎉", "Subscribed!") });
      setEmail("");
    }
  };

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-5 h-5 text-primary" />
        <h4 className="font-bold text-sm">{t("النشرة البريدية", "Newsletter")}</h4>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {t("احصل على آخر الأخبار في بريدك مباشرة", "Get the latest news in your inbox")}
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder={t("بريدك الإلكتروني", "Your email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
        />
        <Button onClick={handleSubscribe} disabled={loading} size="sm" className="shrink-0">
          {t("اشترك", "Join")}
        </Button>
      </div>
    </div>
  );
};

export default NewsletterFooter;
