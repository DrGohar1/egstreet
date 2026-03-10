import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Rss, Search, Globe, Cpu, ExternalLink, ArrowRight, Sparkles, Loader2, Image as ImageIcon, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  image: string | null;
  source: string;
  sourceLang: string;
}

const NewsScraperPage = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [rewriting, setRewriting] = useState<string | null>(null);
  const [rewrittenContent, setRewrittenContent] = useState<Record<string, string>>({});
  const [customUrl, setCustomUrl] = useState("");
  const [activeCategory, setActiveCategory] = useState("world");

  const categories = [
    { key: "world", ar: "عالمي", en: "World", icon: Globe },
    { key: "tech", ar: "تقنية", en: "Tech", icon: Cpu },
    { key: "sports", ar: "رياضة", en: "Sports", icon: "⚽" },
    { key: "business", ar: "أعمال", en: "Business", icon: "💼" },
  ];

  const fetchNews = async (category: string) => {
    setLoading(true);
    setActiveCategory(category);
    try {
      const { data, error } = await supabase.functions.invoke("news-scraper", {
        body: { category },
      });
      if (error) throw error;
      setItems(data.items || []);
    } catch (e: any) {
      toast({ title: t("خطأ في جلب الأخبار", "Error fetching news"), variant: "destructive" });
    }
    setLoading(false);
  };

  const fetchCustom = async () => {
    if (!customUrl.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("news-scraper", {
        body: { customUrl: customUrl.trim() },
      });
      if (error) throw error;
      setItems(data.items || []);
    } catch (e: any) {
      toast({ title: t("خطأ", "Error"), description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const rewriteArticle = async (item: NewsItem) => {
    const key = item.link;
    setRewriting(key);
    try {
      const { data, error } = await supabase.functions.invoke("ai-rewrite", {
        body: {
          content: `Title: ${item.title}\n\n${item.description}`,
          action: "rewrite",
          language: language === "ar" ? "ar" : "en",
        },
      });
      if (error) throw error;
      setRewrittenContent(prev => ({ ...prev, [key]: data.result }));
      toast({ title: t("تم إعادة الكتابة بنجاح!", "Rewritten successfully!") });
    } catch (e: any) {
      toast({ title: t("خطأ في إعادة الكتابة", "Rewrite error"), variant: "destructive" });
    }
    setRewriting(null);
  };

  const importArticle = async (item: NewsItem) => {
    const content = rewrittenContent[item.link] || item.description;
    const slug = item.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").slice(0, 80) + "-" + Date.now();
    
    const { error } = await supabase.from("articles").insert({
      title: item.title,
      slug,
      content: `<p>${content}</p>`,
      excerpt: content.slice(0, 200),
      featured_image: item.image,
      status: "draft" as const,
      author_id: (await supabase.auth.getUser()).data.user?.id,
    });

    if (error) {
      toast({ title: t("خطأ في الاستيراد", "Import error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("تم استيراد المقال كمسودة!", "Article imported as draft!") });
    }
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-l from-secondary to-secondary/80 p-6 text-secondary-foreground">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Rss className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-black">{t("سحب الأخبار التلقائي", "Auto News Scraper")}</h1>
            <p className="text-sm opacity-80">{t("اسحب أخبار من مصادر عالمية وأعد كتابتها بالذكاء الاصطناعي", "Fetch news from global sources and rewrite with AI")}</p>
          </div>
        </div>
      </div>

      {/* Category Buttons */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button
            key={cat.key}
            variant={activeCategory === cat.key ? "default" : "outline"}
            size="sm"
            onClick={() => fetchNews(cat.key)}
            disabled={loading}
            className="gap-1.5"
          >
            {typeof cat.icon === "string" ? <span>{cat.icon}</span> : <cat.icon className="h-4 w-4" />}
            {language === "ar" ? cat.ar : cat.en}
          </Button>
        ))}
      </div>

      {/* Custom URL */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder={t("أدخل رابط RSS مخصص...", "Enter custom RSS feed URL...")}
              value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              className="flex-1"
              onKeyDown={e => e.key === "Enter" && fetchCustom()}
            />
            <Button onClick={fetchCustom} disabled={loading} size="sm" className="gap-1.5 shrink-0">
              <Search className="h-4 w-4" />
              {t("جلب", "Fetch")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {items.map((item, i) => {
          const key = item.link;
          const hasRewrite = !!rewrittenContent[key];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    {item.image && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-muted">
                        <img src={item.image} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-foreground text-sm leading-tight line-clamp-2">{item.title}</h3>
                        <Badge variant="outline" className="text-[10px] shrink-0">{item.source}</Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
                      
                      {item.pubDate && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(item.pubDate).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                        </p>
                      )}

                      {/* Rewritten content */}
                      {hasRewrite && (
                        <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {t("النسخة المعاد كتابتها:", "Rewritten version:")}
                          </p>
                          <p className="text-xs text-foreground whitespace-pre-wrap">{rewrittenContent[key]}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs h-7"
                          onClick={() => rewriteArticle(item)}
                          disabled={rewriting === key}
                        >
                          {rewriting === key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          {t("إعادة كتابة AI", "AI Rewrite")}
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1 text-xs h-7"
                          onClick={() => importArticle(item)}
                        >
                          <ArrowRight className="h-3 w-3" />
                          {t("استيراد كمسودة", "Import as Draft")}
                        </Button>
                        {item.link && (
                          <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                            <a href={item.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {!loading && items.length === 0 && (
        <div className="text-center py-16">
          <Rss className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("اختر فئة أو أدخل رابط RSS لبدء سحب الأخبار", "Select a category or enter an RSS URL to start")}</p>
        </div>
      )}
    </motion.div>
  );
};

export default NewsScraperPage;
