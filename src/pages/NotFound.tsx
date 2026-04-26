import { useLocation, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import { AlertTriangle, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={t("الصفحة غير موجودة", "Page Not Found")}
        description={t("عذراً، الصفحة التي تبحث عنها غير موجودة", "Sorry, the page you're looking for doesn't exist")}
      />
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="text-8xl font-black text-primary/20">404</div>
              <AlertTriangle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-primary" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-foreground mb-2">
            {t("الصفحة غير موجودة", "Page Not Found")}
          </h1>

          <p className="text-muted-foreground mb-6 text-lg">
            {t("عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها", "Sorry, the page you're looking for doesn't exist or has been moved")}
          </p>

          <p className="text-sm text-muted-foreground mb-8 font-mono break-all">
            {location.pathname}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button className="gap-2 w-full sm:w-auto">
                <Home className="w-4 h-4" />
                {t("العودة للرئيسية", "Back to Home")}
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Search className="w-4 h-4" />
                {t("البحث", "Search")}
              </Button>
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground mb-4">
              {t("هل تحتاج إلى مساعدة؟", "Need help?")}
            </p>
            <div className="flex gap-3 justify-center text-sm">
              <Link to="/page/contact" className="text-primary hover:underline">
                {t("اتصل بنا", "Contact Us")}
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/page/about" className="text-primary hover:underline">
                {t("من نحن", "About Us")}
              </Link>
            </div>
          </div>
        </div>
      </main>

      
    </div>
  );
};

export default NotFound;
