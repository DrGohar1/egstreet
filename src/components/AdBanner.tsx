import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

interface Advertisement {
  id: string;
  title_ar: string;
  title_en: string;
  image_url: string;
  link_url: string | null;
}

interface AdBannerProps {
  position: "top" | "sidebar" | "bottom" | "inline";
  limit?: number;
}

const AdBanner = ({ position, limit = 1 }: AdBannerProps) => {
  const { t, language } = useLanguage();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAds = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("advertisements")
        .select("id, title_ar, title_en, image_url, link_url")
        .eq("position", position)
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order("placement_order")
        .limit(limit);

      if (data) {
        setAds(data);
        // Track impressions
        data.forEach((ad) => {
          trackImpression(ad.id);
        });
      }
    };

    fetchAds();
  }, [position, limit]);

  const trackImpression = async (adId: string) => {
    await supabase.from("ad_analytics").insert({
      ad_id: adId,
      event_type: "impression",
      user_ip: null,
      user_agent: navigator.userAgent,
    });

    // Update impressions count
    await supabase.rpc("increment_ad_impressions", { ad_id: adId });
  };

  const handleClick = async (adId: string, linkUrl: string | null) => {
    await supabase.from("ad_analytics").insert({
      ad_id: adId,
      event_type: "click",
      user_ip: null,
      user_agent: navigator.userAgent,
    });

    // Update clicks count
    await supabase.rpc("increment_ad_clicks", { ad_id: adId });

    if (linkUrl) {
      window.open(linkUrl, "_blank");
    }
  };

  const visibleAds = ads.filter((ad) => !dismissed.has(ad.id));

  if (visibleAds.length === 0) return null;

  if (position === "top" || position === "bottom") {
    return (
      <div className="space-y-3 my-4">
        {visibleAds.map((ad) => (
          <div key={ad.id} className="relative group rounded-lg overflow-hidden">
            <button
              onClick={() => handleClick(ad.id, ad.link_url)}
              className="w-full block relative"
            >
              <img
                src={ad.image_url}
                alt={language === "ar" ? ad.title_ar : ad.title_en}
                className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
              />
            </button>
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, ad.id]))}
              className="absolute top-2 end-2 p-1 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (position === "sidebar") {
    return (
      <div className="space-y-3">
        {visibleAds.map((ad) => (
          <div key={ad.id} className="relative group rounded-lg overflow-hidden bg-muted">
            <button
              onClick={() => handleClick(ad.id, ad.link_url)}
              className="w-full block relative"
            >
              <img
                src={ad.image_url}
                alt={language === "ar" ? ad.title_ar : ad.title_en}
                className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
              />
            </button>
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, ad.id]))}
              className="absolute top-1 end-1 p-0.5 bg-black/50 hover:bg-black/70 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (position === "inline") {
    return (
      <div className="my-6 space-y-3">
        {visibleAds.map((ad) => (
          <div key={ad.id} className="relative group rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => handleClick(ad.id, ad.link_url)}
              className="w-full block relative"
            >
              <img
                src={ad.image_url}
                alt={language === "ar" ? ad.title_ar : ad.title_en}
                className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
              />
            </button>
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, ad.id]))}
              className="absolute top-2 end-2 p-1 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="text-xs text-muted-foreground p-2 text-center">
              {t("إعلان", "Advertisement")}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default AdBanner;
