import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Eye, Pencil, Send, Search, FileText,
  Star, Zap, ArrowLeft, CheckCheck, Clock, Globe, Lock,
  MoreVertical, Filter, ChevronDown, Loader2, ImageIcon,
  AlignLeft, Settings2, Tag, X, Save, BarChart2,
} from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import { motion, AnimatePresence } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type ArticleStatus = Database["public"]["Enums"]["article_status"];
interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  status: ArticleStatus; created_at: string; published_at: string | null;
  author_id: string | null; category_id: string | null; content: string | null;
  featured_image: string | null; is_breaking: boolean | null; is_featured: boolean | null;
  custom_author_name: string | null; views: number; reading_time?: number | null;
}
interface Category { id: string; name_ar: string; name_en: string; }

const STATUS = {
  draft:          { ar: "مسودة",        en: "Draft",    color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", dot: "bg-zinc-400" },
  pending_review: { ar: "قيد المراجعة", en: "Pending",  color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", dot: "bg-amber-400" },
  published:      { ar: "منشور",        en: "Published",color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", dot: "bg-emerald-500" },
  archived:       { ar: "مؤرشف",        en: "Archived", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400", dot: "bg-rose-400" },
};

// === ARTICLE EDITOR (full screen modal) ===
const ArticleEditor = ({
  article, categories, language, onSave, onClose,
}: {
  article: Partial<Article> | null;
  categories: Category[];
  language: string;
  onSave: () => void;
  onClose: () => void;
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNew = !article?.id;

  const [tab, setTab] = useState<"content" | "settings" | "seo">("content");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [content, setContent] = useState(article?.content || "");
  const [categoryId, setCategoryId] = useState(article?.category_id || "");
  const [status, setStatus] = useState<ArticleStatus>(article?.status || "draft");
  const [featuredImage, setFeaturedImage] = useState(article?.featured_image || "");
  const [isBreaking, setIsBreaking] = useState(article?.is_breaking || false);
  const [isFeatured, setIsFeatured] = useState(article?.is_featured || false);
  const [customAuthor, setCustomAuthor] = useState(article?.custom_author_name || "");
  const [readingTime, setReadingTime] = useState(article?.reading_time || 5);
  const [wordCount, setWordCount] = useState(0);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-slug from title
  useEffect(() => {
    if (isNew && title) {
      const num = Date.now().toString().slice(-6);
      setSlug("article-" + num);
    }
  }, [title, isNew]);

  // Word count + reading time
  useEffect(() => {
    const words = content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setReadingTime(Math.max(1, Math.ceil(words / 200)));
  }, [content]);

  // Auto-save draft every 30s
  useEffect(() => {
    if (!isNew || !title) return;
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      if (status === "draft") handleSave("draft", true);
    }, 30000);
    return () => clearTimeout(autoSaveRef.current);
  }, [title, content, status]);

  const handleSave = async (forcedStatus?: ArticleStatus, silent = false) => {
    if (!title.trim()) {
      toast({ title: t("العنوان مطلوب", "Title is required"), variant: "destructive" });
      return;
    }
    setSaving(true);
    const finalStatus = forcedStatus || status;
    const payload: any = {
      title: title.trim(),
      slug: slug || "article-" + Date.now().toString().slice(-6),
      excerpt: excerpt || null,
      content: content || null,
      category_id: categoryId || null,
      status: finalStatus,
      featured_image: featuredImage || null,
      is_breaking: isBreaking,
      is_featured: isFeatured,
      custom_author_name: customAuthor || null,
      reading_time: readingTime,
      updated_at: new Date().toISOString(),
    };
    if (finalStatus === "published" && !article?.published_at) {
      payload.published_at = new Date().toISOString();
    }

    let error;
    if (isNew) {
      payload.author_id = user?.id;
      payload.created_at = new Date().toISOString();
      ({ error } = await supabase.from("articles").insert(payload));
    } else {
      ({ error } = await supabase.from("articles").update(payload).eq("id", article!.id));
    }

    setSaving(false);
    if (error) {
      toast({ title: t("خطأ في الحفظ", "Save error"), description: error.message, variant: "destructive" });
    } else if (!silent) {
      toast({ title: finalStatus === "published" ? t("✅ تم النشر!", "✅ Published!") : t("✅ تم الحفظ", "✅ Saved") });
      onSave();
    }
  };

  const tabs = [
    { id: "content", icon: AlignLeft, ar: "المحتوى", en: "Content" },
    { id: "settings", icon: Settings2, ar: "الإعدادات", en: "Settings" },
    { id: "seo", icon: Globe, ar: "SEO", en: "SEO" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Top Bar */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {title || t("مقال جديد", "New Article")}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{wordCount.toLocaleString()} {t("كلمة", "words")}</span>
              <span>·</span>
              <span>{readingTime} {t("دقائق قراءة", "min read")}</span>
              {saving && <><span>·</span><Loader2 className="h-2.5 w-2.5 animate-spin" /><span>{t("حفظ...","Saving...")}</span></>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status selector */}
          <Select value={status} onValueChange={(v) => setStatus(v as ArticleStatus)}>
            <SelectTrigger className="h-8 text-xs w-36 gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS[status]?.dot}`} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
                    {language === "ar" ? v.ar : v.en}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => handleSave("draft")} disabled={saving} className="h-8 text-xs gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {t("حفظ", "Save")}
          </Button>
          <Button size="sm" onClick={() => handleSave("published")} disabled={saving}
            className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90">
            <Send className="h-3.5 w-3.5" />
            {t("نشر", "Publish")}
          </Button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-border bg-card px-4 flex gap-1 shrink-0">
        {tabs.map(tab_ => (
          <button
            key={tab_.id}
            onClick={() => setTab(tab_.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === tab_.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab_.icon className="h-3.5 w-3.5" />
            {language === "ar" ? tab_.ar : tab_.en}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {tab === "content" && (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
            {/* Featured Image */}
            <div className="rounded-xl border border-dashed border-border overflow-hidden bg-muted/20">
              {featuredImage ? (
                <div className="relative group">
                  <img src={featuredImage} alt="" className="w-full h-52 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setFeaturedImage("")} className="text-xs">
                      <X className="h-3.5 w-3.5 me-1" />
                      {t("إزالة", "Remove")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <ImageUploader
                    value={featuredImage}
                    onChange={setFeaturedImage}
                    label={t("صورة المقال الرئيسية", "Featured Image")}
                  />
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("عنوان المقال...", "Article title...")}
                className="text-2xl font-black border-0 border-b border-border rounded-none px-0 h-auto py-2 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/40 focus-visible:border-primary"
                dir={language === "ar" ? "rtl" : "ltr"}
              />
            </div>

            {/* Excerpt */}
            <div>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder={t("مقدمة قصيرة للمقال (اختياري)...", "Short excerpt (optional)...")}
                rows={2}
                className="resize-none border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/40 text-sm focus-visible:border-primary"
                dir={language === "ar" ? "rtl" : "ltr"}
              />
            </div>

            {/* Rich Text Editor */}
            <div className="min-h-[400px]">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder={t("ابدأ كتابة المقال هنا...", "Start writing your article...")}
              />
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">{t("القسم", "Category")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t("اختر القسم", "Select category")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {language === "ar" ? c.name_ar : c.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">{t("اسم الكاتب (مخصص)", "Custom Author Name")}</Label>
              <Input
                value={customAuthor}
                onChange={(e) => setCustomAuthor(e.target.value)}
                placeholder={t("اتركه فارغاً لاستخدام اسمك", "Leave empty to use your name")}
              />
            </div>

            {/* Flags */}
            <div className="space-y-3">
              <Label className="text-sm font-bold">{t("خيارات النشر", "Publishing Options")}</Label>
              <div className="rounded-xl border border-border divide-y divide-border">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-red-500" />
                      {t("خبر عاجل", "Breaking News")}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("يظهر في شريط الأخبار العاجلة", "Shows in breaking news ticker")}</p>
                  </div>
                  <Switch checked={isBreaking} onCheckedChange={setIsBreaking} />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-500" />
                      {t("مقال مميز", "Featured Article")}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("يظهر في واجهة الموقع الرئيسية", "Shows on homepage hero")}</p>
                  </div>
                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                </div>
              </div>
            </div>

            {/* Reading time override */}
            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {t("وقت القراءة (دقائق)", "Reading Time (minutes)")}
              </Label>
              <Input
                type="number" min={1} max={60}
                value={readingTime}
                onChange={(e) => setReadingTime(Number(e.target.value))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">{t("محسوب تلقائياً من عدد الكلمات", "Auto-calculated from word count")}</p>
            </div>
          </div>
        )}

        {tab === "seo" && (
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("معاينة نتيجة Google", "Google Preview")}</p>
              <div className="space-y-1">
                <p className="text-blue-600 text-sm font-medium truncate">{title || t("عنوان المقال", "Article Title")}</p>
                <p className="text-green-700 text-xs">egstreet.com/article/{slug}</p>
                <p className="text-gray-600 text-xs line-clamp-2">{excerpt || t("مقدمة المقال ستظهر هنا", "Article excerpt will appear here")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">Slug (URL)</Label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 bg-muted rounded-s-md text-xs text-muted-foreground border border-e-0 border-border">/article/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  className="rounded-s-none font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">{t("المقدمة (Meta Description)", "Meta Description")}</Label>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                maxLength={160}
                placeholder={t("اكتب وصفاً مختصراً للمقال (أقل من 160 حرف)", "Write a short description (under 160 chars)")}
                className="resize-none text-sm"
              />
              <p className={`text-xs text-end ${excerpt.length > 150 ? "text-red-500" : "text-muted-foreground"}`}>
                {excerpt.length}/160
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// === ARTICLE LIST (main page) ===
const ArticleManagement = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ArticleStatus | "all">("all");
  const [editing, setEditing] = useState<Partial<Article> | null | false>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: arts }, { data: cats }] = await Promise.all([
      supabase.from("articles").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name_ar, name_en"),
    ]);
    setArticles(arts || []);
    setCategories(cats || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = articles.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("articles").delete().eq("id", deleteId);
    if (error) {
      toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("تم الحذف", "Deleted") });
      setDeleteId(null);
      fetchAll();
    }
  };

  const counts = {
    all: articles.length,
    draft: articles.filter(a => a.status === "draft").length,
    pending_review: articles.filter(a => a.status === "pending_review").length,
    published: articles.filter(a => a.status === "published").length,
    archived: articles.filter(a => a.status === "archived").length,
  };

  // Show editor
  if (editing !== false) {
    return (
      <ArticleEditor
        article={editing}
        categories={categories}
        language={language}
        onSave={() => { setEditing(false); fetchAll(); }}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-foreground">{t("إدارة المقالات", "Article Management")}</h1>
          <p className="text-xs text-muted-foreground">{articles.length} {t("مقال", "articles")}</p>
        </div>
        <Button onClick={() => setEditing({})} className="gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" />
          {t("مقال جديد", "New Article")}
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 flex-wrap">
        {(["all", "draft", "pending_review", "published", "archived"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s === "all" ? t("الكل", "All") : STATUS[s]?.[language === "ar" ? "ar" : "en"]}
            <span className="ms-1.5 opacity-70">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("ابحث في المقالات...", "Search articles...")}
          className="ps-9 h-9 text-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Articles List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t("لا توجد مقالات", "No articles found")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((art, i) => {
              const cat = categories.find(c => c.id === art.category_id);
              const st = STATUS[art.status];
              return (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                  exit={{ opacity: 0, x: -20 }}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-muted/30 transition-all duration-200"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                    {art.featured_image ? (
                      <img src={art.featured_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground leading-tight truncate flex-1">{art.title}</p>
                      <Badge className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border-0 shrink-0 ${st?.color}`}>
                        <span className={`w-1 h-1 rounded-full me-1 ${st?.dot}`} />
                        {language === "ar" ? st?.ar : st?.en}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {cat && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                          {language === "ar" ? cat.name_ar : cat.name_en}
                        </span>
                      )}
                      {art.is_breaking && <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">⚡ {t("عاجل","Breaking")}</span>}
                      {art.is_featured && <span className="text-[10px] bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">⭐ {t("مميز","Featured")}</span>}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(art.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}
                      </span>
                      {art.views > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Eye className="h-2.5 w-2.5" />{art.views.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(art)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" onClick={() => setDeleteId(art.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("تأكيد الحذف", "Confirm Delete")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع.", "Are you sure you want to delete this article? This cannot be undone.")}</p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t("إلغاء", "Cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t("حذف", "Delete")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArticleManagement;
