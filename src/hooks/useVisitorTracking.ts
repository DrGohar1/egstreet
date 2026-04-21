import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useVisitorTracking = () => {
  const location = useLocation();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    // Don't track admin pages
    if (path.startsWith("/admin-panel") || path.startsWith("/auth")) return;

    // Try edge function first, fallback to direct insert
    supabase.functions
      .invoke("track-visitor", { body: { page_path: path } })
      .catch(() => {
        // Fallback: direct insert (silent fail)
        supabase.from("visitor_logs" as any)
          .insert({ page_path: path, visited_at: new Date().toISOString() })
          .then(() => {}).catch(() => {});
      });
  }, [location.pathname]);
};
