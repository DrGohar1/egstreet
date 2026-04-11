import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RSS_SOURCES: Record<string, { name: string; url: string; lang: string; icon: string }[]> = {
  world: [
    { name: "BBC Arabic", url: "https://feeds.bbci.co.uk/arabic/rss.xml", lang: "ar", icon: "🇬🇧" },
    { name: "Al Jazeera", url: "https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4571-a604-b8e58612e693", lang: "ar", icon: "🇶🇦" },
    { name: "Reuters", url: "https://feeds.reuters.com/reuters/topNews", lang: "en", icon: "🌐" },
    { name: "CNN", url: "http://rss.cnn.com/rss/edition.rss", lang: "en", icon: "🇺🇸" },
    { name: "France24 Arabic", url: "https://www.france24.com/ar/rss", lang: "ar", icon: "🇫🇷" },
    { name: "Sky News Arabia", url: "https://www.skynewsarabia.com/web/rss", lang: "ar", icon: "🇦🇪" },
    { name: "RT Arabic", url: "https://arabic.rt.com/rss/", lang: "ar", icon: "🇷🇺" },
  ],
  egypt: [
    { name: "اليوم السابع", url: "https://www.youm7.com/rss/SectionRss", lang: "ar", icon: "🇪🇬" },
    { name: "المصري اليوم", url: "https://www.almasryalyoum.com/rss/rssfeeds", lang: "ar", icon: "🇪🇬" },
    { name: "أخبار مصر", url: "https://akhbarak.net/rss", lang: "ar", icon: "🇪🇬" },
  ],
  tech: [
    { name: "TechCrunch", url: "https://techcrunch.com/feed/", lang: "en", icon: "💻" },
    { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", lang: "en", icon: "📱" },
    { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", lang: "en", icon: "🔬" },
    { name: "Wired", url: "https://www.wired.com/feed/rss", lang: "en", icon: "⚡" },
  ],
  sports: [
    { name: "ESPN", url: "https://www.espn.com/espn/rss/news", lang: "en", icon: "🏈" },
    { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml", lang: "en", icon: "⚽" },
    { name: "Goal Arabic", url: "https://www.goal.com/feeds/ar/news", lang: "ar", icon: "⚽" },
  ],
  business: [
    { name: "CNBC", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", lang: "en", icon: "💰" },
    { name: "Bloomberg", url: "https://feeds.bloomberg.com/markets/news.rss", lang: "en", icon: "📊" },
    { name: "Financial Times", url: "https://www.ft.com/rss/home", lang: "en", icon: "📰" },
  ],
  science: [
    { name: "Nature", url: "https://www.nature.com/nature.rss", lang: "en", icon: "🧬" },
    { name: "Science Daily", url: "https://www.sciencedaily.com/rss/all.xml", lang: "en", icon: "🔭" },
    { name: "NASA", url: "https://www.nasa.gov/rss/dyn/breaking_news.rss", lang: "en", icon: "🚀" },
  ],
  health: [
    { name: "WHO News", url: "https://www.who.int/rss-feeds/news-english.xml", lang: "en", icon: "🏥" },
    { name: "Medical News", url: "https://www.medicalnewstoday.com/newsfeeds/rss", lang: "en", icon: "💊" },
  ],
};

function parseRSSItems(xml: string, sourceName: string, sourceIcon: string): any[] {
  const items: any[] = [];
  
  // Handle both RSS <item> and Atom <entry>
  const itemRegex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
    const itemXml = match[1] || match[2];
    const getTag = (tag: string) => {
      const m = itemXml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return (m?.[1] || m?.[2] || "").trim();
    };
    
    const title = getTag("title");
    let description = getTag("description") || getTag("summary") || getTag("content");
    description = description.replace(/<[^>]*>/g, "").slice(0, 500);
    
    let link = getTag("link");
    // Atom link format
    if (!link) {
      const linkMatch = itemXml.match(/<link[^>]*href="([^"]*)"/);
      link = linkMatch?.[1] || "";
    }
    
    const pubDate = getTag("pubDate") || getTag("published") || getTag("updated");
    
    // Try to extract image from multiple possible locations
    const imgMatch = 
      itemXml.match(/url="([^"]*\.(jpg|jpeg|png|gif|webp)[^"]*)"/i) ||
      itemXml.match(/<media:content[^>]*url="([^"]*)"/) ||
      itemXml.match(/<media:thumbnail[^>]*url="([^"]*)"/) ||
      itemXml.match(/<enclosure[^>]*url="([^"]*\.(jpg|jpeg|png|gif|webp)[^"]*)"/) ||
      itemXml.match(/<img[^>]*src="([^"]*)"/) ||
      itemXml.match(/<image><url>([^<]*)<\/url>/);
    
    if (title) {
      items.push({
        title,
        description,
        link,
        pubDate,
        image: imgMatch?.[1] || null,
        source: sourceName,
        sourceIcon,
      });
    }
  }
  
  return items;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category, customUrl } = await req.json();
    
    let sources: { name: string; url: string; lang: string; icon: string }[] = [];
    
    if (customUrl) {
      sources = [{ name: "Custom", url: customUrl, lang: "unknown", icon: "🔗" }];
    } else {
      sources = RSS_SOURCES[category] || RSS_SOURCES.world;
    }

    const allItems: any[] = [];
    const sourceStatus: { name: string; icon: string; count: number; error?: string }[] = [];

    // Fetch all sources in parallel
    const results = await Promise.allSettled(
      sources.map(async (source) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const response = await fetch(source.url, {
            headers: { "User-Agent": "EgStreet News Bot/2.0" },
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (response.ok) {
            const xml = await response.text();
            const items = parseRSSItems(xml, source.name, source.icon);
            return { source, items };
          }
          return { source, items: [], error: `HTTP ${response.status}` };
        } catch (e) {
          clearTimeout(timeout);
          return { source, items: [], error: (e as Error).message };
        }
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { source, items, error } = result.value;
        allItems.push(...items.map(item => ({ ...item, sourceLang: source.lang })));
        sourceStatus.push({ name: source.name, icon: source.icon, count: items.length, error });
      }
    }

    // Sort by date (newest first)
    allItems.sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    });

    return new Response(JSON.stringify({ 
      items: allItems,
      sources: sourceStatus,
      categories: Object.keys(RSS_SOURCES),
      totalSources: sources.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("news-scraper error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
