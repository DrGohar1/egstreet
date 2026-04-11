import { useSiteSettings } from "./useSiteSettings";

export const useFeatureFlags = () => {
  const { settings, loading } = useSiteSettings();

  const isEnabled = (feature: string): boolean => {
    const key = `feature_${feature}`;
    return settings[key] !== "false";
  };

  return {
    loading,
    isEnabled,
    aiTools: isEnabled("ai_tools"),
    newsScraper: isEnabled("news_scraper"),
    comments: isEnabled("comments"),
    newsletter: isEnabled("newsletter"),
    breakingTicker: isEnabled("breaking_ticker"),
    ads: isEnabled("ads"),
    savedArticles: isEnabled("saved_articles"),
    socialShare: isEnabled("social_share"),
    copyProtection: isEnabled("copy_protection"),
  };
};
