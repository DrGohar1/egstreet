import { Helmet } from "react-helmet-async";

interface Props {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "article" | "website";
  publishedAt?: string;
  updatedAt?: string;
  authorName?: string;
  categoryName?: string;
  keywords?: string[];
  noIndex?: boolean;
}

const SITE_NAME = "الشارع المصري";
const SITE_URL  = import.meta.env.VITE_SITE_URL || "https://egstreetnews.com";
const DEFAULT_IMAGE = "https://neojditfucitnovcfspw.supabase.co/storage/v1/object/public/site-assets/og-default.jpg.png";

export default function SEOHead({
  title, description, image, url, type = "website",
  publishedAt, updatedAt, authorName, categoryName, keywords = [], noIndex = false,
}: Props) {
  const fullTitle   = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — أخبار مصر والعالم`;
  const desc        = description || "جريدة الشارع المصري — أخبار مصر والعالم العربي لحظة بلحظة";
  const img         = image || DEFAULT_IMAGE;
  const canonical   = url ? (url.startsWith("http") ? url : `${SITE_URL}${url}`) : SITE_URL;
  const kw          = keywords.join(", ") || "أخبار مصر, الشارع المصري, أخبار عاجلة, مصر";

  const articleSchema = type === "article" ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title || "",
    "description": desc,
    "image": [img],
    "datePublished": publishedAt || new Date().toISOString(),
    "dateModified": updatedAt || publishedAt || new Date().toISOString(),
    "author": { "@type": "Person", "name": authorName || SITE_NAME },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/pwa-192.png` }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
    "articleSection": categoryName || "أخبار",
    "inLanguage": "ar",
  }) : null;

  const websiteSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": { "@type": "EntryPoint", "urlTemplate": `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "ar",
  });

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc}/>
      <meta name="keywords" content={kw}/>
      <link rel="canonical" href={canonical}/>
      {noIndex && <meta name="robots" content="noindex,nofollow"/>}
      {!noIndex && <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/>}
      <meta name="google-site-verification" content=""/>

      {/* OpenGraph */}
      <meta property="og:type" content={type}/>
      <meta property="og:site_name" content={SITE_NAME}/>
      <meta property="og:title" content={fullTitle}/>
      <meta property="og:description" content={desc}/>
      <meta property="og:image" content={img}/>
      <meta property="og:image:width" content="1200"/>
      <meta property="og:image:height" content="630"/>
      <meta property="og:image:alt" content={title || SITE_NAME}/>
      <meta property="og:url" content={canonical}/>
      <meta property="og:locale" content="ar_EG"/>
      {publishedAt && <meta property="article:published_time" content={publishedAt}/>}
      {updatedAt   && <meta property="article:modified_time"  content={updatedAt}/>}
      {authorName  && <meta property="article:author" content={authorName}/>}
      {categoryName && <meta property="article:section" content={categoryName}/>}

      {/* Twitter/X Card */}
      <meta name="twitter:card" content="summary_large_image"/>
      <meta name="twitter:site" content="@egstreet"/>
      <meta name="twitter:title" content={fullTitle}/>
      <meta name="twitter:description" content={desc}/>
      <meta name="twitter:image" content={img}/>
      <meta name="twitter:image:alt" content={title || SITE_NAME}/>

      {/* Mobile / PWA */}
      <meta name="theme-color" content="#c41e2a"/>
      <meta name="mobile-web-app-capable" content="yes"/>
      <meta name="apple-mobile-web-app-capable" content="yes"/>
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
      <meta name="apple-mobile-web-app-title" content={SITE_NAME}/>
      <link rel="apple-touch-icon" href="/pwa-192.png"/>
      <link rel="manifest" href="/manifest.json"/>

      {/* JSON-LD Structured Data */}
      {articleSchema && <script type="application/ld+json">{articleSchema}</script>}
      <script type="application/ld+json">{websiteSchema}</script>
    </Helmet>
  );
}
