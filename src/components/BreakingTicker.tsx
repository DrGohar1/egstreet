import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

interface BreakingItem {
  title: string;
  slug?: string;
}

interface BreakingTickerProps {
  headlines: string[];
  slugs?: string[];
}

const BreakingTicker = ({ headlines, slugs = [] }: BreakingTickerProps) => {
  const { t, direction } = useLanguage();

  if (headlines.length === 0) return null;

  return (
    <div className="ticker-gradient overflow-hidden">
      <div className="container flex items-center h-9">
        <span className="shrink-0 bg-foreground text-background px-3 py-0.5 text-xs font-bold uppercase tracking-wider rounded-sm animate-pulse">
          {t("عاجل", "BREAKING")}
        </span>
        <div className="overflow-hidden flex-1 mx-3">
          <div className={`whitespace-nowrap ${direction === "rtl" ? "animate-ticker-rtl" : "animate-ticker"}`}>
            {headlines.map((h, i) => (
              slugs[i] ? (
                <Link key={i} to={`/article/${slugs[i]}`} className="text-ticker-foreground text-sm font-semibold mx-8 hover:underline">
                  {h}
                </Link>
              ) : (
                <span key={i} className="text-ticker-foreground text-sm font-semibold mx-8">
                  {h}
                </span>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingTicker;
