import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Module-level cache — shared across all instances
let _cache: Record<string, string> | null = null;
let _cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>(_cache || {});
  const [loading,  setLoading]  = useState(!_cache);
  const [error,    setError]    = useState<string | null>(null);
  const mounted = useRef(true);

  const fetch = async (force = false) => {
    // Return cache if fresh
    if (!force && _cache && Date.now() - _cacheTime < CACHE_TTL) {
      setSettings(_cache);
      setLoading(false);
      return;
    }
    try {
      const { data, error: dbError } = await supabase
        .from("site_settings")
        .select("key, value");
      if (dbError) throw dbError;
      if (data && mounted.current) {
        const map: Record<string, string> = {};
        data.forEach(s => (map[s.key] = s.value));
        _cache = map;
        _cacheTime = Date.now();
        setSettings(map);
        setError(null);
      }
    } catch (err: any) {
      if (mounted.current) setError(err.message || "خطأ في تحميل الإعدادات");
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    fetch();
    return () => { mounted.current = false; };
  }, []); // eslint-disable-line

  return { settings, loading, error, refetch: () => fetch(true) };
};
