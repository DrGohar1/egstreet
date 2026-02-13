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

const SEOHead = ({ title, description, type = "website", image, url, publishedTime, author }: SEOHeadProps) => {
  const siteName = "جريدة الشارع المصري - EgStreet News";
  const fullTitle = `${title} | ${siteName}`;

  const jsonLd = type === "article"
    ? {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: title,
        description,
        image: image || "",
        datePublished: publishedTime,
        author: { "@type": "Person", name: author || siteName },
        publisher: {
          "@type": "Organization",
          name: siteName,
          logo: { "@type": "ImageObject", url: `${window.location.origin}/favicon.ico` },
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteName,
        url: window.location.origin,
      };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      {url && <link rel="canonical" href={url} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};

export default SEOHead;
