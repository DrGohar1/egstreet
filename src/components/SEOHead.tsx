import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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
const FALLBACK_IMAGE = "/pwa-192.png";

export default function SEOHead({
  title, description, image, url, type = "website",
  publishedAt, updatedAt, authorName, categoryName, keywords = [], noIndex = false,
}: Props) {
  const { settings } = useSiteSettings();

  const defaultOgImage = settings?.og_default_image || settings?.logo_url || FALLBACK_IMAGE;
  const siteDesc = settings?.site_description_ar || "جريدة الشارع المصري — أخبار مصر والعالم العربي لحظة بلحظة";
  const siteKw   = settings?.meta_keywords || "أخبار مصر, الشارع المصري, أخبار عاجلة, مصر";
  const twitterHandle = settings?.twitter_url?.split("/").pop() ? `@${settings.twitter_url?.split("/").pop()}` : "@egstreet";

  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — أخبار مصر والعالم`;
  const desc      = description || siteDesc;
  const img       = image || defaultOgImage;
  const canonical = url ? (url.startsWith("http") ? url : `${SITE_URL}${url}`) : SITE_URL;
  const kw        = keywords.length ? keywords.join(", ") : siteKw;

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
      {noIndex  && <meta name="robots" content="noindex,nofollow"/>}
      {!noIndex && <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/>}

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
      <meta name="twitter:site" content={twitterHandle}/>
      <meta name="twitter:title" content={fullTitle}/>
      <meta name="twitter:description" content={desc}/>
      <meta name="twitter:image" content={img}/>
      <meta name="twitter:image:alt" content={title || SITE_NAME}/>

      {/* Schema.org */}
      <script type="application/ld+json">{websiteSchema}</script>
      {articleSchema && <script type="application/ld+json">{articleSchema}</script>}
    </Helmet>
  );
}
