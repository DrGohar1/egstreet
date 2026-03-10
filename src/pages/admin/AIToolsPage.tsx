import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Brain, Sparkles, FileText, Languages, Shield, Search, Loader2, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

const AI_TOOLS = [
  { key: "rewrite", icon: Sparkles, ar: "إعادة كتابة", en: "Rewrite", desc_ar: "أعد كتابة المحتوى بأسلوب جديد تماماً لتفادي حقوق النشر", desc_en: "Rewrite content in a completely new style to avoid copyright" },
  { key: "summarize", icon: FileText, ar: "تلخيص", en: "Summarize", desc_ar: "لخّص المقال في فقرتين أو ثلاث فقرات", desc_en: "Summarize the article in 2-3 paragraphs" },
  { key: "translate_ar", icon: Languages, ar: "ترجمة للعربية", en: "Translate to Arabic", desc_ar: "ترجم المقال للعربية بأسلوب إخباري احترافي", desc_en: "Translate to Arabic with a professional news tone" },
  { key: "translate_en", icon: Languages, ar: "ترجمة للإنجليزية", en: "Translate to English", desc_ar: "ترجم المقال للإنجليزية بأسلوب إخباري احترافي", desc_en: "Translate to English with a professional news tone" },
  { key: "improve", icon: Sparkles, ar: "تحسين المحتوى", en: "Improve Content", desc_ar: "حسّن جودة الكتابة والقواعد والأسلوب", desc_en: "Improve writing quality, grammar, and style" },
  { key: "generate_title", icon: FileText, ar: "توليد عناوين", en: "Generate Titles", desc_ar: "أنشئ 5 عناوين جذابة محسّنة لـ SEO", desc_en: "Generate 5 compelling SEO-optimized headlines" },
  { key: "generate_excerpt", icon: FileText, ar: "توليد ملخص", en: "Generate Excerpt", desc_ar: "أنشئ ملخصاً مختصراً جذاباً للمعاينة", desc_en: "Generate a compelling short preview excerpt" },
  { key: "copyright_check", icon: Shield, ar: "فحص حقوق النشر", en: "Copyright Check", desc_ar: "فحص المحتوى للتأكد من أصالته وعدم انتهاك حقوق النشر", desc_en: "Check content for originality and copyright risks" },
  { key: "seo_optimize", icon: Search, ar: "تحسين SEO", en: "SEO Optimize", desc_ar: "احصل على اقتراحات تحسين SEO للمقال", desc_en: "Get SEO optimization suggestions for the article" },
];

const AIToolsPage = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState("");
  const [copied, setCopied] = useState(false);

  const runTool = async (action: string) => {
    if (!inputText.trim()) {
      toast({ title: t("أدخل محتوى أولاً", "Enter content first"), variant: "destructive" });
      return;
    }
    setLoading(true);
    setActiveTool(action);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-rewrite", {
        body: { content: inputText, action, language: language === "ar" ? "ar" : "en" },
      });
      if (error) throw error;
      setResult(data.result || "");
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("429")) {
        toast({ title: t("تم تجاوز حد الطلبات، حاول لاحقاً", "Rate limit exceeded, try later"), variant: "destructive" });
      } else if (msg.includes("402")) {
        toast({ title: t("يرجى إضافة رصيد", "Please add credits"), variant: "destructive" });
      } else {
        toast({ title: t("خطأ", "Error"), description: msg, variant: "destructive" });
      }
    }
    setLoading(false);
    setActiveTool("");
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-l from-secondary to-secondary/80 p-6 text-secondary-foreground">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-black">{t("أدوات الذكاء الاصطناعي", "AI Tools")}</h1>
            <p className="text-sm opacity-80">{t("أدوات AI متقدمة لإدارة المحتوى وحقوق النشر", "Advanced AI tools for content management & copyright")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("المحتوى المدخل", "Input Content")}</CardTitle>
              <CardDescription>{t("الصق المقال أو النص هنا", "Paste article or text here")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={t("الصق المحتوى هنا...", "Paste content here...")}
                rows={12}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-2">
                {inputText.length} {t("حرف", "characters")}
              </p>
            </CardContent>
          </Card>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AI_TOOLS.map(tool => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.key}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-start text-start gap-1 hover:border-primary/50 transition-all"
                  onClick={() => runTool(tool.key)}
                  disabled={loading}
                >
                  <div className="flex items-center gap-2 w-full">
                    {loading && activeTool === tool.key ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary" />
                    )}
                    <span className="font-bold text-xs">{language === "ar" ? tool.ar : tool.en}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {language === "ar" ? tool.desc_ar : tool.desc_en}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Output */}
        <Card className="h-fit sticky top-20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {t("النتيجة", "Result")}
              </CardTitle>
              {result && (
                <Button variant="ghost" size="sm" onClick={copyResult} className="h-7 gap-1 text-xs">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? t("تم النسخ", "Copied") : t("نسخ", "Copy")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm">{t("جارِ المعالجة بالذكاء الاصطناعي...", "AI processing...")}</p>
              </div>
            ) : result ? (
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                {result}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Brain className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm">{t("اختر أداة وأدخل محتوى للبدء", "Select a tool and enter content to start")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default AIToolsPage;
