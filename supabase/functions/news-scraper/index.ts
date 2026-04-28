import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Verified-working RSS sources (tested 2026-04-28) ──
const RSS_SOURCES = [
  { id:"bbc_ar",   name:"BBC عربي",       url:"https://feeds.bbci.co.uk/arabic/rss.xml",     cat:"أخبار العالم" },
  { id:"rt_ar",    name:"RT عربي",         url:"https://arabic.rt.com/rss/",                 cat:"أخبار العالم" },
  { id:"france24", name:"France24 عربي",   url:"https://www.france24.com/ar/rss",             cat:"أخبار العالم" },
  { id:"indep_ar", name:"اندبندنت عربي",   url:"https://www.independentarabia.com/rss.xml",  cat:"أخبار العالم" },
];

function getVal(xml: string, tag: string): string {
  const r = xml.match(new RegExp(`<${tag}[^>]*>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/${tag}>`, "i"));
  return r?.[1]?.trim() || "";
}
function getAttr(xml: string, tag: string, attr: string): string {
  const r = xml.match(new RegExp(`<${tag}[^>]+${attr}=["\']([^\"\' >]+)`, "i"));
  return r?.[1] || "";
}

function parseRSS(xml: string, srcName: string, catLabel: string) {
  const articles = [];
  const itemRx = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRx.exec(xml)) !== null) {
    const item = m[1];
    const title = getVal(item, "title");
    if (!title || title.length < 5) continue;
    const img = getAttr(item, "enclosure", "url") ||
                getAttr(item, "media:thumbnail", "url") ||
                getAttr(item, "media:content", "url") || "";
    articles.push({
      title,
      excerpt: getVal(item, "description").replace(/<[^>]+>/g, "").slice(0, 400),
      source: srcName,
      source_url: getVal(item, "link"),
      featured_image: img,
      catLabel,
      published_at: getVal(item, "pubDate") || new Date().toISOString(),
    });
  }
  return articles;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "sources";

  // ── GET /sources — return available sources ──
  if (req.method === "GET" && action === "sources") {
    return new Response(JSON.stringify({ sources: RSS_SOURCES }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // ── POST fetch — get articles from selected sources ──
    if (body.action === "fetch") {
      const { rss_sources = [], newsapi_key = "", gnews_key = "", topic = "egypt" } = body;
      const articles: Record<string, string>[] = [];

      // RSS (server-side, no CORS)
      for (const srcId of rss_sources) {
        const src = RSS_SOURCES.find(s => s.id === srcId);
        if (!src) continue;
        try {
          const res = await fetch(src.url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)" },
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) continue;
          const txt = await res.text();
          const items = parseRSS(txt, src.name, src.cat);
          articles.push(...items);
        } catch (e) {
          console.warn(`RSS ${srcId} failed:`, e);
        }
      }

      // NewsAPI (server-side)
      if (newsapi_key) {
        try {
          const q = encodeURIComponent(topic || "مصر");
          const res = await fetch(`https://newsapi.org/v2/everything?q=${q}&language=ar&pageSize=20&sortBy=publishedAt&apiKey=${newsapi_key}`);
          const data = await res.json();
          if (data.status === "ok") {
            for (const a of data.articles || []) {
              if (!a.title || a.title.includes("[Removed]")) continue;
              articles.push({
                title: a.title, excerpt: a.description || "",
                source: a.source?.name || "NewsAPI", source_url: a.url,
                featured_image: a.urlToImage || "",
                catLabel: "أخبار مصر", published_at: a.publishedAt,
              });
            }
          } else {
            console.warn("NewsAPI error:", data.message);
          }
        } catch (e) { console.warn("NewsAPI failed:", e); }
      }

      // GNews (server-side)
      if (gnews_key) {
        try {
          const q = encodeURIComponent(topic || "مصر");
          const res = await fetch(`https://gnews.io/api/v4/search?q=${q}&lang=ar&max=20&apikey=${gnews_key}`);
          const data = await res.json();
          for (const a of data.articles || []) {
            articles.push({
              title: a.title, excerpt: a.description || "",
              source: a.source?.name || "GNews", source_url: a.url,
              featured_image: a.image || "",
              catLabel: "أخبار مصر", published_at: a.publishedAt,
            });
          }
        } catch (e) { console.warn("GNews failed:", e); }
      }

      return new Response(JSON.stringify({ ok: true, count: articles.length, articles }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── POST import — save articles to DB ──
    if (body.action === "import") {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const { articles = [], category_map = {}, author_id = null } = body;
      let saved = 0, skipped = 0;
      for (const a of articles) {
        const catId = category_map[a.catLabel] || null;
        if (!catId) { skipped++; continue; }
        const slug = (a.title as string).slice(0, 60)
          .replace(/\s+/g, "-").replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, "")
          + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
        const { error } = await supabase.from("articles").insert({
          title: a.title, slug,
          excerpt: (a.excerpt || a.title).slice(0, 500),
          content: `<p>${(a.excerpt || a.title).replace(/\n/g, "</p><p>")}</p>`,
          featured_image: a.featured_image || null,
          category_id: catId, author_id,
          custom_author_name: a.source,
          status: "published",
          published_at: new Date(a.published_at).toISOString(),
          reading_time: Math.ceil(((a.excerpt || "").split(" ").length) / 200) || 1,
        });
        if (error?.code === "23505") skipped++;
        else if (!error) saved++;
      }
      return new Response(JSON.stringify({ ok: true, saved, skipped }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
});
