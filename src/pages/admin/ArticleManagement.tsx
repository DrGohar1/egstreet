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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X, Trash2, Eye, ArrowLeft, Pencil, Send } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import type { Database } from "@/integrations/supabase/types";

type ArticleStatus = Database["public"]["Enums"]["article_status"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: ArticleStatus;
  created_at: string;
  published_at: string | null;
  author_id: string | null;
  category_id: string | null;
  content: string | null;
  featured_image: string | null;
  is_breaking: boolean | null;
  is_featured: boolean | null;
}

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
}

const STATUS_CONFIG: Record<ArticleStatus, { label_ar: string; label_en: string; color: string }> = {
  draft: { label_ar: "مسودة", label_en: "Draft", color: "bg-muted text-muted-foreground" },
  pending_review: { label_ar: "قيد المراجعة", label_en: "Pending Review", color: "bg-yellow-100 text-yellow-800" },
  published: { label_ar: "منشور", label_en: "Published", color: "bg-emerald-100 text-emerald-800" },
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

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formBreaking, setFormBreaking] = useState(false);
  const [formFeatured, setFormFeatured] = useState(false);

  const resetForm = () => {
    setFormTitle(""); setFormContent(""); setFormExcerpt("");
    setFormCategory(""); setFormImage("");
    setFormBreaking(false); setFormFeatured(false);
    setEditingArticle(null); setShowPreview(false);
  };

  const openCreateDialog = () => { resetForm(); setDialogOpen(true); };

  const openEditDialog = (article: Article) => {
    setEditingArticle(article);
    setFormTitle(article.title);
    setFormContent(article.content || "");
    setFormExcerpt(article.excerpt || "");
    setFormCategory(article.category_id || "");
    setFormImage(article.featured_image || "");
    setFormBreaking(article.is_breaking || false);
    setFormFeatured(article.is_featured || false);
    setShowPreview(false);
    setDialogOpen(true);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [artRes, catRes] = await Promise.all([
      supabase.from("articles").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name_ar, name_en"),
    ]);
    if (artRes.data) setArticles(artRes.data);
    if (catRes.data) setCategories(catRes.data);

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
      title: formTitle,
      content: formContent || null,
      excerpt: formExcerpt || null,
      category_id: formCategory || null,
      featured_image: formImage || null,
      is_breaking: formBreaking,
      is_featured: formFeatured,
    };

    if (editingArticle) {
      const update: Record<string, unknown> = { ...payload };
      if (submitForReview) update.status = "pending_review";
      const { error } = await supabase.from("articles").update(update).eq("id", editingArticle.id);
      if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
      toast({ title: t("تم الحفظ", "Saved") });
    } else {
      const { error } = await supabase.from("articles").insert({
        ...payload,
        slug: generateSlug(formTitle),
        author_id: user.id,
        status: submitForReview ? "pending_review" : "draft",
      });
      if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
      toast({ title: t("تم الإنشاء", "Created") });
    }
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleStatusChange = async (articleId: string, status: ArticleStatus) => {
    const update: Record<string, unknown> = { status };
    if (status === "published") update.published_at = new Date().toISOString();
    const { error } = await supabase.from("articles").update(update).eq("id", articleId);
    if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("تم التحديث", "Updated") });
    fetchData();
  };

  const handleDelete = async (articleId: string) => {
    const { error } = await supabase.from("articles").delete().eq("id", articleId);
    if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("تم الحذف", "Deleted") });
    fetchData();
  };

  const getCatName = (id: string | null) => {
    if (!id) return "—";
    const c = categories.find((c) => c.id === id);
    return c ? (language === "ar" ? c.name_ar : c.name_en) : "—";
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {t("إدارة المحتوى", "Content Management")}
        </h2>
        <Button size="sm" className="gap-1" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {t("مقال جديد", "New Article")}
        </Button>
      </div>

      {/* Article Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showPreview
                ? t("معاينة المقال", "Article Preview")
                : editingArticle
                  ? t("تعديل المقال", "Edit Article")
                  : t("إنشاء مقال جديد", "Create New Article")}
            </DialogTitle>
          </DialogHeader>

          {showPreview ? (
            <div className="space-y-4 pt-2">
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setShowPreview(false)}>
                <ArrowLeft className="h-4 w-4" />
                {t("العودة للتحرير", "Back to Editor")}
              </Button>
              <article className="rounded-lg border border-border bg-card p-6 space-y-4">
                {formImage && (
                  <img src={formImage} alt={formTitle} className="w-full h-56 object-cover rounded-md" />
                )}
                <h1 className="text-2xl font-bold text-foreground leading-tight">
                  {formTitle || t("بدون عنوان", "Untitled")}
                </h1>
                <div className="flex gap-2 flex-wrap">
                  {formCategory && <Badge variant="secondary" className="text-xs">{getCatName(formCategory)}</Badge>}
                  {formBreaking && <Badge className="bg-primary text-primary-foreground text-xs">{t("عاجل", "Breaking")}</Badge>}
                  {formFeatured && <Badge className="bg-amber-500 text-white text-xs">{t("مميز", "Featured")}</Badge>}
                </div>
                {formExcerpt && (
                  <p className="text-sm text-muted-foreground italic border-s-2 border-primary ps-3">{formExcerpt}</p>
                )}
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: formContent || t("لا يوجد محتوى", "No content yet") }}
                />
                <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                  {new Date().toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </article>
              <div className="flex gap-2">
                <Button onClick={() => handleSave(false)} variant="outline" className="flex-1">
                  {t("حفظ كمسودة", "Save Draft")}
                </Button>
                <Button onClick={() => handleSave(true)} className="flex-1 gap-1">
                  <Send className="h-4 w-4" />
                  {t("إرسال للمراجعة", "Submit for Review")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <Input
                placeholder={t("عنوان المقال", "Article Title")}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-lg font-semibold"
              />
              <Input
                placeholder={t("الملخص (يظهر أسفل العنوان)", "Excerpt (shown below title)")}
                value={formExcerpt}
                onChange={(e) => setFormExcerpt(e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder={t("القسم", "Category")} /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {language === "ar" ? c.name_ar : c.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder={t("رابط الصورة الرئيسية", "Featured Image URL")}
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={formBreaking} onCheckedChange={(v) => setFormBreaking(!!v)} />
                  {t("خبر عاجل", "Breaking News")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={formFeatured} onCheckedChange={(v) => setFormFeatured(!!v)} />
                  {t("مقال مميز", "Featured")}
                </label>
              </div>

              <RichTextEditor
                content={formContent}
                onChange={setFormContent}
                placeholder={t("اكتب محتوى المقال هنا...", "Write article content here...")}
              />

              <div className="flex gap-2">
                <Button variant="outline" className="gap-1" onClick={() => setShowPreview(true)} disabled={!formTitle.trim()}>
                  <Eye className="h-4 w-4" />
                  {t("معاينة", "Preview")}
                </Button>
                <Button onClick={() => handleSave(false)} variant="secondary" className="flex-1">
                  {t("حفظ كمسودة", "Save Draft")}
                </Button>
                <Button onClick={() => handleSave(true)} className="flex-1 gap-1">
                  <Send className="h-4 w-4" />
                  {t("إرسال للمراجعة", "Submit for Review")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="my" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="my">{t("مقالاتي", "My Articles")} ({myArticles.length})</TabsTrigger>
          {isEditor && <TabsTrigger value="review">{t("المراجعة", "Review")} ({pendingArticles.length})</TabsTrigger>}
          {isEditor && <TabsTrigger value="all">{t("الكل", "All")} ({articles.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="my">
          <ArticleList articles={myArticles} getCatName={getCatName} onStatusChange={handleStatusChange} onDelete={handleDelete} onEdit={openEditDialog} isEditor={isEditor} language={language} t={t} />
        </TabsContent>
        {isEditor && (
          <TabsContent value="review">
            <ArticleList articles={pendingArticles} getCatName={getCatName} onStatusChange={handleStatusChange} onDelete={handleDelete} onEdit={openEditDialog} isEditor={isEditor} language={language} t={t} showActions />
          </TabsContent>
        )}
        {isEditor && (
          <TabsContent value="all">
            <ArticleList articles={articles} getCatName={getCatName} onStatusChange={handleStatusChange} onDelete={handleDelete} onEdit={openEditDialog} isEditor={isEditor} language={language} t={t} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

function ArticleList({
  articles, getCatName, onStatusChange, onDelete, onEdit, isEditor, language, t, showActions,
}: {
  articles: Article[];
  getCatName: (id: string | null) => string;
  onStatusChange: (id: string, status: ArticleStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (article: Article) => void;
  isEditor: boolean;
  language: string;
  t: (ar: string, en: string) => string;
  showActions?: boolean;
}) {
  if (articles.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{t("لا توجد مقالات", "No articles found")}</div>;
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => {
        const statusCfg = STATUS_CONFIG[article.status];
        return (
          <Card key={article.id} className="news-card-hover">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(article)}>
                <h4 className="font-semibold text-foreground text-sm truncate">{article.title}</h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={`${statusCfg.color} text-[10px] border-0`}>
                    {language === "ar" ? statusCfg.label_ar : statusCfg.label_en}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{getCatName(article.category_id)}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(article.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                  </span>
                  {article.is_breaking && <Badge className="bg-primary text-primary-foreground text-[10px] border-0">{t("عاجل", "Breaking")}</Badge>}
                  {article.is_featured && <Badge className="bg-amber-500 text-white text-[10px] border-0">{t("مميز", "Featured")}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(article)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {showActions && article.status === "pending_review" && isEditor && (
                  <>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600" onClick={() => onStatusChange(article.id, "published")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => onStatusChange(article.id, "draft")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {article.status === "draft" && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange(article.id, "pending_review")}>
                    {t("إرسال", "Submit")}
                  </Button>
                )}
                {isEditor && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => onDelete(article.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default ArticleManagement;
