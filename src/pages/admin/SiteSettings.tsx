import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Save, Globe, Palette, Mail, Share2, FileText, Image, Shield,
  Layout, Bell, Code, Eye, ChevronRight, Sparkles, Check
} from "lucide-react";
import LogoUploader from "@/components/admin/LogoUploader";
import { motion } from "framer-motion";

const FONT_OPTIONS = [
  { value: "'Cairo', sans-serif", label: "Cairo" },
  { value: "'Tajawal', sans-serif", label: "Tajawal" },
  { value: "'Almarai', sans-serif", label: "Almarai" },
  { value: "'Noto Kufi Arabic', sans-serif", label: "Noto Kufi Arabic" },
];

const COLOR_PRESETS = [
  { label: "أحمر كلاسيكي", value: "358 80% 48%", preview: "hsl(358 80% 48%)" },
  { label: "أزرق ملكي", value: "220 80% 50%", preview: "hsl(220 80% 50%)" },
  { label: "أخضر زمردي", value: "160 84% 39%", preview: "hsl(160 84% 39%)" },
  { label: "بنفسجي", value: "270 76% 52%", preview: "hsl(270 76% 52%)" },
  { label: "ذهبي", value: "45 93% 47%", preview: "hsl(45 93% 47%)" },
  { label: "برتقالي", value: "24 95% 53%", preview: "hsl(24 95% 53%)" },
];

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const SiteSettings = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const u = (key: string, value: string) => {
    setSaved(false);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

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
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {t("إعدادات الموقع", "Site Settings")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("تخصيص وإدارة جميع إعدادات الموقع من مكان واحد", "Customize and manage all site settings from one place")}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px]">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? t("جارِ الحفظ...", "Saving...") : saved ? t("تم الحفظ!", "Saved!") : t("حفظ الإعدادات", "Save Settings")}
        </Button>
      </motion.div>

      <Tabs defaultValue="branding" className="space-y-6">
        <motion.div variants={fadeIn}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 h-auto p-1 bg-muted/50">
            <TabsTrigger value="branding" className="gap-1.5 text-xs">
              <Globe className="h-3.5 w-3.5" />
              {t("الهوية", "Branding")}
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 text-xs">
              <Palette className="h-3.5 w-3.5" />
              {t("المظهر", "Appearance")}
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-1.5 text-xs">
              <Mail className="h-3.5 w-3.5" />
              {t("الاتصال", "Contact")}
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5" />
              {t("اجتماعي", "Social")}
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5 text-xs">
              <Code className="h-3.5 w-3.5" />
              {t("SEO", "SEO")}
            </TabsTrigger>
            <TabsTrigger value="footer" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              {t("التذييل", "Footer")}
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={fadeIn}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    {t("اسم الموقع", "Site Name")}
                  </CardTitle>
                  <CardDescription>{t("اسم الموقع بالعربية والإنجليزية", "Site name in Arabic and English")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium">{t("اسم الموقع (عربي)", "Site Name (Arabic)")}</Label>
                    <Input value={settings.site_name_ar || ""} onChange={(e) => u("site_name_ar", e.target.value)} placeholder="جريدة الشارع المصري" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">{t("اسم الموقع (إنجليزي)", "Site Name (English)")}</Label>
                    <Input value={settings.site_name_en || ""} onChange={(e) => u("site_name_en", e.target.value)} placeholder="EgStreet News" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">{t("وصف الموقع (SEO)", "Site Description (SEO)")}</Label>
                    <Textarea value={settings.site_description || ""} onChange={(e) => u("site_description", e.target.value)} rows={3} placeholder={t("وصف مختصر للموقع...", "Brief site description...")} className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Image className="h-4 w-4 text-primary" />
                    {t("الشعارات", "Logos")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Image className="h-4 w-4 text-primary" />
                    {t("لوجو الشريك", "Partner Logo")}
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
                    <Label className="text-xs font-medium">{t("رابط الشريك", "Partner Link")}</Label>
                    <Input value={settings.partner_link || ""} onChange={(e) => u("partner_link", e.target.value)} placeholder="https://..." className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">{t("اسم الشريك", "Partner Name")}</Label>
                    <Input value={settings.partner_credit || ""} onChange={(e) => u("partner_credit", e.target.value)} placeholder={t("شركة الكينج للإنتاج الفني", "King Production Company")} className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={fadeIn}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    {t("الخطوط", "Typography")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium">{t("نوع الخط", "Font Family")}</Label>
                    <Select value={settings.font_family || "'Cairo', sans-serif"} onValueChange={(v) => u("font_family", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            <span style={{ fontFamily: f.value }}>{f.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Font preview */}
                  <div className="p-4 rounded-lg border border-border bg-muted/30" style={{ fontFamily: settings.font_family || "'Cairo', sans-serif" }}>
                    <p className="text-lg font-bold text-foreground">{t("معاينة نوع الخط", "Font Preview")}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t("هذا نص تجريبي لمعاينة شكل الخط المختار", "This is a sample text to preview the selected font")}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    {t("الألوان", "Colors")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium mb-2 block">{t("اللون الأساسي", "Primary Color")}</Label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => u("primary_color", preset.value)}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-xs ${
                            settings.primary_color === preset.value
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full shrink-0 ring-1 ring-border" style={{ background: preset.preview }} />
                          <span className="truncate">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                    <div>
                      <Label className="text-xs font-medium">{t("قيمة مخصصة (HSL)", "Custom (HSL)")}</Label>
                      <Input value={settings.primary_color || "358 80% 48%"} onChange={(e) => u("primary_color", e.target.value)} placeholder="358 80% 48%" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">{t("لون الشريط العلوي (HSL)", "Top Bar Color (HSL)")}</Label>
                    <Input value={settings.topbar_color || ""} onChange={(e) => u("topbar_color", e.target.value)} placeholder="220 25% 14%" className="mt-1" />
                  </div>
                  {/* Live preview */}
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">{t("معاينة مباشرة", "Live Preview")}</p>
                    <div className="p-4 rounded-lg border border-border overflow-hidden" style={{ fontFamily: settings.font_family || "'Cairo', sans-serif" }}>
                      <div className="h-2 rounded-t mb-3" style={{ background: `hsl(${settings.primary_color || "358 80% 48%"})` }} />
                      <span className="font-bold text-lg" style={{ color: `hsl(${settings.primary_color || "358 80% 48%"})` }}>
                        {settings.site_name_ar || t("جريدة الشارع المصري", "EgStreet News")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{t("نص تجريبي للمعاينة", "Sample preview text")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <motion.div variants={fadeIn}>
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  {t("معلومات الاتصال", "Contact Info")}
                </CardTitle>
                <CardDescription>{t("معلومات الاتصال المعروضة في الموقع", "Contact info displayed on the site")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-medium">{t("البريد الإلكتروني", "Email")}</Label>
                  <Input value={settings.contact_email || ""} onChange={(e) => u("contact_email", e.target.value)} placeholder="info@egstreet.com" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">{t("الهاتف", "Phone")}</Label>
                  <Input value={settings.contact_phone || ""} onChange={(e) => u("contact_phone", e.target.value)} placeholder="+20 xxx xxx xxxx" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">{t("العنوان", "Address")}</Label>
                  <Input value={settings.contact_address || ""} onChange={(e) => u("contact_address", e.target.value)} placeholder={t("القاهرة، مصر", "Cairo, Egypt")} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">{t("ساعات العمل", "Working Hours")}</Label>
                  <Input value={settings.working_hours || ""} onChange={(e) => u("working_hours", e.target.value)} placeholder={t("24/7", "24/7")} className="mt-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social">
          <motion.div variants={fadeIn}>
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary" />
                  {t("حسابات التواصل الاجتماعي", "Social Media Accounts")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "social_facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
                  { key: "social_twitter", label: "Twitter / X", placeholder: "https://x.com/..." },
                  { key: "social_youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
                  { key: "social_instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
                  { key: "social_tiktok", label: "TikTok", placeholder: "https://tiktok.com/..." },
                  { key: "social_telegram", label: "Telegram", placeholder: "https://t.me/..." },
                  { key: "social_whatsapp", label: "WhatsApp", placeholder: "https://wa.me/..." },
                ].map((social) => (
                  <div key={social.key}>
                    <Label className="text-xs font-medium">{social.label}</Label>
                    <Input value={settings[social.key] || ""} onChange={(e) => u(social.key, e.target.value)} placeholder={social.placeholder} className="mt-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo">
          <motion.div variants={fadeIn}>
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="h-4 w-4 text-primary" />
                  {t("إعدادات SEO", "SEO Settings")}
                </CardTitle>
                <CardDescription>{t("تحسين محركات البحث والأكواد المخصصة", "Search engine optimization & custom codes")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-medium">{t("الكلمات المفتاحية", "Meta Keywords")}</Label>
                  <Input value={settings.meta_keywords || ""} onChange={(e) => u("meta_keywords", e.target.value)} placeholder={t("أخبار, مصر, عاجل", "news, egypt, breaking")} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">{t("كود Google Analytics", "Google Analytics ID")}</Label>
                  <Input value={settings.ga_id || ""} onChange={(e) => u("ga_id", e.target.value)} placeholder="G-XXXXXXXXXX" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">{t("كود Head مخصص", "Custom Head Code")}</Label>
                  <Textarea value={settings.custom_head_code || ""} onChange={(e) => u("custom_head_code", e.target.value)} rows={4} placeholder="<script>...</script>" className="mt-1 font-mono text-xs" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer">
          <motion.div variants={fadeIn}>
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {t("التذييل والحقوق", "Footer & Legal")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-medium">{t("نص حقوق الملكية", "Copyright Text")}</Label>
                  <Input value={settings.copyright_text || ""} onChange={(e) => u("copyright_text", e.target.value)} placeholder={t("جميع الحقوق محفوظة © 2026", "All rights reserved © 2026")} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">{t("نص الشريك", "Partner Credit")}</Label>
                  <Input value={settings.partner_credit || ""} onChange={(e) => u("partner_credit", e.target.value)} placeholder={t("بالتعاون مع شركة الكينج للانتاج الفني", "In partnership with...")} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">{t("رسالة أسفل الموقع (HTML)", "Footer Message (HTML)")}</Label>
                  <Textarea value={settings.footer_message || ""} onChange={(e) => u("footer_message", e.target.value)} rows={3} className="mt-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SiteSettings;
