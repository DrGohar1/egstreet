import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, action, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const lang = language === "ar" ? "Arabic" : "English";
    
    const prompts: Record<string, string> = {
      rewrite: `You are a professional news editor. Rewrite the following news article in ${lang} to be completely original and unique, avoiding any copyright issues. Keep the same facts but change the structure, wording, and style completely. Make it professional and engaging for a news website. Return ONLY the rewritten article.`,
      summarize: `Summarize the following article in ${lang} in 2-3 concise paragraphs. Keep key facts and figures. Return ONLY the summary.`,
      translate_ar: `Translate the following article to Arabic. Maintain a professional news tone. Return ONLY the translation.`,
      translate_en: `Translate the following article to English. Maintain a professional news tone. Return ONLY the translation.`,
      improve: `Improve the following article in ${lang}. Fix grammar, improve clarity, and make it more engaging while keeping the same meaning. Return ONLY the improved article.`,
      generate_title: `Generate 5 compelling, SEO-optimized headline options in ${lang} for the following article. Return them as a numbered list.`,
      generate_excerpt: `Generate a compelling 1-2 sentence excerpt/summary in ${lang} for the following article that would work well as a preview. Return ONLY the excerpt.`,
      copyright_check: `Analyze the following article and provide a copyright risk assessment. Check for: 1) Potential plagiarism indicators 2) Unique vs common phrases 3) Overall originality score (1-10). Respond in ${lang}. Be specific about any concerning sections.`,
      seo_optimize: `Analyze this article and provide SEO optimization suggestions in ${lang}: 1) Suggested meta title 2) Meta description 3) Keywords 4) Suggestions for improvement.`,
    };

    const systemPrompt = prompts[action] || prompts.rewrite;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-rewrite error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
