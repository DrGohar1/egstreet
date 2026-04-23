import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Zap, Trash2, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Article {
  id: string;
  title: string;
  slug: string;
  is_breaking: boolean | null;
  is_featured: boolean | null;
  status: string;
}

const BreakingNewsManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [breakRes, allRes] = await Promise.all([
      supabase.from("articles").select("id, title, slug, is_breaking, is_featured, status").eq("is_breaking", true).order("published_at", { ascending: false }),
      supabase.from("articles").select("id, title, slug, is_breaking, is_featured, status").eq("status", "published").eq("is_breaking", false).order("published_at", { ascending: false }).limit(20),
    ]);
    if (breakRes.data) setArticles(breakRes.data);
    if (allRes.data) setAllArticles(allRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleBreaking = async (id: string, value: boolean) => {
    await supabase.from("articles").update({ is_breaking: value }).eq("id", id);
    toast({ title: t("تم التحديث", "Updated") });
    fetchData();
  };

  const toggleFeatured = async (id: string, value: boolean) => {
    await supabase.from("articles").update({ is_featured: value }).eq("id", id);
    toast({ title: t("تم التحديث", "Updated") });
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-6 h-6 text-destructive" />
          {t("إدارة الأخبار العاجلة والمميزة", "Breaking & Featured News")}
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />{t("إضافة خبر عاجل", "Add Breaking")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("اختر مقالاً لجعله عاجلاً", "Select article to mark as breaking")}</DialogTitle>
            </DialogHeader>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {allArticles.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { toggleBreaking(a.id, true); setDialogOpen(false); }}
                  className="w-full text-start p-3 rounded-md border border-border hover:bg-muted transition-colors text-sm font-medium"
                >
                  {a.title}
                </button>
              ))}
              {allArticles.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">{t("لا توجد مقالات متاحة", "No available articles")}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("الأخبار العاجلة الحالية", "Current Breaking News")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : articles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("العنوان", "Title")}</TableHead>
                  <TableHead className="w-24 text-center">{t("عاجل", "Breaking")}</TableHead>
                  <TableHead className="w-24 text-center">{t("مميز", "Featured")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={!!a.is_breaking} onCheckedChange={(v) => toggleBreaking(a.id, v)} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={!!a.is_featured} onCheckedChange={(v) => toggleFeatured(a.id, v)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">{t("لا توجد أخبار عاجلة حالياً", "No breaking news currently")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BreakingNewsManagement;
