import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(true);

  const fetch = async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(s => (map[s.key] = s.value));
      setSettings(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    // Realtime — logo/settings update instantly on all pages
    const interval = setInterval(fetch, 60_000);
return () => clearInterval(interval);
  }, []);

  return { settings, loading, refetch: fetch };
};
