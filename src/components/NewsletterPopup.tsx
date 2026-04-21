import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NewsletterPopup = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("newsletter_dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => setOpen(true), 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem("newsletter_dismissed", "1");
  };

  const handleSubscribe = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("subscribers").insert({ email: email.trim() });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: t("أنت مشترك بالفعل!", "Already subscribed!") });
      } else {
        toast({ title: t("حدث خطأ", "Error"), variant: "destructive" });
      }
    } else {
      toast({ title: t("تم الاشتراك بنجاح! 🎉", "Subscribed successfully! 🎉") });
    }
    handleClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header gradient */}
            <div className="bg-primary p-6 text-primary-foreground text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <h3 className="text-xl font-bold">{t("لا تفوّت أهم الأخبار!", "Don't miss top news!")}</h3>
              <p className="text-sm opacity-80 mt-1">
                {t("اشترك في نشرتنا البريدية واحصل على آخر الأخبار فور نشرها", "Subscribe and get breaking news delivered to your inbox")}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={t("بريدك الإلكتروني", "Your email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                />
              </div>
              <Button onClick={handleSubscribe} disabled={loading} className="w-full font-bold">
                {loading ? t("جارِ الاشتراك...", "Subscribing...") : t("اشترك الآن", "Subscribe Now")}
              </Button>
              <button onClick={handleClose} className="w-full text-xs text-muted-foreground hover:underline">
                {t("لا شكراً", "No thanks")}
              </button>
            </div>

            <button onClick={handleClose} className="absolute top-3 left-3 p-1 rounded-full text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewsletterPopup;
