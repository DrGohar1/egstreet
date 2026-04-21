import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  type?: "website" | "article";
  image?: string;
  url?: string;
  publishedTime?: string;
  author?: string;
}

const DEFAULT_OG_IMAGE = "/og-image.png";

const SEOHead = ({ title, description, type = "website", image, url, publishedTime, author }: SEOHeadProps) => {
  const siteName = "جريدة الشارع المصري - EgStreet News";
  const fullTitle = `${title} | ${siteName}`;
  const ogImage = image || DEFAULT_OG_IMAGE;

  const jsonLd = type === "article"
    ? {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: title,
        description,
        image: ogImage,
        datePublished: publishedTime,
        author: { "@type": "Person", name: author || siteName },
        publisher: {
          "@type": "Organization",
          name: siteName,
          logo: { "@type": "ImageObject", url: `${typeof window !== "undefined" ? window.location.origin : ""}/pwa-192.png` },
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteName,
        url: typeof window !== "undefined" ? window.location.origin : "",
      };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      {url && <meta property="og:url" content={url} />}
      {url && <link rel="canonical" href={url} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};

export default SEOHead;
