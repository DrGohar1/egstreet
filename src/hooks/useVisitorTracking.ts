import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tracks page visits via Supabase Edge Function.
 * Call this hook once in App.tsx.
 */
export const useVisitorTracking = () => {
  const location = useLocation();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    // Don't track admin pages
    if (path.startsWith("/eg-control-2026")) return;

    // Fire and forget
    supabase.functions
      .invoke("track-visitor", { body: { page_path: path } })
      .catch(() => {}); // silent fail — never block UI
  }, [location.pathname]);
};
