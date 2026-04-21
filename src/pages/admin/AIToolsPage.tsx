import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, Sparkles, Languages, FileText, Search, Wand2,
  Loader2, Copy, CheckCheck, RefreshCw, Zap, Shield, TrendingUp
} from "lucide-react";

type Action =
  | "rewrite" | "summarize" | "translate_ar" | "translate_en"
  | "improve" | "generate_title" | "generate_excerpt"
  | "seo_optimize" | "copyright_check";

interface Tool {
  id: Action;
  icon: React.ElementType;
  color: string;
  ar: string;
  en: string;
  desc_ar: string;
  desc_en: string;
}

const TOOLS: Tool[] = [
  { id: "rewrite", icon: Wand2, color: "text-violet-500", ar: "إعادة كتابة", en: "Rewrite", desc_ar: "أعد كتابة المقال بأسلوب أصلي", desc_en: "Rewrite with original style" },
  { id: "summarize", icon: FileText, color: "text-blue-500", ar: "تلخيص", en: "Summarize", desc_ar: "لخّص المقال في فقرتين", desc_en: "Summarize in 2 paragraphs" },
  { id: "translate_ar", icon: Languages, color: "text-emerald-500", ar: "ترجمة للعربية", en: "→ Arabic", desc_ar: "ترجم النص إلى العربية", desc_en: "Translate to Arabic" },
  { id: "translate_en", icon: Languages, color: "text-cyan-500", ar: "ترجمة للإنجليزية", en: "→ English", desc_ar: "ترجم النص إلى الإنجليزية", desc_en: "Translate to English" },
  { id: "improve", icon: TrendingUp, color: "text-orange-500", ar: "تحسين الأسلوب", en: "Improve", desc_ar: "حسّن الأسلوب والنحو", desc_en: "Improve style & grammar" },
  { id: "generate_title", icon: Zap, color: "text-yellow-500", ar: "اقتراح عناوين", en: "Suggest Titles", desc_ar: "5 عناوين SEO-friendly", desc_en: "5 SEO-friendly headlines" },
  { id: "generate_excerpt", icon: Sparkles, color: "text-pink-500", ar: "كتابة مقدمة", en: "Write Excerpt", desc_ar: "مقدمة جذابة للمقال", desc_en: "Compelling article excerpt" },
  { id: "seo_optimize", icon: Search, color: "text-indigo-500", ar: "تحسين SEO", en: "SEO Optimize", desc_ar: "meta title + description + كلمات مفتاحية", desc_en: "Meta tags + keywords" },
  { id: "copyright_check", icon: Shield, color: "text-rose-500", ar: "فحص حقوق النشر", en: "Copyright Check", desc_ar: "تقييم مخاطر الانتحال", desc_en: "Plagiarism risk assessment" },
];

const AIToolsPage = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<Action | null>(null);
  const [copied, setCopied] = useState(false);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [isMock, setIsMock] = useState(false);

  const runTool = async (tool: Tool) => {
    if (!input.trim()) {
      toast({ title: t("الرجاء إدخال نص", "Please enter text"), variant: "destructive" });
      return;
    }
    setActiveTool(tool.id);
    setLoading(true);
    setResult("");
    setIsMock(false);
    try {
      const { data, error } = await supabase.functions.invoke("ai-rewrite", {
        body: { content: input, action: tool.id, language },
      });
      if (error) throw error;
      setResult(data.result || "");
      if (data.tokens) setTokenCount(data.tokens);
      if (data.mock) {
        setIsMock(true);
        toast({ title: t("وضع تجريبي — أضف OPENAI_API_KEY في Supabase", "Demo mode — add OPENAI_API_KEY in Supabase") });
      }
    } catch (e: any) {
      toast({ title: t("خطأ", "Error"), description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600/80 to-primary/60 p-6 text-white relative overflow-hidden">
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black">{t("أدوات الذكاء الاصطناعي", "AI Writing Tools")}</h1>
            <p className="text-sm opacity-80">{t("9 أدوات لتحرير المحتوى الإخباري بالذكاء الاصطناعي", "9 AI tools for professional news editing")}</p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-0 text-xs">GPT-4o mini</Badge>
            <Badge className="bg-emerald-500/80 text-white border-0 text-xs">✓ Live</Badge>
          </div>
        </div>
      </div>

      {/* Key hint */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">🔑</span>
          <div>
            <p className="text-sm font-bold text-foreground">{t("لتفعيل AI حقيقي:", "To enable real AI:")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "Supabase Dashboard → Edge Functions → Secrets → أضف: OPENAI_API_KEY = sk-...",
                "Supabase Dashboard → Edge Functions → Secrets → Add: OPENAI_API_KEY = sk-..."
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">{t("النص المدخل", "Input Text")}</CardTitle>
              <CardDescription className="text-xs">{t("الصق مقالك أو خبرك هنا", "Paste your article or news here")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={t("الصق النص هنا...", "Paste text here...")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="text-sm leading-relaxed resize-none"
                dir={language === "ar" ? "rtl" : "ltr"}
              />
              <p className="text-xs text-muted-foreground mt-2 text-end">
                {input.length.toLocaleString()} {t("حرف", "chars")}
              </p>
            </CardContent>
          </Card>

          {/* Tools Grid */}
          <div className="grid grid-cols-3 gap-2">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id && loading;
              return (
                <button
                  key={tool.id}
                  onClick={() => runTool(tool)}
                  disabled={loading}
                  title={language === "ar" ? tool.desc_ar : tool.desc_en}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-200 ${
                    isActive
                      ? "border-primary bg-primary/10 scale-95"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  {isActive
                    ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    : <Icon className={`h-4 w-4 ${tool.color}`} />
                  }
                  <span className="text-[10px] font-bold leading-tight">
                    {language === "ar" ? tool.ar : tool.en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  {t("النتيجة", "Result")}
                  {isMock && <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">demo</Badge>}
                  {tokenCount && !isMock && (
                    <Badge variant="outline" className="text-[10px]">
                      {tokenCount.toLocaleString()} tokens
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  {activeTool
                    ? TOOLS.find(t => t.id === activeTool)?.[language === "ar" ? "desc_ar" : "desc_en"]
                    : t("اختر أداة من اليسار لتبدأ", "Choose a tool to start")}
                </CardDescription>
              </div>
              {result && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={copy} className="h-8 gap-1.5 text-xs">
                    {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {t("نسخ", "Copy")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => activeTool && runTool(TOOLS.find(t => t.id === activeTool)!)} className="h-8 gap-1.5 text-xs" disabled={loading}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t("تجديد", "Retry")}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-violet-500 animate-pulse" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t("الذكاء الاصطناعي يعمل...", "AI is working...")}</p>
                </div>
              ) : result ? (
                <Textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  rows={20}
                  className="text-sm leading-relaxed resize-none border-0 focus-visible:ring-0 p-0 bg-transparent"
                  dir={language === "ar" ? "rtl" : "ltr"}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                  <Sparkles className="h-10 w-10 opacity-20" />
                  <p className="text-sm">{t("النتيجة ستظهر هنا", "Result will appear here")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIToolsPage;
