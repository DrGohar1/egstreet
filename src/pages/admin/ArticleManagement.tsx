import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X, Trash2, Eye, ArrowLeft, Pencil, Send, Search, Filter, FileText, Calendar } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import type { Database } from "@/integrations/supabase/types";
import { motion } from "framer-motion";

type ArticleStatus = Database["public"]["Enums"]["article_status"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  status: ArticleStatus; created_at: string; published_at: string | null;
  author_id: string | null; category_id: string | null; content: string | null;
  featured_image: string | null; is_breaking: boolean | null; is_featured: boolean | null;
}

interface Category { id: string; name_ar: string; name_en: string; }

const STATUS_CONFIG: Record<ArticleStatus, { label_ar: string; label_en: string; color: string }> = {
  draft: { label_ar: "مسودة", label_en: "Draft", color: "bg-muted text-muted-foreground" },
  pending_review: { label_ar: "قيد المراجعة", label_en: "Pending", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  published: { label_ar: "منشور", label_en: "Published", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  archived: { label_ar: "مؤرشف", label_en: "Archived", color: "bg-muted text-muted-foreground" },
};

const ArticleManagement = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [formImage, setFormImage] = useState("");
  const [formBreaking, setFormBreaking] = useState(false);
  const [formFeatured, setFormFeatured] = useState(false);
  const [articleCategoriesMap, setArticleCategoriesMap] = useState<Record<string, string[]>>({});

  const resetForm = () => {
    setFormTitle(""); setFormContent(""); setFormExcerpt("");
    setFormCategories([]); setFormImage("");
    setFormBreaking(false); setFormFeatured(false);
    setEditingArticle(null); setShowPreview(false);
  };

  const openCreateDialog = () => { resetForm(); setDialogOpen(true); };

  const openEditDialog = (article: Article) => {
    setEditingArticle(article);
    setFormTitle(article.title);
    setFormContent(article.content || "");
    setFormExcerpt(article.excerpt || "");
    setFormCategories(articleCategoriesMap[article.id] || (article.category_id ? [article.category_id] : []));
    setFormImage(article.featured_image || "");
    setFormBreaking(article.is_breaking || false);
    setFormFeatured(article.is_featured || false);
    setShowPreview(false);
    setDialogOpen(true);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [artRes, catRes, acRes] = await Promise.all([
      supabase.from("articles").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name_ar, name_en"),
      supabase.from("article_categories").select("article_id, category_id"),
    ]);
    if (artRes.data) setArticles(artRes.data);
    if (catRes.data) setCategories(catRes.data);
    if (acRes.data) {
      const map: Record<string, string[]> = {};
      acRes.data.forEach((ac: { article_id: string; category_id: string }) => {
        if (!map[ac.article_id]) map[ac.article_id] = [];
        map[ac.article_id].push(ac.category_id);
      });
      setArticleCategoriesMap(map);
    }
    if (user) {
      for (const role of ["super_admin", "editor_in_chief", "journalist"] as AppRole[]) {
        const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: role });
        if (data) { setUserRole(role); break; }
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isEditor = userRole === "super_admin" || userRole === "editor_in_chief";

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^\w\s\u0600-\u06FF-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim() || `article-${Date.now()}`;

  const handleSave = async (submitForReview = false) => {
    if (!formTitle.trim() || !user) return;
    const payload = {
      title: formTitle, content: formContent || null, excerpt: formExcerpt || null,
      category_id: formCategories[0] || null, featured_image: formImage || null,
      is_breaking: formBreaking, is_featured: formFeatured,
    };
    let articleId = editingArticle?.id;
    if (editingArticle) {
      const update: Record<string, unknown> = { ...payload };
      if (submitForReview) update.status = "pending_review";
      const { error } = await supabase.from("articles").update(update).eq("id", editingArticle.id);
      if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    } else {
      const { data, error } = await supabase.from("articles").insert({
        ...payload, slug: generateSlug(formTitle), author_id: user.id,
        status: submitForReview ? "pending_review" : "draft",
      }).select("id").single();
      if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
      articleId = data.id;
    }
    if (articleId) {
      await supabase.from("article_categories").delete().eq("article_id", articleId);
      if (formCategories.length > 0) {
        await supabase.from("article_categories").insert(
          formCategories.map((catId) => ({ article_id: articleId!, category_id: catId }))
        );
      }
    }
    toast({ title: editingArticle ? t("تم الحفظ", "Saved") : t("تم الإنشاء", "Created") });
    setDialogOpen(false); resetForm(); fetchData();
  };

  const handleStatusChange = async (articleId: string, status: ArticleStatus) => {
    const update: Record<string, unknown> = { status };
    if (status === "published") update.published_at = new Date().toISOString();
    const { error } = await supabase.from("articles").update(update).eq("id", articleId);
    if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("تم التحديث", "Updated") }); fetchData();
  };

  const handleDelete = async (articleId: string) => {
    const { error } = await supabase.from("articles").delete().eq("id", articleId);
    if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("تم الحذف", "Deleted") }); fetchData();
  };

  const getCatName = (id: string | null) => {
    if (!id) return "—";
    const c = categories.find((c) => c.id === id);
    return c ? (language === "ar" ? c.name_ar : c.name_en) : "—";
  };

  const filterArticles = (list: Article[]) => {
    let filtered = list;
    if (searchQuery) {
      filtered = filtered.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }
    return filtered;
  };

  const myArticles = articles.filter((a) => a.author_id === user?.id);
  const pendingArticles = articles.filter((a) => a.status === "pending_review");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl bg-gradient-to-l from-secondary to-secondary/80 p-6 text-secondary-foreground">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-black">{t("إدارة المقالات", "Article Management")}</h1>
              <p className="text-sm opacity-80">{t("إنشاء وتعديل ومراجعة المحتوى", "Create, edit & review content")}</p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            {t("مقال جديد", "New Article")}
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("البحث بعنوان المقال...", "Search by article title...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 h-10 rounded-xl"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
                <Filter className="h-4 w-4 me-2 text-muted-foreground" />
                <SelectValue placeholder={t("حالة المقال", "Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("عرض الكل", "Show All")}</SelectItem>
                <SelectItem value="draft">{t("مسودة", "Draft")}</SelectItem>
                <SelectItem value="pending_review">{t("قيد المراجعة", "Pending")}</SelectItem>
                <SelectItem value="published">{t("منشور", "Published")}</SelectItem>
                <SelectItem value="archived">{t("مؤرشف", "Archived")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 rounded-xl">
              <FileText className="h-4 w-4" />
              <span className="font-bold text-foreground">{articles.length}</span>
              <span>{t("مقالة", "articles")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Article Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showPreview ? t("معاينة المقال", "Article Preview")
                : editingArticle ? t("تعديل المقال", "Edit Article")
                : t("إنشاء مقال جديد", "Create New Article")}
            </DialogTitle>
          </DialogHeader>

          {showPreview ? (
            <div className="space-y-4 pt-2">
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
              <div className="flex gap-2">
                <Button onClick={() => handleSave(false)} variant="outline" className="flex-1">{t("حفظ كمسودة", "Save Draft")}</Button>
                <Button onClick={() => handleSave(true)} className="flex-1 gap-1"><Send className="h-4 w-4" />{t("إرسال للمراجعة", "Submit for Review")}</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <Input placeholder={t("عنوان المقال", "Article Title")} value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="text-lg font-semibold rounded-xl" />
              <Input placeholder={t("الملخص", "Excerpt")} value={formExcerpt} onChange={(e) => setFormExcerpt(e.target.value)} className="rounded-xl" />
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t("الأقسام", "Categories")}</label>
                  <div className="flex flex-wrap gap-2 p-3 border border-border rounded-xl bg-background">
                    {categories.map((c) => (
                      <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox checked={formCategories.includes(c.id)} onCheckedChange={(checked) => {
                          setFormCategories((prev) => checked ? [...prev, c.id] : prev.filter((id) => id !== c.id));
                        }} />
                        {language === "ar" ? c.name_ar : c.name_en}
                      </label>
                    ))}
                  </div>
                </div>
                <Input placeholder={t("رابط الصورة الرئيسية", "Featured Image URL")} value={formImage} onChange={(e) => setFormImage(e.target.value)} className="rounded-xl" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={formBreaking} onCheckedChange={(v) => setFormBreaking(!!v)} />{t("خبر عاجل", "Breaking News")}</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={formFeatured} onCheckedChange={(v) => setFormFeatured(!!v)} />{t("مقال مميز", "Featured")}</label>
              </div>
              <RichTextEditor content={formContent} onChange={setFormContent} placeholder={t("اكتب محتوى المقال هنا...", "Write article content here...")} />
              <div className="flex gap-2">
                <Button variant="outline" className="gap-1 rounded-xl" onClick={() => setShowPreview(true)} disabled={!formTitle.trim()}>
                  <Eye className="h-4 w-4" />{t("معاينة", "Preview")}
                </Button>
                <Button onClick={() => handleSave(false)} variant="secondary" className="flex-1 rounded-xl">{t("حفظ كمسودة", "Save Draft")}</Button>
                <Button onClick={() => handleSave(true)} className="flex-1 gap-1 rounded-xl"><Send className="h-4 w-4" />{t("إرسال للمراجعة", "Submit")}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Articles Table */}
      <Tabs defaultValue="my" className="w-full">
        <TabsList className="mb-4 rounded-xl">
          <TabsTrigger value="my" className="rounded-xl">{t("مقالاتي", "My Articles")} ({myArticles.length})</TabsTrigger>
          {isEditor && <TabsTrigger value="review" className="rounded-xl">{t("المراجعة", "Review")} ({pendingArticles.length})</TabsTrigger>}
          {isEditor && <TabsTrigger value="all" className="rounded-xl">{t("الكل", "All")} ({articles.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="my">
          <ArticleTable articles={filterArticles(myArticles)} getCatName={getCatName} articleCategoriesMap={articleCategoriesMap} onStatusChange={handleStatusChange} onDelete={handleDelete} onEdit={openEditDialog} isEditor={isEditor} language={language} t={t} />
        </TabsContent>
        {isEditor && (
          <TabsContent value="review">
            <ArticleTable articles={filterArticles(pendingArticles)} getCatName={getCatName} articleCategoriesMap={articleCategoriesMap} onStatusChange={handleStatusChange} onDelete={handleDelete} onEdit={openEditDialog} isEditor={isEditor} language={language} t={t} showActions />
          </TabsContent>
        )}
        {isEditor && (
          <TabsContent value="all">
            <ArticleTable articles={filterArticles(articles)} getCatName={getCatName} articleCategoriesMap={articleCategoriesMap} onStatusChange={handleStatusChange} onDelete={handleDelete} onEdit={openEditDialog} isEditor={isEditor} language={language} t={t} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

/* Professional Table Component */
function ArticleTable({
  articles, getCatName, articleCategoriesMap, onStatusChange, onDelete, onEdit, isEditor, language, t, showActions,
}: {
  articles: Article[]; getCatName: (id: string | null) => string; articleCategoriesMap: Record<string, string[]>;
  onStatusChange: (id: string, status: ArticleStatus) => void; onDelete: (id: string) => void;
  onEdit: (article: Article) => void; isEditor: boolean; language: string;
  t: (ar: string, en: string) => string; showActions?: boolean;
}) {
  if (articles.length === 0) {
    return (
      <Card><CardContent className="text-center py-16 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-semibold">{t("لا توجد مقالات", "No articles found")}</p>
        <p className="text-sm mt-1">{t("ابدأ بإنشاء مقال جديد", "Start by creating a new article")}</p>
      </CardContent></Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 bg-secondary text-secondary-foreground text-xs font-bold">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-4">{t("العنوان", "Title")}</div>
        <div className="col-span-2">{t("القسم", "Category")}</div>
        <div className="col-span-2">{t("التاريخ", "Date")}</div>
        <div className="col-span-1 text-center">{t("الحالة", "Status")}</div>
        <div className="col-span-2 text-center">{t("إجراءات", "Actions")}</div>
      </div>
      <div className="divide-y divide-border">
        {articles.map((article, idx) => {
          const statusCfg = STATUS_CONFIG[article.status];
          const cats = articleCategoriesMap[article.id] || (article.category_id ? [article.category_id] : []);
          return (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/30 transition-colors group"
            >
              {/* # */}
              <div className="hidden md:block col-span-1 text-center text-sm font-bold text-muted-foreground">{idx + 1}</div>

              {/* Title */}
              <div className="col-span-4 cursor-pointer" onClick={() => onEdit(article)}>
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{article.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {article.is_breaking && <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 border-0">{t("عاجل", "Breaking")}</Badge>}
                  {article.is_featured && <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 border-0">{t("مميز", "Featured")}</Badge>}
                </div>
              </div>

              {/* Category */}
              <div className="hidden md:block col-span-2">
                {cats.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {cats.slice(0, 2).map((cId) => (
                      <span key={cId} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{getCatName(cId)}</span>
                    ))}
                    {cats.length > 2 && <span className="text-xs text-muted-foreground">+{cats.length - 2}</span>}
                  </div>
                ) : <span className="text-xs text-muted-foreground">—</span>}
              </div>

              {/* Date */}
              <div className="hidden md:flex col-span-2 items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(article.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
              </div>

              {/* Status */}
              <div className="col-span-1 flex justify-center">
                <Badge className={`${statusCfg.color} text-[10px] border-0 rounded-lg px-2`}>
                  {language === "ar" ? statusCfg.label_ar : statusCfg.label_en}
                </Badge>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-center gap-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => onEdit(article)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {showActions && article.status === "pending_review" && isEditor && (
                  <>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" onClick={() => onStatusChange(article.id, "published")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => onStatusChange(article.id, "draft")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {article.status === "draft" && (
                  <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => onStatusChange(article.id, "pending_review")}>
                    {t("إرسال", "Submit")}
                  </Button>
                )}
                {isEditor && (
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => onDelete(article.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

export default ArticleManagement;
