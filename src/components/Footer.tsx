import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-secondary text-secondary-foreground mt-12">
      <div className="container py-8">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">
            {t("جريدة الشارع المصري", "EgStreet News")}
          </h3>
          <p className="text-sm opacity-70">
            {t("جميع الحقوق محفوظة © 2026", "All Rights Reserved © 2026")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
