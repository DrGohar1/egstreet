import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s) => (map[s.key] = s.value));
        setSettings(map);
        applySettings(map);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  return { settings, loading };
};

function applySettings(settings: Record<string, string>) {
  const root = document.documentElement;

  // Apply primary color — only if it's HSL format (e.g. "3 95% 42%")
  if (settings.primary_color && !settings.primary_color.startsWith("#")) {
    root.style.setProperty("--primary", settings.primary_color);
  }

  // Apply font family
  if (settings.font_family && settings.font_family !== "Cairo") {
    root.style.setProperty("--font-family-primary", settings.font_family);
  }
}
