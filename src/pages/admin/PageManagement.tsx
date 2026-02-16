import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, FileText } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface Page {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  content_ar: string | null;
  content_en: string | null;
  is_published: boolean;
  sort_order: number;
}

const PageManagement = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);

  const [formSlug, setFormSlug] = useState("");
  const [formTitleAr, setFormTitleAr] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formContentAr, setFormContentAr] = useState("");
  const [formContentEn, setFormContentEn] = useState("");
  const [formPublished, setFormPublished] = useState(true);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("pages").select("*").order("sort_order");
    if (data) setPages(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const resetForm = () => {
    setFormSlug(""); setFormTitleAr(""); setFormTitleEn("");
    setFormContentAr(""); setFormContentEn(""); setFormPublished(true);
    setEditing(null);
  };

  const openEdit = (page: Page) => {
    setEditing(page);
    setFormSlug(page.slug);
    setFormTitleAr(page.title_ar);
    setFormTitleEn(page.title_en);
    setFormContentAr(page.content_ar || "");
    setFormContentEn(page.content_en || "");
    setFormPublished(page.is_published);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formSlug.trim() || !formTitleAr.trim()) return;
    const payload = {
      slug: formSlug,
      title_ar: formTitleAr,
      title_en: formTitleEn,
      content_ar: formContentAr || null,
      content_en: formContentEn || null,
      is_published: formPublished,
    };

    if (editing) {
      const { error } = await supabase.from("pages").update(payload).eq("id", editing.id);
      if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("pages").insert(payload);
      if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: t("تم الحفظ", "Saved") });
    setDialogOpen(false);
    resetForm();
    fetchPages();
  };

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
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          {t("إدارة الصفحات", "Page Management")}
        </h2>
        <Button size="sm" className="gap-1" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          {t("صفحة جديدة", "New Page")}
        </Button>
      </div>

      <div className="space-y-3">
        {pages.map((page) => (
          <div key={page.id} className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{language === "ar" ? page.title_ar : page.title_en}</h3>
              <p className="text-xs text-muted-foreground">/{page.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={page.is_published ? "default" : "secondary"}>
                {page.is_published ? t("منشورة", "Published") : t("مخفية", "Hidden")}
              </Badge>
              <Button size="sm" variant="ghost" onClick={() => openEdit(page)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("تعديل الصفحة", "Edit Page") : t("إنشاء صفحة", "Create Page")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder={t("الرابط (slug)", "Slug")} value={formSlug} onChange={(e) => setFormSlug(e.target.value)} />
              <div className="flex items-center gap-2">
                <Switch checked={formPublished} onCheckedChange={setFormPublished} />
                <span className="text-sm">{t("منشورة", "Published")}</span>
              </div>
            </div>
            <Input placeholder={t("العنوان بالعربية", "Arabic Title")} value={formTitleAr} onChange={(e) => setFormTitleAr(e.target.value)} />
            <Input placeholder={t("العنوان بالإنجليزية", "English Title")} value={formTitleEn} onChange={(e) => setFormTitleEn(e.target.value)} />
            <div>
              <label className="text-sm font-medium mb-1 block">{t("المحتوى بالعربية", "Arabic Content")}</label>
              <RichTextEditor content={formContentAr} onChange={setFormContentAr} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t("المحتوى بالإنجليزية", "English Content")}</label>
              <RichTextEditor content={formContentEn} onChange={setFormContentEn} />
            </div>
            <Button onClick={handleSave} className="w-full">{t("حفظ", "Save")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PageManagement;
