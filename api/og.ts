import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL  = "https://neojditfucitnovcfspw.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lb2pkaXRmdWNpdG5vdmNmc3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MzgxNDgsImV4cCI6MjA5MjExNDE0OH0.blzJAGGj0ggCNnL46ZayHx0UhjQNJkfX6PncGNXIcgU";
const SITE_URL      = "https://egstreetnews.com";
const SITE_NAME     = "الشارع المصري";
// ← ارفع اللوجو في Supabase Storage → media/og-default.jpg
// ثم استبدل الـ URL ده بـ URL اللوجو
const DEFAULT_IMAGE = `${SUPABASE_URL}/storage/v1/object/public/media/og-default.jpg`;
const DEFAULT_DESC  = "جريدة الشارع المصري — أخبار مصر والعالم العربي لحظة بلحظة";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string;
  if (!slug) {
    // Homepage OG
    return sendHTML(res, SITE_NAME, DEFAULT_DESC, DEFAULT_IMAGE, SITE_URL);
  }

  let title       = SITE_NAME;
  let description = DEFAULT_DESC;
  let image       = DEFAULT_IMAGE;
  let url         = `${SITE_URL}/article/${slug}`;

  try {
    const apiUrl = `${SUPABASE_URL}/rest/v1/articles?slug=eq.${encodeURIComponent(slug)}&select=title,excerpt,featured_image,meta_title,meta_description,article_number&limit=1`;
    const r = await fetch(apiUrl, {
      headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` }
    });
    const rows = await r.json();
    const a = rows?.[0];
    if (a) {
      title       = a.meta_title       || a.title        || title;
      description = a.meta_description || a.excerpt      || description;
      image       = a.featured_image   || DEFAULT_IMAGE;
      if (a.article_number) {
        url = `${SITE_URL}/news/${a.article_number}/${slug}`;
      }
    }
  } catch (_) {}

  return sendHTML(res, title, description, image, url);
}

function sendHTML(res: VercelResponse, title: string, description: string, image: string, url: string) {
  const esc = (s: string) => s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.setHeader("X-Robots-Tag", "noindex");
  return res.send(`<!doctype html><html dir="rtl" lang="ar"><head>
<meta charset="utf-8"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<meta property="og:title"       content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:image"       content="${esc(image)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url"         content="${esc(url)}"/>
<meta property="og:type"        content="article"/>
<meta property="og:site_name"   content="${esc(SITE_NAME)}"/>
<meta property="og:locale"      content="ar_EG"/>
<meta name="twitter:card"        content="summary_large_image"/>
<meta name="twitter:title"       content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<meta name="twitter:image"       content="${esc(image)}"/>
<meta name="twitter:site"        content="@egstreetnews"/>
<meta http-equiv="refresh" content="0;url=${esc(url)}"/>
<link rel="canonical" href="${esc(url)}"/>
</head><body><a href="${esc(url)}">${esc(title)}</a></body></html>`);
}
