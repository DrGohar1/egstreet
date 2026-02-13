import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X, Edit, Trash2 } from "lucide-react";
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

  // New article form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newExcerpt, setNewExcerpt] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newImage, setNewImage] = useState("");

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
    title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim() || `article-${Date.now()}`;

  const handleCreate = async () => {
    if (!newTitle.trim() || !user) return;
    const { error } = await supabase.from("articles").insert({
      title: newTitle,
      slug: generateSlug(newTitle),
      content: newContent || null,
      excerpt: newExcerpt || null,
      category_id: newCategory || null,
      featured_image: newImage || null,
      author_id: user.id,
      status: "draft",
    });
    if (error) {
      toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("تم الإنشاء", "Created"), description: t("تم إنشاء المقال", "Article created") });
    setDialogOpen(false);
    setNewTitle(""); setNewContent(""); setNewExcerpt(""); setNewCategory(""); setNewImage("");
    fetchData();
  };

  const handleStatusChange = async (articleId: string, status: ArticleStatus) => {
    const update: Record<string, unknown> = { status };
    if (status === "published") update.published_at = new Date().toISOString();
    const { error } = await supabase.from("articles").update(update).eq("id", articleId);
    if (error) {
      toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("تم التحديث", "Updated") });
    fetchData();
  };

  const handleDelete = async (articleId: string) => {
    const { error } = await supabase.from("articles").delete().eq("id", articleId);
    if (error) {
      toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
      return;
    }
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              {t("مقال جديد", "New Article")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("إنشاء مقال جديد", "Create New Article")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder={t("العنوان", "Title")} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <textarea
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={t("المحتوى", "Content")}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
              <Input placeholder={t("الملخص", "Excerpt")} value={newExcerpt} onChange={(e) => setNewExcerpt(e.target.value)} />
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger><SelectValue placeholder={t("القسم", "Category")} /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {language === "ar" ? c.name_ar : c.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder={t("رابط الصورة الرئيسية", "Featured Image URL")} value={newImage} onChange={(e) => setNewImage(e.target.value)} />
              <Button onClick={handleCreate} className="w-full">{t("إنشاء", "Create")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="my">{t("مقالاتي", "My Articles")} ({myArticles.length})</TabsTrigger>
          {isEditor && (
            <TabsTrigger value="review">{t("المراجعة التحريرية", "Editorial Review")} ({pendingArticles.length})</TabsTrigger>
          )}
          {isEditor && (
            <TabsTrigger value="all">{t("جميع المقالات", "All Articles")} ({articles.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my">
          <ArticleList
            articles={myArticles}
            getCatName={getCatName}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            isEditor={isEditor}
            language={language}
            t={t}
          />
        </TabsContent>

        {isEditor && (
          <TabsContent value="review">
            <ArticleList
              articles={pendingArticles}
              getCatName={getCatName}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              isEditor={isEditor}
              language={language}
              t={t}
              showActions
            />
          </TabsContent>
        )}

        {isEditor && (
          <TabsContent value="all">
            <ArticleList
              articles={articles}
              getCatName={getCatName}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              isEditor={isEditor}
              language={language}
              t={t}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

function ArticleList({
  articles,
  getCatName,
  onStatusChange,
  onDelete,
  isEditor,
  language,
  t,
  showActions,
}: {
  articles: Article[];
  getCatName: (id: string | null) => string;
  onStatusChange: (id: string, status: ArticleStatus) => void;
  onDelete: (id: string) => void;
  isEditor: boolean;
  language: string;
  t: (ar: string, en: string) => string;
  showActions?: boolean;
}) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("لا توجد مقالات", "No articles found")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => {
        const statusCfg = STATUS_CONFIG[article.status];
        return (
          <Card key={article.id} className="news-card-hover">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm truncate">{article.title}</h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={`${statusCfg.color} text-[10px] border-0`}>
                    {language === "ar" ? statusCfg.label_ar : statusCfg.label_en}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{getCatName(article.category_id)}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(article.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
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
                    {t("إرسال للمراجعة", "Submit")}
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
