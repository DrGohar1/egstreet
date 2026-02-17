// SEO Helper Functions

export interface ArticleSchema {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: string;
  articleBody?: string;
}

export interface OrganizationSchema {
  name: string;
  logo: string;
  url: string;
  sameAs: string[];
}

/**
 * Generate JSON-LD schema for articles
 */
export const generateArticleSchema = (article: ArticleSchema) => {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "جريدة الشارع المصري",
      logo: {
        "@type": "ImageObject",
        url: "https://egstreet.news/logo.png",
      },
    },
    articleBody: article.articleBody,
  }
}

/**
 * Generate JSON-LD schema for organization
 */
export const generateOrganizationSchema = (org: OrganizationSchema) => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: org.url,
    logo: org.logo,
    sameAs: org.sameAs,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "contact@egstreet.news",
    },
  }
}

/**
 * Generate meta tags for social sharing
 */
export const generateOpenGraphTags = (
  title: string,
  description: string,
  image: string,
  url: string,
  type: "article" | "website" = "article"
) => {
  return {
    "og:title": title,
    "og:description": description,
    "og:image": image,
    "og:url": url,
    "og:type": type,
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": image,
  }
}

/**
 * Generate canonical URL
 */
export const generateCanonicalUrl = (path: string) => {
  return `https://egstreet.news${path}`
}

/**
 * Generate breadcrumb schema
 */
export const generateBreadcrumbSchema = (
  items: Array<{ name: string; url: string }>
) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Optimize image for SEO
 */
export const optimizeImageForSEO = (
  imageUrl: string,
  altText: string,
  width: number = 1200,
  height: number = 630
) => {
  return {
    url: imageUrl,
    alt: altText,
    width,
    height,
    type: "image/jpeg",
  }
}

/**
 * Generate sitemap entry
 */
export const generateSitemapEntry = (
  url: string,
  lastmod?: string,
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" = "weekly",
  priority: number = 0.5
) => {
  return {
    url,
    lastmod,
    changefreq,
    priority,
  }
}
