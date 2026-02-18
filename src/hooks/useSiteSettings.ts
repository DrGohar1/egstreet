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
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  return { settings, loading };
};
