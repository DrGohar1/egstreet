import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";

interface TagItem {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  article_count?: number;
}

const TagManagement = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TagItem | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");

  const fetchTags = useCallback(async () => {
    setLoading(true);
    const [tagsRes, atRes] = await Promise.all([
      supabase.from("tags").select("*").order("name_ar"),
      supabase.from("article_tags").select("tag_id"),
    ]);
    if (tagsRes.data) {
      const counts: Record<string, number> = {};
      atRes.data?.forEach((at: any) => { counts[at.tag_id] = (counts[at.tag_id] || 0) + 1; });
      setTags(tagsRes.data.map((tag: any) => ({ ...tag, article_count: counts[tag.id] || 0 })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const resetForm = () => { setNameAr(""); setNameEn(""); setSlug(""); setEditing(null); };

  const openEdit = (tag: TagItem) => {
    setEditing(tag); setNameAr(tag.name_ar); setNameEn(tag.name_en); setSlug(tag.slug); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nameAr.trim() || !slug.trim()) return;
    const payload = { name_ar: nameAr, name_en: nameEn, slug };

    if (editing) {
      const { error } = await supabase.from("tags").update(payload).eq("id", editing.id);
      if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("tags").insert(payload);
      if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: t("تم الحفظ", "Saved") });
    setDialogOpen(false); resetForm(); fetchTags();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("تم الحذف", "Deleted") });
    fetchTags();
  };

  const generateSlug = (text: string) =>
    text.toLowerCase().replace(/[^\w\s\u0600-\u06FF-]/g, "").replace(/\s+/g, "-");

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Tag className="w-6 h-6 text-primary" />
          {t("إدارة الوسوم", "Tag Management")}
        </h2>
        <Button size="sm" className="gap-1" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          {t("وسم جديد", "New Tag")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card">
            <Tag className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">{language === "ar" ? tag.name_ar : tag.name_en}</span>
            <Badge variant="secondary" className="text-xs">{tag.article_count}</Badge>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEdit(tag)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDelete(tag.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {tags.length === 0 && <p className="text-muted-foreground">{t("لا توجد وسوم", "No tags yet")}</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("تعديل الوسم", "Edit Tag") : t("وسم جديد", "New Tag")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder={t("الاسم بالعربية", "Arabic Name")} value={nameAr} onChange={(e) => { setNameAr(e.target.value); if (!editing) setSlug(generateSlug(e.target.value)); }} />
            <Input placeholder={t("الاسم بالإنجليزية", "English Name")} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <Button onClick={handleSave} className="w-full">{t("حفظ", "Save")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagManagement;
