import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, action, language } = await req.json();

    // Support both key names for flexibility
    const OPENAI_KEY =
      Deno.env.get("OPENAI_API_KEY") ||
      Deno.env.get("LOVABLE_API_KEY") ||
      Deno.env.get("AI_API_KEY");

    if (!OPENAI_KEY) {
      // Fallback: return mock result so UI doesn't break even without key
      const mockResults: Record<string, string> = {
        rewrite: `[تجريبي] ${content.slice(0, 200)}...`,
        summarize: `ملخص: ${content.slice(0, 150)}...`,
        translate_ar: `ترجمة: ${content.slice(0, 200)}...`,
        translate_en: `Translation: ${content.slice(0, 200)}...`,
        improve: content.slice(0, 300),
        generate_title: "1. عنوان مقترح أول\n2. عنوان مقترح ثاني\n3. عنوان مقترح ثالث",
        generate_excerpt: content.slice(0, 150) + "...",
        seo_optimize: "Meta title: " + content.slice(0, 60),
      };
      return new Response(
        JSON.stringify({ result: mockResults[action] || content, mock: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lang = language === "ar" ? "Arabic" : "English";

    const prompts: Record<string, string> = {
      rewrite: `أنت محرر أخبار محترف. أعد كتابة المقال التالي باللغة ${lang === "Arabic" ? "العربية" : "الإنجليزية"} بشكل أصلي تماماً. حافظ على نفس الحقائق لكن غيّر الأسلوب والصياغة كلياً. اجعله احترافياً وجذاباً. أعد النص المكتوب فقط بدون أي شرح.`,
      summarize: `لخّص المقال التالي باللغة ${lang === "Arabic" ? "العربية" : "الإنجليزية"} في فقرتين أو ثلاثة. ركّز على الحقائق الرئيسية. أعد الملخص فقط.`,
      translate_ar: `ترجم المقال التالي إلى اللغة العربية. حافظ على الأسلوب الإخباري الاحترافي. أعد الترجمة فقط.`,
      translate_en: `Translate the following article to English. Maintain professional news style. Return only the translation.`,
      improve: `حسّن المقال التالي باللغة ${lang === "Arabic" ? "العربية" : "الإنجليزية"}. صحّح الأخطاء النحوية وحسّن الوضوح والأسلوب. أعد المقال المحسّن فقط.`,
      generate_title: `اقترح 5 عناوين إخبارية جذابة وSEO-friendly باللغة ${lang === "Arabic" ? "العربية" : "الإنجليزية"} للمقال التالي. أعدها كقائمة مرقّمة.`,
      generate_excerpt: `اكتب مقدمة قصيرة (جملة أو جملتين) باللغة ${lang === "Arabic" ? "العربية" : "الإنجليزية"} تصلح كمعاينة للمقال التالي. أعد المقدمة فقط.`,
      seo_optimize: `حلّل المقال التالي وقدّم اقتراحات SEO باللغة ${lang === "Arabic" ? "العربية" : "الإنجليزية"}: 1) عنوان meta مقترح 2) وصف meta 3) الكلمات المفتاحية 4) اقتراحات التحسين.`,
      copyright_check: `قيّم المقال التالي لاكتشاف مخاطر حقوق النشر. اذكر: 1) مؤشرات الانتحال 2) الجمل الغير أصيلة 3) تقييم الأصالة من 1-10. أجب باللغة ${lang === "Arabic" ? "العربية" : "الإنجليزية"}.`,
    };

    const systemPrompt = prompts[action] || prompts.rewrite;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${response.status} — ${err.slice(0, 200)}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ result, tokens: data.usage?.total_tokens }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-rewrite error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
