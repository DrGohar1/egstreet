import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
  Newspaper, Facebook, Twitter, Youtube, Instagram, Mail,
  Send, MapPin, Phone, Heart, Code2, ExternalLink
} from "lucide-react";

const Footer = () => {
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();
  const [categories, setCategories] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [subDone, setSubDone] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id,name_ar,name_en,slug").order("sort_order").limit(8)
      .then(({ data }) => setCategories(data || []));
    supabase.from("pages").select("id,title_ar,title_en,slug").eq("is_published", true).limit(6)
      .then(({ data }) => setPages(data || []));
  }, []);

  const subscribe = async () => {
    if (!email.includes("@")) return;
    await supabase.from("subscribers").insert({ email });
    setSubDone(true);
  };

  const siteName = language === "ar"
    ? (settings.site_name_ar || "الشارع المصري")
    : (settings.site_name_en || "EgStreet News");

  return (
    <footer className="bg-card border-t border-border mt-12" dir="rtl">

      {/* Main footer grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt={siteName} className="h-9 w-auto" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-black text-lg text-foreground">{siteName}</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {settings.site_description_ar || t(
                "جريدتك الإلكترونية الأولى للأخبار المصرية والعربية. موثوقة، سريعة، محايدة.",
                "Your #1 source for Egyptian and Arab news. Reliable, fast, neutral."
              )}
            </p>
            {/* Social */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { href: settings.facebook_url || "#", icon: Facebook, color: "hover:bg-blue-600" },
                { href: settings.twitter_url  || "#", icon: Twitter,  color: "hover:bg-black" },
                { href: settings.youtube_url  || "#", icon: Youtube,  color: "hover:bg-red-600" },
                { href: settings.instagram_url|| "#", icon: Instagram, color: "hover:bg-pink-600" },
              ].map(({ href, icon: Icon, color }) => (
                <a key={href + color} href={href} target="_blank" rel="noreferrer"
                  className={`w-9 h-9 rounded-xl bg-muted ${color} hover:text-white flex items-center justify-center transition-all`}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div>
            <h3 className="font-black text-sm mb-4 text-foreground flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              {t("الأقسام", "Sections")}
            </h3>
            <ul className="space-y-2">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                    {language === "ar" ? cat.name_ar : cat.name_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pages */}
          <div>
            <h3 className="font-black text-sm mb-4 text-foreground flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              {t("روابط مهمة", "Quick Links")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  {t("الرئيسية", "Home")}
                </Link>
              </li>
              {pages.map(p => (
                <li key={p.id}>
                  <Link to={`/page/${p.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                    {language === "ar" ? p.title_ar : p.title_en}
                  </Link>
                </li>
              ))}
              {[
                { label: t("أرشيف المقالات", "Archive"), href: "/archive" },
                { label: t("تواصل معنا", "Contact Us"), href: "/page/contact" },
                { label: t("سياسة الخصوصية", "Privacy Policy"), href: "/page/privacy" },
              ].map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-black text-sm mb-4 text-foreground flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              {t("النشرة الإخبارية", "Newsletter")}
            </h3>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              {t("اشترك واحصل على آخر الأخبار مباشرةً لبريدك الإلكتروني كل يوم.", "Subscribe for daily news in your inbox.")}
            </p>
            {subDone ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-xl p-3 text-xs text-center font-bold">
                ✅ {t("شكراً! تم اشتراكك بنجاح.", "Thanks! You're subscribed.")}
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && subscribe()}
                  placeholder={t("بريدك الإلكتروني", "Your email")}
                  className="flex-1 min-w-0 border border-border rounded-xl px-3 py-2 text-xs bg-background focus:ring-2 focus:ring-primary/30 outline-none"
                  dir="ltr"
                />
                <button onClick={subscribe}
                  className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white hover:bg-primary/90 transition-colors shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Contact info */}
            {settings.contact_email && (
              <div className="mt-4 space-y-1.5">
                <a href={`mailto:${settings.contact_email}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {settings.contact_email}
                </a>
                {settings.contact_phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {settings.contact_phone}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} {siteName} — {t("جميع الحقوق محفوظة", "All rights reserved")}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Link to="/page/privacy" className="hover:text-primary transition-colors">{t("الخصوصية", "Privacy")}</Link>
            <span>·</span>
            <Link to="/page/terms" className="hover:text-primary transition-colors">{t("الشروط", "Terms")}</Link>
          </div>
        </div>

        {/* Developer credit */}
        <div className="border-t border-border/50 bg-muted/30">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Code2 className="w-3.5 h-3.5 text-primary" />
              {t("تم التطوير بواسطة", "Developed by")}
              <a href="https://wa.me/201001234567" target="_blank" rel="noreferrer"
                className="font-black text-primary hover:underline flex items-center gap-0.5">
                {settings?.developer_name || "GoharTech"}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {t("صُنع بـ", "Made with")}
              <Heart className="w-3 h-3 text-red-500 fill-red-500 mx-0.5" />
              {t("في مصر 🇪🇬", "in Egypt 🇪🇬")}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
