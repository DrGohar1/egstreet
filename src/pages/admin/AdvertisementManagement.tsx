import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, BarChart3, Eye, Mouse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Advertisement {
  id: string;
  title_ar: string;
  title_en: string;
  image_url: string;
  link_url: string | null;
  position: string;
  placement_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  impressions: number;
  clicks: number;
  created_at: string;
}

const AdvertisementManagement = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Advertisement | null>(null);

  // Form fields
  const [formTitleAr, setFormTitleAr] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formDescAr, setFormDescAr] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formPosition, setFormPosition] = useState("sidebar");
  const [formOrder, setFormOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  const fetchAds = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("advertisements")
      .select("*")
      .order("placement_order");
    if (data) setAds(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const resetForm = () => {
    setFormTitleAr("");
    setFormTitleEn("");
    setFormDescAr("");
    setFormDescEn("");
    setFormImageUrl("");
    setFormLinkUrl("");
    setFormPosition("sidebar");
    setFormOrder(0);
    setFormActive(true);
    setFormStartDate("");
    setFormEndDate("");
    setEditing(null);
  };

  const openEdit = (ad: Advertisement) => {
    setEditing(ad);
    setFormTitleAr(ad.title_ar);
    setFormTitleEn(ad.title_en);
    setFormImageUrl(ad.image_url);
    setFormLinkUrl(ad.link_url || "");
    setFormPosition(ad.position);
    setFormOrder(ad.placement_order);
    setFormActive(ad.is_active);
    setFormStartDate(ad.start_date ? ad.start_date.split("T")[0] : "");
    setFormEndDate(ad.end_date ? ad.end_date.split("T")[0] : "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formTitleAr.trim() || !formImageUrl.trim()) return;

    const payload = {
      title_ar: formTitleAr,
      title_en: formTitleEn,
      image_url: formImageUrl,
      link_url: formLinkUrl || null,
      position: formPosition,
      placement_order: formOrder,
      is_active: formActive,
      start_date: formStartDate ? new Date(formStartDate).toISOString() : null,
      end_date: formEndDate ? new Date(formEndDate).toISOString() : null,
    };

    if (editing) {
      const { error } = await supabase
        .from("advertisements")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase.from("advertisements").insert(payload);
      if (error) {
        toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: t("تم الحفظ", "Saved") });
    setDialogOpen(false);
    resetForm();
    fetchAds();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("هل أنت متأكد؟", "Are you sure?"))) return;
    const { error } = await supabase.from("advertisements").delete().eq("id", id);
    if (error) {
      toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("تم الحذف", "Deleted") });
    fetchAds();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const positionLabels = {
    top: t("أعلى الصفحة", "Top"),
    sidebar: t("الشريط الجانبي", "Sidebar"),
    bottom: t("أسفل الصفحة", "Bottom"),
    inline: t("داخل المقالات", "Inline"),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          {t("إدارة الإعلانات", "Advertisement Management")}
        </h2>
        <Button size="sm" className="gap-1" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          {t("إعلان جديد", "New Ad")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t("إجمالي الظهورات", "Total Impressions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {ads.reduce((sum, ad) => sum + ad.impressions, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mouse className="h-4 w-4" />
              {t("إجمالي النقرات", "Total Clicks")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {ads.reduce((sum, ad) => sum + ad.clicks, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {t("نسبة النقر", "CTR")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {ads.length > 0 && ads.reduce((sum, ad) => sum + ad.impressions, 0) > 0
                ? ((ads.reduce((sum, ad) => sum + ad.clicks, 0) / ads.reduce((sum, ad) => sum + ad.impressions, 0)) * 100).toFixed(2)
                : "0"}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ads List */}
      <div className="space-y-3">
        {ads.map((ad) => (
          <div key={ad.id} className="p-4 rounded-lg border border-border bg-card flex items-start justify-between gap-4">
            <div className="flex gap-4 flex-1 min-w-0">
              {ad.image_url && (
                <img
                  src={ad.image_url}
                  alt={ad.title_ar}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">
                  {language === "ar" ? ad.title_ar : ad.title_en}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("الموضع", "Position")}: {positionLabels[ad.position as keyof typeof positionLabels]}
                </p>
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {ad.impressions.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mouse className="w-3 h-3" />
                    {ad.clicks.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={ad.is_active ? "default" : "secondary"}>
                {ad.is_active ? t("نشط", "Active") : t("معطل", "Inactive")}
              </Badge>
              <Button size="sm" variant="ghost" onClick={() => openEdit(ad)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(ad.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("تعديل الإعلان", "Edit Advertisement") : t("إعلان جديد", "New Advertisement")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder={t("العنوان بالعربية", "Arabic Title")}
                value={formTitleAr}
                onChange={(e) => setFormTitleAr(e.target.value)}
              />
              <Input
                placeholder={t("العنوان بالإنجليزية", "English Title")}
                value={formTitleEn}
                onChange={(e) => setFormTitleEn(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Textarea
                placeholder={t("الوصف بالعربية", "Arabic Description")}
                value={formDescAr}
                onChange={(e) => setFormDescAr(e.target.value)}
                rows={2}
              />
              <Textarea
                placeholder={t("الوصف بالإنجليزية", "English Description")}
                value={formDescEn}
                onChange={(e) => setFormDescEn(e.target.value)}
                rows={2}
              />
            </div>

            <Input
              placeholder={t("رابط الصورة", "Image URL")}
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
            />

            <Input
              placeholder={t("رابط الإعلان (اختياري)", "Ad Link (Optional)")}
              value={formLinkUrl}
              onChange={(e) => setFormLinkUrl(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{t("الموضع", "Position")}</label>
                <select
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                >
                  <option value="top">{t("أعلى الصفحة", "Top")}</option>
                  <option value="sidebar">{t("الشريط الجانبي", "Sidebar")}</option>
                  <option value="bottom">{t("أسفل الصفحة", "Bottom")}</option>
                  <option value="inline">{t("داخل المقالات", "Inline")}</option>
                </select>
              </div>
              <Input
                type="number"
                placeholder={t("ترتيب الظهور", "Order")}
                value={formOrder}
                onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="date"
                placeholder={t("تاريخ البداية", "Start Date")}
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
              />
              <Input
                type="date"
                placeholder={t("تاريخ النهاية", "End Date")}
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <span className="text-sm">{t("نشط", "Active")}</span>
            </div>

            <Button onClick={handleSave} className="w-full">{t("حفظ", "Save")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvertisementManagement;
