import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from("site_settings")
        .select("key, value");
      if (dbError) throw dbError;
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(s => (map[s.key] = s.value));
        setSettings(map);
      }
      setError(null);
    } catch (err: any) {
      console.error("useSiteSettings error:", err);
      setError(err.message || "خطأ في تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, []);

  return { settings, loading, error, refetch: fetch };
};
