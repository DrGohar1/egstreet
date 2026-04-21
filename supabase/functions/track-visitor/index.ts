import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { page_path } = await req.json().catch(() => ({ page_path: "/" }));

    // Get real IP from Cloudflare/Vercel headers
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    // Country from Cloudflare header (free, no API needed!)
    const country_code = req.headers.get("cf-ipcountry") || "XX";
    const city = req.headers.get("cf-ipcity") || "";

    // Parse User-Agent
    const ua = req.headers.get("user-agent") || "";
    const device_type = /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : /tablet/i.test(ua) ? "tablet" : "desktop";
    const browser = /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : /Edge/.test(ua) ? "Edge" : "Other";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Also upsert daily_views for this country
    const today = new Date().toISOString().split("T")[0];
    await Promise.all([
      supabase.from("visitor_logs").insert({ ip_address: ip, country_code, city, page_path, device_type, browser }),
      supabase.from("daily_views").upsert(
        { view_date: today, country_code, view_count: 1 },
        { onConflict: "view_date,country_code", ignoreDuplicates: false }
      ),
    ]);

    return new Response(
      JSON.stringify({ ok: true, ip, country_code }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
