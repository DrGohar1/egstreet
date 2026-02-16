import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: articles } = await supabase
    .from("articles")
    .select("title, slug, excerpt, published_at, featured_image")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  const siteUrl = req.headers.get("origin") || "https://egstreet.lovable.app";

  const escapeXml = (str: string) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const items = (articles || [])
    .map(
      (a: any) => `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${siteUrl}/article/${a.slug}</link>
      <description>${escapeXml(a.excerpt || a.title)}</description>
      <pubDate>${new Date(a.published_at || Date.now()).toUTCString()}</pubDate>
      <guid>${siteUrl}/article/${a.slug}</guid>
      ${a.featured_image ? `<enclosure url="${escapeXml(a.featured_image)}" type="image/jpeg" />` : ""}
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>جريدة الشارع المصري - EgStreet News</title>
    <link>${siteUrl}</link>
    <description>أخبار مصر والعالم العربي لحظة بلحظة</description>
    <language>ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${supabaseUrl}/functions/v1/rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(rss, { headers: corsHeaders });
});
