import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const FONT_OPTIONS = [
  { value: "'Cairo', sans-serif", label: "Cairo" },
  { value: "'Tajawal', sans-serif", label: "Tajawal" },
  { value: "'Almarai', sans-serif", label: "Almarai" },
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

  const updateSetting = (key: string, value: string) => {
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

    // Apply font change immediately
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
        {/* Contact & Social */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("معلومات الاتصال", "Contact Info")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">{t("البريد الإلكتروني", "Email")}</Label>
              <Input
                value={settings.contact_email || ""}
                onChange={(e) => updateSetting("contact_email", e.target.value)}
                placeholder="info@egstreet.com"
              />
            </div>
            <div>
              <Label className="text-xs">{t("الهاتف", "Phone")}</Label>
              <Input
                value={settings.contact_phone || ""}
                onChange={(e) => updateSetting("contact_phone", e.target.value)}
                placeholder="+20 xxx xxx xxxx"
              />
            </div>
            <div>
              <Label className="text-xs">Facebook</Label>
              <Input
                value={settings.social_facebook || ""}
                onChange={(e) => updateSetting("social_facebook", e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <Label className="text-xs">Twitter / X</Label>
              <Input
                value={settings.social_twitter || ""}
                onChange={(e) => updateSetting("social_twitter", e.target.value)}
                placeholder="https://x.com/..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Typography & Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("الخط والهوية البصرية", "Typography & Branding")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">{t("نوع الخط", "Font Family")}</Label>
              <Select
                value={settings.font_family || "'Cairo', sans-serif"}
                onValueChange={(v) => updateSetting("font_family", v)}
              >
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
              <Input
                value={settings.primary_color || "358 80% 48%"}
                onChange={(e) => updateSetting("primary_color", e.target.value)}
                placeholder="358 80% 48%"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {t("صيغة HSL مثل: 358 80% 48%", "HSL format e.g.: 358 80% 48%")}
              </p>
            </div>
            <div>
              <Label className="text-xs">{t("رابط الشعار", "Logo URL")}</Label>
              <Input
                value={settings.logo_url || ""}
                onChange={(e) => updateSetting("logo_url", e.target.value)}
                placeholder="https://..."
              />
            </div>
            {/* Preview */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">{t("معاينة", "Preview")}</p>
              <div
                className="p-3 rounded-md border border-border"
                style={{ fontFamily: settings.font_family || "'Cairo', sans-serif" }}
              >
                <span className="font-bold text-lg" style={{ color: `hsl(${settings.primary_color || "358 80% 48%"})` }}>
                  {t("جريدة الشارع المصري", "EgStreet News")}
                </span>
              </div>
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
