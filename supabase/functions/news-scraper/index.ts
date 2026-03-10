import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// RSS feed sources
const RSS_SOURCES: Record<string, { name: string; url: string; lang: string }[]> = {
  world: [
    { name: "BBC Arabic", url: "https://feeds.bbci.co.uk/arabic/rss.xml", lang: "ar" },
    { name: "Al Jazeera", url: "https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4571-a604-b8e58612e693", lang: "ar" },
    { name: "Reuters", url: "https://feeds.reuters.com/reuters/topNews", lang: "en" },
    { name: "CNN", url: "http://rss.cnn.com/rss/edition.rss", lang: "en" },
  ],
  tech: [
    { name: "TechCrunch", url: "https://techcrunch.com/feed/", lang: "en" },
    { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", lang: "en" },
  ],
  sports: [
    { name: "ESPN", url: "https://www.espn.com/espn/rss/news", lang: "en" },
    { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml", lang: "en" },
  ],
  business: [
    { name: "CNBC", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", lang: "en" },
  ],
};

function parseRSSItems(xml: string, sourceName: string): any[] {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
    const itemXml = match[1];
    const getTag = (tag: string) => {
      const m = itemXml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return (m?.[1] || m?.[2] || "").trim();
    };
    
    const title = getTag("title");
    const description = getTag("description").replace(/<[^>]*>/g, "").slice(0, 500);
    const link = getTag("link");
    const pubDate = getTag("pubDate");
    
    // Try to extract image
    const imgMatch = itemXml.match(/url="([^"]*\.(jpg|jpeg|png|gif|webp)[^"]*)"/i) 
      || itemXml.match(/<media:content[^>]*url="([^"]*)"/) 
      || itemXml.match(/<enclosure[^>]*url="([^"]*)"/)
      || itemXml.match(/<img[^>]*src="([^"]*)"/);
    
    if (title) {
      items.push({
        title,
        description,
        link,
        pubDate,
        image: imgMatch?.[1] || null,
        source: sourceName,
      });
    }
  }
  
  return items;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category, customUrl } = await req.json();
    
    let sources: { name: string; url: string; lang: string }[] = [];
    
    if (customUrl) {
      sources = [{ name: "Custom", url: customUrl, lang: "unknown" }];
    } else {
      sources = RSS_SOURCES[category] || RSS_SOURCES.world;
    }

    const allItems: any[] = [];

    for (const source of sources) {
      try {
        const response = await fetch(source.url, {
          headers: { "User-Agent": "EgStreet News Bot/1.0" },
        });
        
        if (response.ok) {
          const xml = await response.text();
          const items = parseRSSItems(xml, source.name);
          allItems.push(...items.map(item => ({ ...item, sourceLang: source.lang })));
        }
      } catch (e) {
        console.error(`Error fetching ${source.name}:`, e);
      }
    }

    return new Response(JSON.stringify({ 
      items: allItems,
      categories: Object.keys(RSS_SOURCES),
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
