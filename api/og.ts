import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL  = "https://neojditfucitnovcfspw.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lb2pkaXRmdWNpdG5vdmNmc3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MzgxNDgsImV4cCI6MjA5MjExNDE0OH0.blzJAGGj0ggCNnL46ZayHx0UhjQNJkfX6PncGNXIcgU";
const SITE_URL      = "https://egstreetnews.com";
const SITE_NAME     = "الشارع المصري";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string;
  if (!slug) return res.status(400).send("missing slug");

  let title       = SITE_NAME;
  let description = "جريدة الشارع المصري — أخبار مصر والعالم العربي";
  let image       = `${SITE_URL}/pwa-512.png`;
  let url         = `${SITE_URL}/article/${slug}`;

  try {
    const apiUrl = `${SUPABASE_URL}/rest/v1/articles?slug=eq.${encodeURIComponent(slug)}&select=title,excerpt,featured_image,meta_title,meta_description&limit=1`;
    const r = await fetch(apiUrl, {
      headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` }
    });
    const rows = await r.json();
    const a = rows?.[0];
    if (a) {
      title       = a.meta_title       || a.title        || title;
      description = a.meta_description || a.excerpt      || description;
      image       = a.featured_image                     || image;
    }
  } catch (_) {}

  const esc = (s: string) => s.replace(/"/g, "&quot;").replace(/</g, "&lt;");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return res.send(`<!doctype html><html dir="rtl" lang="ar"><head>
<meta charset="utf-8"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<meta property="og:title"       content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:image"       content="${esc(image)}"/>
<meta property="og:url"         content="${esc(url)}"/>
<meta property="og:type"        content="article"/>
<meta property="og:site_name"   content="${esc(SITE_NAME)}"/>
<meta name="twitter:card"        content="summary_large_image"/>
<meta name="twitter:title"       content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<meta name="twitter:image"       content="${esc(image)}"/>
<meta http-equiv="refresh" content="0;url=${esc(url)}"/>
<link rel="canonical" href="${esc(url)}"/>
</head><body><a href="${esc(url)}">${esc(title)}</a></body></html>`);
}
