import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X, Trash2, Eye, ArrowLeft, Pencil, Send, Search, Filter, FileText, Calendar, ImageIcon, Tag, Zap, Star, Layers } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import ArticleWorkflow from "@/components/admin/ArticleWorkflow";
import type { Database } from "@/integrations/supabase/types";
import { motion } from "framer-motion";

type ArticleStatus = Database["public"]["Enums"]["article_status"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  status: ArticleStatus; created_at: string; published_at: string | null;
  author_id: string | null; category_id: string | null; content: string | null;
  featured_image: string | null; is_breaking: boolean | null; is_featured: boolean | null;
  custom_author_name: string | null;
}

interface Category { id: string; name_ar: string; name_en: string; }
interface TagItem { id: string; name_ar: string; name_en: string; }

const STATUS_CONFIG: Record<ArticleStatus, { label_ar: string; label_en: string; color: string }> = {
  draft: { label_ar: "مسودة", label_en: "Draft", color: "bg-muted text-muted-foreground" },
  pending_review: { label_ar: "قيد المراجعة", label_en: "Pending", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  published: { label_ar: "منشور", label_en: "Published", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  archived: { label_ar: "مؤرشف", label_en: "Archived", color: "bg-muted text-muted-foreground" },
};

const STEPS = [
  { label: "المعلومات الأساسية", icon: FileText },
  { label: "المحتوى", icon: Pencil },
  { label: "الإعدادات", icon: Layers },
];

const ArticleManagement = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editorStep, setEditorStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formImage, setFormImage] = useState("");
  const [formBreaking, setFormBreaking] = useState(false);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formCustomAuthor, setFormCustomAuthor] = useState("");
  const [articleCategoriesMap, setArticleCategoriesMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [artRes, catRes, tagRes, acRes] = await Promise.all([
      supabase.from("articles").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name_ar, name_en"),
      supabase.from("tags").select("id, name_ar, name_en"),
      supabase.from("article_categories").select("article_id, category_id"),
    ]);

    if (artRes.data) setArticles(artRes.data as Article[]);
    if (catRes.data) setCategories(catRes.data);
    if (tagRes.data) setTags(tagRes.data);
    if (acRes.data) {
      const map: Record<string, string[]> = {};
      acRes.data.forEach((row) => {
        if (!map[row.article_id]) map[row.article_id] = [];
        map[row.article_id].push(row.category_id);
      });
      setArticleCategoriesMap(map);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormTitle(""); setFormContent(""); setFormExcerpt("");
    setFormCategories([]); setFormTags([]); setFormImage("");
    setFormBreaking(false); setFormFeatured(false);
    setFormCustomAuthor("");
    setEditingArticle(null); setShowPreview(false); setEditorStep(0);
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormTitle(article.title);
    setFormContent(article.content || "");
    setFormExcerpt(article.excerpt || "");
    setFormCategories(articleCategoriesMap[article.id] || (article.category_id ? [article.category_id] : []));
    setFormImage(article.featured_image || "");
    setFormBreaking(article.is_breaking || false);
    setFormFeatured(article.is_featured || false);
    setFormCustomAuthor(article.custom_author_name || "");
    setShowPreview(false);
    setEditorStep(0);
    setIsDialogOpen(true);
  };

  const handleSave = async (publish = false) => {
    if (!formTitle.trim()) {
      toast({ title: t("العنوان مطلوب", "Title is required"), variant: "destructive" });
      return;
    }

    const slug = formTitle.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").slice(0, 100) + "-" + Date.now();
    const status: ArticleStatus = publish ? "published" : "draft";
    
    const payload = {
      title: formTitle, content: formContent || null, excerpt: formExcerpt || null,
      category_id: formCategories[0] || null, featured_image: formImage || null,
      is_breaking: formBreaking, is_featured: formFeatured,
      custom_author_name: formCustomAuthor || null,
      status,
      published_at: publish ? new Date().toISOString() : (editingArticle?.published_at || null),
    };

    let articleId = editingArticle?.id;

    if (editingArticle) {
      const { error } = await supabase.from("articles").update(payload).eq("id", editingArticle.id);
      if (error) {
        toast({ title: t("خطأ في التحديث", "Update error"), description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { data, error } = await supabase.from("articles").insert({
        ...payload,
        slug,
        author_id: user?.id,
      }).select().single();
      
      if (error) {
        toast({ title: t("خطأ في الإضافة", "Insert error"), description: error.message, variant: "destructive" });
        return;
      }
      articleId = data.id;
    }

    // Update categories
    if (articleId) {
      await supabase.from("article_categories").delete().eq("article_id", articleId);
      if (formCategories.length > 0) {
        await supabase.from("article_categories").insert(
          formCategories.map(cId => ({ article_id: articleId, category_id: cId }))
        );
      }
    }

    toast({ title: publish ? t("تم النشر بنجاح", "Published successfully") : t("تم الحفظ كمسودة", "Saved as draft") });
    setIsDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("هل أنت متأكد من حذف هذا المقال؟", "Are you sure you want to delete this article?"))) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) {
      toast({ title: t("خطأ في الحذف", "Delete error"), variant: "destructive" });
    } else {
      toast({ title: t("تم الحذف بنجاح", "Deleted successfully") });
      fetchData();
    }
  };

  const getCatName = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat ? (language === "ar" ? cat.name_ar : cat.name_en) : "";
  };

  const getTagName = (id: string) => {
    const tag = tags.find(t => t.id === id);
    return tag ? (language === "ar" ? tag.name_ar : tag.name_en) : "";
  };

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {t("إدارة المقالات", "Article Management")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("أنشئ وحرر وراقب جميع مقالات الموقع", "Create, edit and monitor all site articles")}</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
          <Plus className="h-5 w-5" />
          {t("مقال جديد", "New Article")}
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("ابحث عن مقال...", "Search articles...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 rounded-xl border-border/50"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] rounded-xl border-border/50">
                  <Filter className="h-4 w-4 me-2 text-muted-foreground" />
                  <SelectValue placeholder={t("الحالة", "Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("الكل", "All")}</SelectItem>
                  <SelectItem value="published">{t("منشور", "Published")}</SelectItem>
                  <SelectItem value="draft">{t("مسودة", "Draft")}</SelectItem>
                  <SelectItem value="pending_review">{t("قيد المراجعة", "Pending")}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchData} className="rounded-xl border-border/50">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-2xl" />
          ))
        ) : filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-24 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/50">
                  {article.featured_image ? (
                    <img src={article.featured_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-2xl opacity-20">📰</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${STATUS_CONFIG[article.status].color} border-0 text-[10px] px-2 py-0`}>
                      {language === "ar" ? STATUS_CONFIG[article.status].label_ar : STATUS_CONFIG[article.status].label_en}
                    </Badge>
                    {article.is_breaking && <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0">{t("عاجل", "Breaking")}</Badge>}
                    {article.is_featured && <Badge className="bg-amber-500 text-white text-[10px] px-2 py-0">{t("مميز", "Featured")}</Badge>}
                  </div>
                  <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{article.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(article.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{articleCategoriesMap[article.id]?.map(id => getCatName(id)).join(", ") || t("بدون قسم", "No Category")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(article)} className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => window.open(`/article/${article.slug}`, "_blank")} className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)} className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("لم يتم العثور على مقالات", "No articles found")}</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-0 shadow-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              {editingArticle ? (
                <><Pencil className="h-5 w-5 text-primary" />{t("تعديل المقال", "Edit Article")}</>
              ) : (
                <><Plus className="h-5 w-5 text-primary" />{t("إنشاء مقال جديد", "Create New Article")}</>
              )}
            </DialogTitle>
          </DialogHeader>

          {showPreview ? (
            <div className="p-6 space-y-4">
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setShowPreview(false)}>
                <ArrowLeft className="h-4 w-4" />{t("العودة للتحرير", "Back to Editor")}
              </Button>
              <article className="rounded-xl border border-border bg-card p-6 space-y-4">
                {formImage && <img src={formImage} alt={formTitle} className="w-full h-56 object-cover rounded-xl" />}
                <h1 className="text-2xl font-bold text-foreground leading-tight">{formTitle || t("بدون عنوان", "Untitled")}</h1>
                <div className="flex gap-2 flex-wrap">
                  {formCategories.map((cId) => <Badge key={cId} variant="secondary" className="text-xs">{getCatName(cId)}</Badge>)}
                  {formBreaking && <Badge className="bg-primary text-primary-foreground text-xs">{t("عاجل", "Breaking")}</Badge>}
                  {formFeatured && <Badge className="bg-amber-500 text-white text-xs">{t("مميز", "Featured")}</Badge>}
                </div>
                {formExcerpt && <p className="text-sm text-muted-foreground italic border-s-2 border-primary ps-3">{formExcerpt}</p>}
                <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: formContent || t("لا يوجد محتوى", "No content yet") }} />
              </article>
              
              {editingArticle && (
                <div className="mt-6">
                  <ArticleWorkflow 
                    articleId={editingArticle.id} 
                    articleTitle={editingArticle.title} 
                    articleSlug={editingArticle.slug} 
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => handleSave(false)} variant="outline" className="flex-1">{t("حفظ كمسودة", "Save Draft")}</Button>
                <Button onClick={() => handleSave(true)} className="flex-1 gap-1"><Send className="h-4 w-4" />{t("إرسال للمراجعة", "Submit for Review")}</Button>
              </div>
            </div>
          ) : (
            <div className="px-6 pb-6 pt-4">
              <div className="flex items-center gap-2 mb-6 p-1 bg-muted/50 rounded-xl">
                {STEPS.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setEditorStep(i)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      editorStep === i
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </button>
                ))}
              </div>

              {editorStep === 0 && (
                <div className="space-y-5">
                  <ImageUploader value={formImage} onChange={setFormImage} />
                  <div>
                    <Label className="text-sm font-semibold">{t("عنوان المقال", "Article Title")} *</Label>
                    <Input
                      placeholder={t("اكتب عنوان جذاب للمقال...", "Write a catchy title...")}
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="mt-1.5 text-lg font-semibold rounded-xl h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">{t("الملخص", "Excerpt")}</Label>
                    <Textarea
                      placeholder={t("ملخص قصير يظهر في بطاقة المقال...", "Short excerpt shown on article card...")}
                      value={formExcerpt}
                      onChange={(e) => setFormExcerpt(e.target.value)}
                      className="mt-1.5 rounded-xl"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setEditorStep(1)} disabled={!formTitle.trim()} className="gap-1.5 rounded-xl">
                      {t("التالي: المحتوى", "Next: Content")}
                      <ArrowLeft className="h-4 w-4 rtl:rotate-180 ltr:rotate-180" />
                    </Button>
                  </div>
                </div>
              )}

              {editorStep === 1 && (
                <div className="space-y-4">
                  <RichTextEditor content={formContent} onChange={setFormContent} placeholder={t("اكتب محتوى المقال هنا...", "Write article content here...")} />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setEditorStep(0)} className="rounded-xl">
                      {t("السابق", "Previous")}
                    </Button>
                    <Button onClick={() => setEditorStep(2)} className="gap-1.5 rounded-xl">
                      {t("التالي: الإعدادات", "Next: Settings")}
                      <ArrowLeft className="h-4 w-4 rtl:rotate-180 ltr:rotate-180" />
                    </Button>
                  </div>
                </div>
              )}

              {editorStep === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Layers className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-semibold">{t("الأقسام", "Categories")}</Label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((c) => {
                            const selected = formCategories.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setFormCategories((prev) => selected ? prev.filter((id) => id !== c.id) : [...prev, c.id]);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  selected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                                }`}
                              >
                                {language === "ar" ? c.name_ar : c.name_en}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-semibold">{t("خيارات النشر", "Publishing Options")}</Label>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-primary" />
                              <p className="text-sm font-medium">{t("خبر عاجل", "Breaking News")}</p>
                            </div>
                            <Switch checked={formBreaking} onCheckedChange={setFormBreaking} />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-amber-500" />
                              <p className="text-sm font-medium">{t("مقال مميز", "Featured Article")}</p>
                            </div>
                            <Switch checked={formFeatured} onCheckedChange={setFormFeatured} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <Label className="text-sm font-semibold mb-1.5 block">{t("اسم الكاتب (اختياري)", "Author Name (Optional)")}</Label>
                      <Input
                        placeholder={t("اتركه فارغاً لاستخدام اسمك الحقيقي", "Leave empty to use your real name")}
                        value={formCustomAuthor}
                        onChange={(e) => setFormCustomAuthor(e.target.value)}
                        className="rounded-xl"
                      />
                    </CardContent>
                  </Card>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => setEditorStep(1)} className="rounded-xl">
                      {t("السابق", "Previous")}
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-1.5 rounded-xl">
                        <Eye className="h-4 w-4" />
                        {t("معاينة", "Preview")}
                      </Button>
                      <Button onClick={() => handleSave(false)} className="gap-1.5 rounded-xl">
                        <Check className="h-4 w-4" />
                        {t("حفظ كمسودة", "Save Draft")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArticleManagement;
