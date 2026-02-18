import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { imageUrl, width, height, quality } = await req.json()

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageUrl is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }

    // Build optimized URL for Supabase Storage
    let optimizedUrl = imageUrl

    if (imageUrl.includes("supabase")) {
      const params = new URLSearchParams()
      if (width) params.append("width", width.toString())
      if (height) params.append("height", height.toString())
      if (quality) params.append("quality", quality.toString())

      optimizedUrl = `${imageUrl}?${params.toString()}`
    }

    return new Response(
      JSON.stringify({
        success: true,
        originalUrl: imageUrl,
        optimizedUrl,
        metadata: {
          width,
          height,
          quality: quality || 75,
        },
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  } catch (error: unknown) {
    console.error("Error optimizing image:", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }
})
