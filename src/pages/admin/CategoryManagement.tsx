import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  sort_order: number | null;
}

const CategoryManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name_ar: "", name_en: "", slug: "" });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.name_ar || !form.name_en || !form.slug) {
      toast({ title: t("خطأ", "Error"), description: t("جميع الحقول مطلوبة", "All fields are required"), variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("categories").insert({
      name_ar: form.name_ar,
      name_en: form.name_en,
      slug: form.slug,
      sort_order: categories.length,
    });
    if (error) {
      toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("تم الإنشاء", "Created") });
      setForm({ name_ar: "", name_en: "", slug: "" });
      setDialogOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    toast({ title: t("تم الحذف", "Deleted") });
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{t("إدارة الأقسام", "Category Management")}</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />{t("قسم جديد", "New Category")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("إنشاء قسم جديد", "Create New Category")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>{t("الاسم بالعربية", "Arabic Name")}</Label>
                <Input value={form.name_ar} onChange={(e) => setForm(f => ({ ...f, name_ar: e.target.value }))} placeholder={t("سياسة", "Politics")} />
              </div>
              <div>
                <Label>{t("الاسم بالإنجليزية", "English Name")}</Label>
                <Input value={form.name_en} onChange={(e) => setForm(f => ({ ...f, name_en: e.target.value }))} placeholder="Politics" />
              </div>
              <div>
                <Label>{t("الرابط (slug)", "Slug")}</Label>
                <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="politics" dir="ltr" />
              </div>
              <Button onClick={handleCreate} className="w-full">{t("إنشاء", "Create")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("الترتيب", "Order")}</TableHead>
                  <TableHead>{t("الاسم (عربي)", "Name (AR)")}</TableHead>
                  <TableHead>{t("الاسم (إنجليزي)", "Name (EN)")}</TableHead>
                  <TableHead>{t("الرابط", "Slug")}</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat, i) => (
                  <TableRow key={cat.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{cat.name_ar}</TableCell>
                    <TableCell>{cat.name_en}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs" dir="ltr">{cat.slug}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">{t("لا توجد أقسام بعد", "No categories yet")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryManagement;
