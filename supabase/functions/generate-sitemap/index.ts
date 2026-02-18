import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const baseUrl = 'https://egstreet.news'
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    // Add static pages
    const staticPages = ['/', '/search', '/page/about', '/page/privacy', '/page/contact']
    staticPages.forEach((page) => {
      sitemap += `  <url>\n`
      sitemap += `    <loc>${baseUrl}${page}</loc>\n`
      sitemap += `    <changefreq>weekly</changefreq>\n`
      sitemap += `    <priority>${page === '/' ? '1.0' : '0.8'}</priority>\n`
      sitemap += `  </url>\n`
    })

    // Add published articles
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, updated_at, status')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    if (articles) {
      articles.forEach((article) => {
        sitemap += `  <url>\n`
        sitemap += `    <loc>${baseUrl}/article/${article.slug}</loc>\n`
        sitemap += `    <lastmod>${article.updated_at.split('T')[0]}</lastmod>\n`
        sitemap += `    <changefreq>weekly</changefreq>\n`
        sitemap += `    <priority>0.7</priority>\n`
        sitemap += `  </url>\n`
      })
    }

    // Add categories
    const { data: categories } = await supabase
      .from('categories')
      .select('slug')

    if (categories) {
      categories.forEach((category) => {
        sitemap += `  <url>\n`
        sitemap += `    <loc>${baseUrl}/category/${category.slug}</loc>\n`
        sitemap += `    <changefreq>daily</changefreq>\n`
        sitemap += `    <priority>0.6</priority>\n`
        sitemap += `  </url>\n`
      })
    }

    // Add tags
    const { data: tags } = await supabase
      .from('tags')
      .select('slug')

    if (tags) {
      tags.forEach((tag) => {
        sitemap += `  <url>\n`
        sitemap += `    <loc>${baseUrl}/tag/${tag.slug}</loc>\n`
        sitemap += `    <changefreq>weekly</changefreq>\n`
        sitemap += `    <priority>0.5</priority>\n`
        sitemap += `  </url>\n`
      })
    }

    sitemap += '</urlset>'

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        ...corsHeaders,
      },
    })
  } catch (error: unknown) {
    console.error('Error generating sitemap:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
