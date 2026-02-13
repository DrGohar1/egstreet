import { useLanguage } from "@/contexts/LanguageContext";

interface BreakingTickerProps {
  headlines: string[];
}

const BreakingTicker = ({ headlines }: BreakingTickerProps) => {
  const { t, direction } = useLanguage();

  if (headlines.length === 0) return null;

  return (
    <div className="ticker-gradient overflow-hidden">
      <div className="container flex items-center h-9">
        <span className="shrink-0 bg-foreground text-background px-3 py-0.5 text-xs font-bold uppercase tracking-wider rounded-sm">
          {t("عاجل", "BREAKING")}
        </span>
        <div className="overflow-hidden flex-1 mx-3">
          <div className={`whitespace-nowrap ${direction === "rtl" ? "animate-ticker-rtl" : "animate-ticker"}`}>
            {headlines.map((h, i) => (
              <span key={i} className="text-ticker-foreground text-sm font-semibold mx-8">
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingTicker;
