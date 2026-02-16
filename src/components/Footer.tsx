import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Mail, Rss } from "lucide-react";
import NewsletterFooter from "./NewsletterFooter";

const Footer = () => {
  const { t } = useLanguage();
  const rssUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rss`;

  return (
    <footer className="bg-secondary text-secondary-foreground mt-12">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-black mb-2">{t("جريدة الشارع المصري", "EgStreet News")}</h3>
            <p className="text-sm opacity-70 leading-relaxed">
              {t("أخبار مصر والعالم العربي لحظة بلحظة", "Egypt & Arab world news, moment by moment")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-3 text-sm uppercase tracking-wider opacity-80">{t("روابط سريعة", "Quick Links")}</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link to="/" className="hover:text-primary transition-colors">{t("الرئيسية", "Home")}</Link></li>
              <li><Link to="/page/about" className="hover:text-primary transition-colors">{t("من نحن", "About Us")}</Link></li>
              <li><Link to="/page/privacy" className="hover:text-primary transition-colors">{t("سياسة الخصوصية", "Privacy Policy")}</Link></li>
              <li><Link to="/page/contact" className="hover:text-primary transition-colors">{t("اتصل بنا", "Contact Us")}</Link></li>
              <li><Link to="/search" className="hover:text-primary transition-colors">{t("بحث", "Search")}</Link></li>
              <li>
                <a href={rssUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
                  <Rss className="w-3 h-3" /> RSS
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-3 text-sm uppercase tracking-wider opacity-80">{t("تواصل معنا", "Contact Us")}</h4>
            <div className="flex items-center gap-3 mt-2">
              <a href="#" className="p-2 rounded-full bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <NewsletterFooter />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-secondary-foreground/20 mt-8 pt-6 text-center text-xs opacity-60 space-y-1">
          <p>{t("جميع الحقوق محفوظة © 2026 جريدة الشارع المصري", "All Rights Reserved © 2026 EgStreet News")}</p>
          <p>{t("بالتعاون مع شركة الكينج للانتاج الفني", "In partnership with King Production Company")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
