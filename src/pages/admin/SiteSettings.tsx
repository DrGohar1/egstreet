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
  Layout, Bell, Code, Eye, ChevronRight, Sparkles, Check, ToggleLeft, Power, Users, Star, Upload
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
  const { t, language } = useLanguage();
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
      <motion.div variants={fadeIn} className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 lg:grid-cols-8 h-auto p-1 bg-muted/50">
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
            <TabsTrigger value="staff" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5"/>
              <span className="hidden sm:inline">الإدارة</span>
            </TabsTrigger>
            <TabsTrigger value="killswitch" className="gap-1.5 text-xs">
              <Power className="h-3.5 w-3.5" />
              {t("التحكم", "Kill Switch")}
            </TabsTrigger>
          
          <TabsTrigger value="sponsor" className="flex items-center gap-1.5 text-xs"><Star className="w-3.5 h-3.5"/>الراعي</TabsTrigger>
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
                  {/* ── Domain / Site URL ── */}
                  <div className="col-span-2 bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary"/>
                      <p className="text-sm font-bold">{t("رابط الموقع (الدومين)", "Site Domain / URL")}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">{t("رابط الموقع الكامل","Site URL")}</Label>
                      <Input
                        value={settings.site_url || ""}
                        onChange={(e) => u("site_url", e.target.value)}
                        placeholder="https://www.egstreet.com"
                        dir="ltr"
                        className="mt-1 font-mono text-sm"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {t("يُستخدم في روابط SEO والمشاركة — غيّره لما تربط دومينك الخاص","Used in SEO & share links — change when you connect your domain")}
                      </p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-700 space-y-1">
                      <p className="font-bold flex items-center gap-1"><Globe className="w-3 h-3"/>كيفية ربط الدومين على Vercel:</p>
                      <p>١. اشتري الدومين (Namecheap / GoDaddy / Egypt Domains)</p>
                      <p>٢. افتح Vercel → Project → Settings → Domains</p>
                      <p>٣. اكتب الدومين واتبع تعليمات الـ DNS</p>
                      <p>٤. غيّر الرابط هنا للدومين الجديد</p>
                    </div>
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
                  <LogoUploader
                    label={t("صورة المشاركة الافتراضية (OG Image)", "Default OG Image")}
                    currentUrl={settings.og_default_image || ""}
                    settingKey="og-default"
                    onUploaded={(url) => u("og_default_image", url)}
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
                  { key: "facebook_url", label: "Facebook", placeholder: "https://facebook.com/..." },
                  { key: "twitter_url", label: "Twitter / X", placeholder: "https://x.com/..." },
                  { key: "youtube_url", label: "YouTube", placeholder: "https://youtube.com/..." },
                  { key: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/..." },
                  { key: "tiktok_url", label: "TikTok", placeholder: "https://tiktok.com/..." },
                  { key: "telegram_url", label: "Telegram", placeholder: "https://t.me/..." },
                  { key: "whatsapp_url", label: "WhatsApp", placeholder: "https://wa.me/..." },
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
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layout className="h-4 w-4 text-primary"/>
                  إعدادات الفوتر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>نص حقوق النشر</Label>
                  <Input value={settings.footer_text_ar || ""} onChange={e => u("footer_text_ar", e.target.value)}
                    placeholder={`© ${new Date().getFullYear()} جريدة الشارع المصري — جميع الحقوق محفوظة`}/>
                </div>
                <div className="space-y-2">
                  <Label>نص النشرة البريدية (الفوتر)</Label>
                  <Input value={settings.newsletter_text || ""} onChange={e => u("newsletter_text", e.target.value)}
                    placeholder="اشترك واحصل على أحدث الأخبار مباشرة في بريدك"/>
                </div>
                <div className="space-y-2">
                  <Label>وصف الموقع (الفوتر)</Label>
                  <Textarea value={settings.site_description_ar || ""} onChange={e => u("site_description_ar", e.target.value)}
                    placeholder="أخبار مصر والعالم العربي لحظة بلحظة" rows={2}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المطوّر</Label>
                    <Input value={settings.developer_name || ""} onChange={e => u("developer_name", e.target.value)} placeholder="GoharTech"/>
                  </div>
                  <div className="space-y-2">
                    <Label>رابط المطوّر</Label>
                    <Input value={settings.developer_url || ""} onChange={e => u("developer_url", e.target.value)} placeholder="https://..." dir="ltr"/>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        {/* Kill Switch Tab */}
        <TabsContent value="killswitch">
          <motion.div variants={fadeIn}>
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Power className="h-4 w-4 text-primary" />
                  {t("التحكم في الميزات (Kill Switch)", "Feature Kill Switch")}
                </CardTitle>
                <CardDescription>{t("تشغيل أو إيقاف ميزات الموقع فوريًا", "Toggle site features on/off instantly")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "feature_ai_tools", ar: "أدوات الذكاء الاصطناعي", en: "AI Tools", desc_ar: "إعادة كتابة المقالات وفحص الحقوق", desc_en: "Article rewriting & copyright check" },
                  { key: "feature_news_scraper", ar: "سحب الأخبار", en: "News Scraper", desc_ar: "سحب الأخبار من المصادر الخارجية", desc_en: "Fetch news from external sources" },
                  { key: "feature_comments", ar: "التعليقات", en: "Comments", desc_ar: "السماح للمستخدمين بالتعليق على المقالات", desc_en: "Allow users to comment on articles" },
                  { key: "feature_newsletter", ar: "النشرة البريدية", en: "Newsletter", desc_ar: "نافذة الاشتراك في النشرة", desc_en: "Newsletter subscription popup" },
                  { key: "feature_breaking_ticker", ar: "شريط الأخبار العاجلة", en: "Breaking Ticker", desc_ar: "عرض الأخبار العاجلة في شريط متحرك", desc_en: "Display breaking news ticker" },
                  { key: "feature_ads", ar: "الإعلانات", en: "Advertisements", desc_ar: "عرض الإعلانات في الموقع", desc_en: "Show ads on the site" },
                  { key: "feature_saved_articles", ar: "حفظ المقالات", en: "Save Articles", desc_ar: "السماح للمستخدمين بحفظ المقالات", desc_en: "Allow users to save articles" },
                  { key: "feature_social_share", ar: "المشاركة الاجتماعية", en: "Social Share", desc_ar: "أزرار المشاركة على وسائل التواصل", desc_en: "Social media share buttons" },
                  { key: "feature_copy_protection", ar: "حماية النسخ", en: "Copy Protection", desc_ar: "منع نسخ المحتوى للزوار", desc_en: "Prevent content copying for guests" },
                ].map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${settings[feature.key] === "false" ? "bg-destructive/50" : "bg-emerald-500"}`} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{language === "ar" ? feature.ar : feature.en}</p>
                        <p className="text-[11px] text-muted-foreground">{language === "ar" ? feature.desc_ar : feature.desc_en}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings[feature.key] !== "false"}
                      onCheckedChange={(checked) => u(feature.key, checked ? "true" : "false")}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      
        {/* ── Staff / Newspaper Management ── */}
        <TabsContent value="staff">
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary"/>
                  الهيئة الإدارية والتحريرية
                </CardTitle>
                <CardDescription>أسماء تظهر في رأس الجريدة وفي صفحة التعريف</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رئيس مجلس الإدارة</Label>
                    <Input value={settings.board_chairman || ""} onChange={e => u("board_chairman", e.target.value)} placeholder="د/هشام القربي"/>
                  </div>
                  <div className="space-y-2">
                    <Label>رئيس التحرير</Label>
                    <Input value={settings.editor_in_chief_name || ""} onChange={e => u("editor_in_chief_name", e.target.value)} placeholder="سيد بغدادي"/>
                  </div>
                  <div className="space-y-2">
                    <Label>نائب رئيس مجلس الإدارة</Label>
                    <Input value={settings.vice_chairman || ""} onChange={e => u("vice_chairman", e.target.value)} placeholder="د/محمود توفيق عليوة"/>
                  </div>
                  <div className="space-y-2">
                    <Label>نائب رئيس التحرير</Label>
                    <Input value={settings.deputy_editor || ""} onChange={e => u("deputy_editor", e.target.value)} placeholder=""/>
                  </div>
                  <div className="space-y-2">
                    <Label>المدير العام</Label>
                    <Input value={settings.general_manager || ""} onChange={e => u("general_manager", e.target.value)} placeholder=""/>
                  </div>
                  <div className="space-y-2">
                    <Label>المدير المالي</Label>
                    <Input value={settings.financial_director || ""} onChange={e => u("financial_director", e.target.value)} placeholder=""/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>شعار الجريدة (السطر تحت الاسم)</Label>
                  <Input value={settings.newspaper_slogan || ""} onChange={e => u("newspaper_slogan", e.target.value)} placeholder="صحافة تضرم عقلك"/>
                </div>
                <div className="space-y-2">
                  <Label>عنوان مقر التحرير</Label>
                  <Input value={settings.editorial_address || ""} onChange={e => u("editorial_address", e.target.value)} placeholder="القاهرة - مصر"/>
                </div>
                <div className="space-y-2">
                  <Label>ترخيص الجريدة / رقم القيد</Label>
                  <Input value={settings.press_license || ""} onChange={e => u("press_license", e.target.value)} placeholder="رقم الترخيص"/>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>


        {/* ══════════════ TAB: الراعي ══════════════ */}
        <TabsContent value="sponsor" className="mt-0">
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-4">
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <Star className="h-5 w-5 text-amber-500"/>
                  إعدادات الراعي / الشريك
                </CardTitle>
                <CardDescription>
                  يظهر شريط الراعي في أسفل كل صفحات الموقع
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Toggle */}
                <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100">
                  <div>
                    <div className="font-bold text-sm">إظهار شريط الراعي</div>
                    <div className="text-xs text-muted-foreground">يظهر في أسفل الموقع بين الفوتر والكوبيرايت</div>
                  </div>
                  <Switch
                    checked={settings.sponsor_show !== "false"}
                    onCheckedChange={v => u("sponsor_show", String(v))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نص البداية (مثال: برعاية)</Label>
                    <Input
                      value={settings.sponsor_text || "برعاية"}
                      onChange={e => u("sponsor_text", e.target.value)}
                      placeholder="برعاية"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رابط الراعي (اختياري)</Label>
                    <Input
                      value={settings.sponsor_url || ""}
                      onChange={e => u("sponsor_url", e.target.value)}
                      placeholder="https://..."
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>اسم الراعي / الشركة</Label>
                  <Input
                    value={settings.sponsor_name || "شركة الكينج للإنتاج الفني — كابتن سعيد الدمرداش"}
                    onChange={e => u("sponsor_name", e.target.value)}
                    placeholder="شركة الكينج للإنتاج الفني — كابتن سعيد الدمرداش"
                    dir="rtl"
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>لوجو الراعي (PNG شفاف مقترح)</Label>
                  <div className="flex items-center gap-4 flex-wrap mt-2">
                    {settings.sponsor_logo ? (
                      <div className="relative group">
                        <img
                          src={settings.sponsor_logo}
                          alt="sponsor logo"
                          className="h-16 w-auto max-w-[140px] object-contain rounded-xl border border-amber-200 bg-amber-50/50 p-2 shadow-sm"
                        />
                        <button
                          onClick={() => u("sponsor_logo", "")}
                          className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >×</button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-amber-300 flex items-center justify-center text-amber-400 bg-amber-50">
                        <Image className="w-6 h-6"/>
                      </div>
                    )}
                    <label className="cursor-pointer flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50 transition-all text-sm font-bold text-amber-700">
                      <Upload className="w-4 h-4"/>
                      {settings.sponsor_logo ? "تغيير اللوجو" : "رفع لوجو الراعي"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const ext  = file.name.split(".").pop();
                          const path = `sponsor/logo_${Date.now()}.${ext}`;
                          const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
                          if (error) { toast({ title:"فشل رفع اللوجو", variant:"destructive" }); return; }
                          const { data } = supabase.storage.from("media").getPublicUrl(path);
                          u("sponsor_logo", data.publicUrl);
                          toast({ title:"✅ تم رفع لوجو الراعي" });
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    يظهر صغيراً جنب اسم الراعي في أسفل الموقع — PNG شفاف بخلفية شفافة هو الأفضل
                  </p>
                </div>

                {/* Live Preview */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">معاينة حية</Label>
                  <div className="border border-amber-200 rounded-xl p-3 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50">
                    <div className="flex items-center justify-center gap-2.5">
                      <Star className="w-4 h-4 text-amber-500"/>
                      <span className="text-sm text-amber-700 font-bold">
                        {settings.sponsor_text || "برعاية"}
                      </span>
                      {settings.sponsor_logo && (
                        <img
                          src={settings.sponsor_logo}
                          alt=""
                          className="h-7 w-auto max-w-[80px] object-contain rounded"
                        />
                      )}
                      <span className="text-sm font-black text-amber-800">
                        {settings.sponsor_name || "شركة الكينج للإنتاج الفني — كابتن سعيد الدمرداش"}
                      </span>
                      <Star className="w-4 h-4 text-amber-500"/>
                    </div>
                  </div>
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
