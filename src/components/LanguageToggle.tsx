import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-nav-foreground hover:text-nav-accent transition-colors"
      aria-label="Toggle language"
    >
      <Globe className="w-4 h-4" />
      <span>{language === "ar" ? "EN" : "عربي"}</span>
    </button>
  );
};

export default LanguageToggle;
