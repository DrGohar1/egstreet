import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Rss, Search, Globe, Cpu, ExternalLink, ArrowRight, Sparkles, Loader2,
  RefreshCw, Newspaper, TrendingUp, Zap, FlaskConical, Heart, Landmark,
  CheckCircle, XCircle, Clock, Send, Edit3, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  image: string | null;
  source: string;
  sourceIcon?: string;
  sourceLang: string;
}

interface SourceStatus {
  name: string;
  icon: string;
  count: number;
  error?: string;
}

const CATEGORIES = [
  { key: "world", ar: "عالمي", en: "World", icon: Globe, color: "bg-blue-500" },
  { key: "egypt", ar: "مصر", en: "Egypt", icon: Landmark, color: "bg-amber-500" },
  { key: "tech", ar: "تقنية", en: "Tech", icon: Cpu, color: "bg-violet-500" },
  { key: "sports", ar: "رياضة", en: "Sports", icon: Zap, color: "bg-emerald-500" },
  { key: "business", ar: "أعمال", en: "Business", icon: TrendingUp, color: "bg-orange-500" },
  { key: "science", ar: "علوم", en: "Science", icon: FlaskConical, color: "bg-cyan-500" },
  { key: "health", ar: "صحة", en: "Health", icon: Heart, color: "bg-rose-500" },
];

const fadeCard = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.04, duration: 0.4, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const NewsScraperPage = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [rewriting, setRewriting] = useState<string | null>(null);
  const [rewrittenContent, setRewrittenContent] = useState<Record<string, string>>({});
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [customUrl, setCustomUrl] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto refresh every 60s
  useEffect(() => {
    if (!autoRefresh || !activeCategory) return;
    const interval = setInterval(() => fetchNews(activeCategory), 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeCategory]);

  const fetchNews = async (category: string) => {
    setLoading(true);
    setActiveCategory(category);
    try {
      const { data, error } = await supabase.functions.invoke("news-scraper", {
        body: { category },
      });
      if (error) throw error;
      setItems(data.items || []);
      setSources(data.sources || []);
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
      setSources(data.sources || []);
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
      setEditingContent(prev => ({ ...prev, [key]: data.result }));
      toast({ title: t("تم إعادة الكتابة!", "Rewritten!") });
    } catch (e: any) {
      toast({ title: t("خطأ", "Error"), variant: "destructive" });
    }
    setRewriting(null);
  };

  const importArticle = async (item: NewsItem) => {
    const content = editingContent[item.link] || rewrittenContent[item.link] || item.description;
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
      toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("تم الاستيراد كمسودة!", "Imported as draft!") });
    }
  };

  const totalFetched = items.length;
  const activeSources = sources.filter(s => s.count > 0).length;

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/90 to-primary/60 p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Rss className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black">{t("مركز الأخبار الذكي", "Smart News Hub")}</h1>
              <p className="text-sm opacity-80">{t("سحب لحظي من أكثر من 20 مصدر عالمي مع إعادة كتابة بالذكاء الاصطناعي", "Live feed from 20+ global sources with AI rewriting")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCategory && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => fetchNews(activeCategory)}
                disabled={loading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                {t("تحديث", "Refresh")}
              </Button>
            )}
            <Button
              variant={autoRefresh ? "default" : "secondary"}
              size="sm"
              className={`gap-1.5 ${autoRefresh ? "bg-emerald-500 hover:bg-emerald-600 text-white border-0" : "bg-white/20 hover:bg-white/30 text-white border-0"}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Clock className="h-3.5 w-3.5" />
              {t("تلقائي", "Auto")}
            </Button>
          </div>
        </div>

        {/* Live Stats */}
        {totalFetched > 0 && (
          <div className="relative flex gap-4 mt-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-black">{totalFetched}</p>
              <p className="text-[10px] opacity-60">{t("خبر", "articles")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black">{activeSources}</p>
              <p className="text-[10px] opacity-60">{t("مصدر نشط", "active sources")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black">{Object.keys(rewrittenContent).length}</p>
              <p className="text-[10px] opacity-60">{t("مُعاد كتابته", "rewritten")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => fetchNews(cat.key)}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                isActive
                  ? `${cat.color} text-white shadow-lg shadow-${cat.color}/30 scale-105`
                  : "bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {language === "ar" ? cat.ar : cat.en}
            </button>
          );
        })}
      </div>

      {/* Custom URL */}
      <Card className="border-dashed border-2 border-border/50">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Input
              placeholder={t("أدخل رابط RSS مخصص من أي موقع...", "Enter any custom RSS feed URL...")}
              value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              className="flex-1 rounded-xl"
              onKeyDown={e => e.key === "Enter" && fetchCustom()}
            />
            <Button onClick={fetchCustom} disabled={loading} size="sm" className="gap-1.5 rounded-xl shrink-0">
              <Search className="h-4 w-4" />
              {t("جلب", "Fetch")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Source Status */}
      {sources.length > 0 && (
        <div>
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {t("حالة المصادر", "Source Status")} ({sources.length})
          </button>
          <AnimatePresence>
            {showSources && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2">
                  {sources.map((s, i) => (
                    <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${s.error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"}`}>
                      <span>{s.icon}</span>
                      <span className="font-medium">{s.name}</span>
                      {s.error ? (
                        <XCircle className="h-3 w-3" />
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <CheckCircle className="h-3 w-3" />
                          {s.count}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
          </div>
          <p className="text-sm text-muted-foreground">{t("جارِ السحب من المصادر...", "Fetching from sources...")}</p>
        </div>
      )}

      {/* Results Grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, i) => {
            const key = item.link;
            const hasRewrite = !!rewrittenContent[key];
            const isExpanded = expandedItem === key;
            return (
              <motion.div
                key={key || i}
                variants={fadeCard}
                custom={i}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <Card className={`overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 ${hasRewrite ? "ring-2 ring-emerald-500/30" : "hover:border-primary/30"}`}>
                  {/* Image */}
                  {item.image && (
                    <div className="aspect-video overflow-hidden bg-muted relative">
                      <img
                        src={item.image}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={e => (e.currentTarget.style.display = "none")}
                      />
                      <div className="absolute top-2 start-2">
                        <Badge className="bg-black/60 text-white text-[10px] backdrop-blur-sm border-0 gap-1">
                          {item.sourceIcon} {item.source}
                        </Badge>
                      </div>
                      {hasRewrite && (
                        <div className="absolute top-2 end-2">
                          <Badge className="bg-emerald-500 text-white text-[10px] border-0 gap-1">
                            <Sparkles className="h-2.5 w-2.5" /> AI
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <CardContent className="p-4">
                    {!item.image && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Badge variant="outline" className="text-[10px] gap-1">{item.sourceIcon} {item.source}</Badge>
                        {hasRewrite && <Badge className="bg-emerald-500 text-white text-[10px] border-0 gap-1"><Sparkles className="h-2.5 w-2.5" /> AI</Badge>}
                      </div>
                    )}

                    <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 mb-2">
                      {item.title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>

                    {item.pubDate && (
                      <p className="text-[10px] text-muted-foreground/60 mb-3 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(item.pubDate).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    )}

                    {/* Rewritten / Edit Area */}
                    <AnimatePresence>
                      {isExpanded && hasRewrite && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mb-3 overflow-hidden"
                        >
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              {t("النسخة المعاد كتابتها - اضغط للتعديل:", "AI Version - click to edit:")}
                            </p>
                            <Textarea
                              value={editingContent[key] || rewrittenContent[key]}
                              onChange={e => setEditingContent(prev => ({ ...prev, [key]: e.target.value }))}
                              rows={4}
                              className="text-xs bg-white dark:bg-background rounded-lg"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-[11px] h-7 rounded-lg flex-1"
                        onClick={() => rewriteArticle(item)}
                        disabled={rewriting === key}
                      >
                        {rewriting === key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        {t("إعادة كتابة", "Rewrite")}
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1 text-[11px] h-7 rounded-lg flex-1"
                        onClick={() => importArticle(item)}
                      >
                        <Send className="h-3 w-3" />
                        {t("استيراد", "Import")}
                      </Button>
                      {hasRewrite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 rounded-lg"
                          onClick={() => setExpandedItem(isExpanded ? null : key)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                      {item.link && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg" asChild>
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="h-10 w-10 text-primary/40" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">{t("اختر فئة للبدء", "Select a category to start")}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t("اختر فئة من الأعلى أو أدخل رابط RSS مخصص لسحب الأخبار من أي مصدر في العالم", "Choose a category above or enter a custom RSS URL to fetch news from any source worldwide")}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default NewsScraperPage;
