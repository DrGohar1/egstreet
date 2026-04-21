import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Mail, Rss, Youtube, Instagram, Send, MessageCircle } from "lucide-react";
import NewsletterFooter from "./NewsletterFooter";

const Footer = () => {
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();
  const rssUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rss`;

  const siteName = language === "ar"
    ? (settings.site_name_ar || "جريدة الشارع المصري")
    : (settings.site_name_en || "EgStreet News");

  const copyright = settings.copyright_text || t("جميع الحقوق محفوظة © 2026 جريدة الشارع المصري", "All Rights Reserved © 2026 EgStreet News");
  const partnerCredit = settings.partner_credit || t("تحت رعاية شركة الكينج للانتاج الفني", "Under the Patronage of Al-King for Art Production");

  const socials = [
    { key: "social_facebook", icon: Facebook, label: "Facebook" },
    { key: "social_twitter", icon: Twitter, label: "Twitter" },
    { key: "social_youtube", icon: Youtube, label: "YouTube" },
    { key: "social_instagram", icon: Instagram, label: "Instagram" },
    { key: "social_telegram", icon: Send, label: "Telegram" },
    { key: "social_whatsapp", icon: MessageCircle, label: "WhatsApp" },
  ];

  const activeSocials = socials.filter(s => settings[s.key]);

  return (
    <footer className="bg-secondary text-secondary-foreground mt-12" style={settings.font_family ? { fontFamily: settings.font_family } : undefined}>
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={siteName} className="h-10 object-contain mb-3 brightness-0 invert opacity-80" />
            ) : (
              <h3 className="text-xl font-black mb-2">{siteName}</h3>
            )}
            <p className="text-sm opacity-70 leading-relaxed">
              {settings.site_description || t("أخبار مصر والعالم العربي لحظة بلحظة", "Egypt & Arab world news, moment by moment")}
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

          {/* Contact + Social */}
          <div>
            <h4 className="font-bold mb-3 text-sm uppercase tracking-wider opacity-80">{t("تواصل معنا", "Contact Us")}</h4>
            {settings.contact_email && <p className="text-sm opacity-70 mb-1">📧 {settings.contact_email}</p>}
            {settings.contact_phone && <p className="text-sm opacity-70 mb-1">📱 {settings.contact_phone}</p>}
            {settings.contact_address && <p className="text-sm opacity-70 mb-3">📍 {settings.contact_address}</p>}
            <div className="flex items-center gap-2 mt-3">
              {activeSocials.map(s => (
                <a key={s.key} href={settings[s.key]} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-colors" title={s.label}>
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
              {activeSocials.length === 0 && (
                <>
                  <a href="#" className="p-2 rounded-full bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-colors"><Facebook className="w-4 h-4" /></a>
                  <a href="#" className="p-2 rounded-full bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-colors"><Twitter className="w-4 h-4" /></a>
                  <a href="#" className="p-2 rounded-full bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-colors"><Mail className="w-4 h-4" /></a>
                </>
              )}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <NewsletterFooter />
          </div>
        </div>

        {/* Our Network Section */}
        <div className="border-t border-secondary-foreground/20 mt-8 pt-6">
          <h4 className="text-center text-xs font-bold uppercase tracking-wider opacity-60 mb-4">
            {t("شبكتنا", "Our Network")}
          </h4>
          <div className="flex justify-center items-center gap-6 flex-wrap">
            {settings.partner_logo_url && (
              <a href={settings.partner_link || "#"} target="_blank" rel="noopener noreferrer">
                <img src={settings.partner_logo_url} alt={settings.partner_credit || ""} className="h-10 object-contain opacity-40 hover:opacity-80 transition-opacity brightness-0 invert" />
              </a>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-secondary-foreground/20 mt-6 pt-6 text-center text-xs opacity-60 space-y-1">
          <p>{copyright}</p>
          <p className="font-semibold">{partnerCredit}</p>
          {settings.footer_message && (
            <div className="mt-2" dangerouslySetInnerHTML={{ __html: settings.footer_message }} />
          )}
          <p className="mt-3 opacity-50 text-[10px] tracking-wide">
            {t("تطوير وبرمجة:", "Developed by:")}{" "}
            <span className="font-black">{t("د. سعيد جوهر", "Dr. Saeed Gohar")}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
