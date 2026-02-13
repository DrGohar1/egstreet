import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Palette, Mail, Share2, FileText, Image } from "lucide-react";
import LogoUploader from "@/components/admin/LogoUploader";

const FONT_OPTIONS = [
  { value: "'Cairo', sans-serif", label: "Cairo" },
  { value: "'Tajawal', sans-serif", label: "Tajawal" },
  { value: "'Almarai', sans-serif", label: "Almarai" },
  { value: "'Noto Kufi Arabic', sans-serif", label: "Noto Kufi Arabic" },
];

const SiteSettings = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s) => (map[s.key] = s.value));
        setSettings(map);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const u = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(settings)) {
      const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
      if (existing) {
        await supabase.from("site_settings").update({ value }).eq("key", key);
      } else {
        await supabase.from("site_settings").insert({ key, value });
      }
    }
    if (settings.font_family) {
      document.documentElement.style.setProperty("--font-family-primary", settings.font_family);
    }
    toast({ title: t("تم الحفظ", "Saved"), description: t("تم حفظ الإعدادات بنجاح", "Settings saved successfully") });
    setSaving(false);
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
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {t("إعدادات الموقع", "Site Settings")}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding & Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t("الهوية والعلامة التجارية", "Branding & Identity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">{t("اسم الموقع (عربي)", "Site Name (Arabic)")}</Label>
              <Input value={settings.site_name_ar || ""} onChange={(e) => u("site_name_ar", e.target.value)} placeholder="جريدة الشارع المصري" />
            </div>
            <div>
              <Label className="text-xs">{t("اسم الموقع (إنجليزي)", "Site Name (English)")}</Label>
              <Input value={settings.site_name_en || ""} onChange={(e) => u("site_name_en", e.target.value)} placeholder="EgStreet News" />
            </div>
            <LogoUploader
              label={t("الشعار الرئيسي", "Main Logo")}
              currentUrl={settings.logo_url || ""}
              settingKey="main-logo"
              onUploaded={(url) => u("logo_url", url)}
            />
            <LogoUploader
              label={t("أيقونة الموقع (Favicon)", "Favicon")}
              currentUrl={settings.favicon_url || ""}
              settingKey="favicon"
              onUploaded={(url) => u("favicon_url", url)}
            />
            <div>
              <Label className="text-xs">{t("وصف الموقع (SEO)", "Site Description (SEO)")}</Label>
              <Textarea value={settings.site_description || ""} onChange={(e) => u("site_description", e.target.value)} rows={2} placeholder={t("وصف مختصر للموقع...", "Brief site description...")} />
            </div>
          </CardContent>
        </Card>

        {/* Partner Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" />
              {t("لوجو الشريك / الراعي", "Partner / Sponsor Logo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LogoUploader
              label={t("لوجو الشريك", "Partner Logo")}
              currentUrl={settings.partner_logo_url || ""}
              settingKey="partner-logo"
              onUploaded={(url) => u("partner_logo_url", url)}
            />
            <div>
              <Label className="text-xs">{t("رابط الشريك", "Partner Link")}</Label>
              <Input value={settings.partner_link || ""} onChange={(e) => u("partner_link", e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs">{t("اسم الشريك", "Partner Name")}</Label>
              <Input value={settings.partner_credit || ""} onChange={(e) => u("partner_credit", e.target.value)} placeholder={t("شركة الكينج للإنتاج الفني", "King Production Company")} />
            </div>
          </CardContent>
        </Card>

        {/* Typography & Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t("الخط والألوان", "Typography & Colors")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">{t("نوع الخط", "Font Family")}</Label>
              <Select value={settings.font_family || "'Cairo', sans-serif"} onValueChange={(v) => u("font_family", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <span style={{ fontFamily: f.value }}>{f.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("اللون الأساسي (HSL)", "Primary Color (HSL)")}</Label>
              <Input value={settings.primary_color || "358 80% 48%"} onChange={(e) => u("primary_color", e.target.value)} placeholder="358 80% 48%" />
              <p className="text-[10px] text-muted-foreground mt-1">{t("صيغة HSL مثل: 358 80% 48%", "HSL format e.g.: 358 80% 48%")}</p>
            </div>
            <div>
              <Label className="text-xs">{t("لون الشريط العلوي (HSL)", "Top Bar Color (HSL)")}</Label>
              <Input value={settings.topbar_color || ""} onChange={(e) => u("topbar_color", e.target.value)} placeholder="220 25% 14%" />
            </div>
            {/* Preview */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">{t("معاينة", "Preview")}</p>
              <div className="p-3 rounded-md border border-border" style={{ fontFamily: settings.font_family || "'Cairo', sans-serif" }}>
                <span className="font-bold text-lg" style={{ color: `hsl(${settings.primary_color || "358 80% 48%"})` }}>
                  {settings.site_name_ar || t("جريدة الشارع المصري", "EgStreet News")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t("معلومات الاتصال", "Contact Info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">{t("البريد الإلكتروني", "Email")}</Label>
              <Input value={settings.contact_email || ""} onChange={(e) => u("contact_email", e.target.value)} placeholder="info@egstreet.com" />
            </div>
            <div>
              <Label className="text-xs">{t("الهاتف", "Phone")}</Label>
              <Input value={settings.contact_phone || ""} onChange={(e) => u("contact_phone", e.target.value)} placeholder="+20 xxx xxx xxxx" />
            </div>
            <div>
              <Label className="text-xs">{t("العنوان", "Address")}</Label>
              <Input value={settings.contact_address || ""} onChange={(e) => u("contact_address", e.target.value)} placeholder={t("القاهرة، مصر", "Cairo, Egypt")} />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              {t("التواصل الاجتماعي", "Social Media")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Facebook</Label>
              <Input value={settings.social_facebook || ""} onChange={(e) => u("social_facebook", e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <Label className="text-xs">Twitter / X</Label>
              <Input value={settings.social_twitter || ""} onChange={(e) => u("social_twitter", e.target.value)} placeholder="https://x.com/..." />
            </div>
            <div>
              <Label className="text-xs">YouTube</Label>
              <Input value={settings.social_youtube || ""} onChange={(e) => u("social_youtube", e.target.value)} placeholder="https://youtube.com/..." />
            </div>
            <div>
              <Label className="text-xs">Instagram</Label>
              <Input value={settings.social_instagram || ""} onChange={(e) => u("social_instagram", e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <Label className="text-xs">TikTok</Label>
              <Input value={settings.social_tiktok || ""} onChange={(e) => u("social_tiktok", e.target.value)} placeholder="https://tiktok.com/..." />
            </div>
          </CardContent>
        </Card>

        {/* Footer & Legal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("التذييل والحقوق", "Footer & Legal")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">{t("نص حقوق الملكية", "Copyright Text")}</Label>
              <Input value={settings.copyright_text || ""} onChange={(e) => u("copyright_text", e.target.value)} placeholder={t("جميع الحقوق محفوظة © 2025", "All rights reserved © 2025")} />
            </div>
            <div>
              <Label className="text-xs">{t("نص الشريك", "Partner Credit")}</Label>
              <Input value={settings.partner_credit || ""} onChange={(e) => u("partner_credit", e.target.value)} placeholder={t("بالتعاون مع شركة الكينج للانتاج الفني", "In partnership with...")} />
            </div>
            <div>
              <Label className="text-xs">{t("رسالة أسفل الموقع (HTML)", "Footer Message (HTML)")}</Label>
              <Textarea value={settings.footer_message || ""} onChange={(e) => u("footer_message", e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? t("جارِ الحفظ...", "Saving...") : t("حفظ الإعدادات", "Save Settings")}
        </Button>
      </div>
    </div>
  );
};

export default SiteSettings;
