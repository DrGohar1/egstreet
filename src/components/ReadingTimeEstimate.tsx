import { Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReadingTimeEstimateProps {
  readingTimeMinutes?: number | null;
  wordCount?: number | null;
  className?: string;
}

const ReadingTimeEstimate = ({
  readingTimeMinutes,
  wordCount,
  className = "",
}: ReadingTimeEstimateProps) => {
  const { t } = useLanguage();

  if (!readingTimeMinutes && !wordCount) return null;

  return (
    <div className={`flex items-center gap-1 text-sm text-muted-foreground ${className}`}>
      <Clock className="w-4 h-4" />
      {readingTimeMinutes && (
        <span>
          {t("قراءة في", "Read in")} {readingTimeMinutes} {t("دقيقة", "min")}
        </span>
      )}
      {wordCount && !readingTimeMinutes && (
        <span>
          {wordCount.toLocaleString()} {t("كلمة", "words")}
        </span>
      )}
    </div>
  );
};

export default ReadingTimeEstimate;
