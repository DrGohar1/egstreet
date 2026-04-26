import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
  Facebook, Twitter, Youtube, Instagram, Linkedin,
  Mail, Phone, MapPin, ArrowUp, Send, Rss
} from "lucide-react";

const Footer = () => {
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();
  const isRtl = language === "ar";
  const [categories, setCategories] = useState<{id:string;name_ar:string;name_en:string;slug:string}[]>([]);
  const [pages, setPages] = useState<{id:string;title_ar:string;title_en:string;slug:string}[]>([]);
  const [email, setEmail] = useState("");
  const [subDone, setSubDone] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id,name_ar,name_en,slug").order("sort_order").limit(8)
      .then(({ data }) => setCategories(data || []));
    supabase.from("pages").select("id,title_ar,title_en,slug").eq("is_published", true).limit(5)
      .then(({ data }) => setPages(data || []));
  }, []);

  const subscribe = async () => {
    if (!email.includes("@")) return;
    setSubLoading(true);
    await supabase.from("subscribers").upsert({ email }, { onConflict: "email" });
    setSubDone(true);
    setSubLoading(false);
  };

  const siteName  = settings?.site_name_ar  || settings?.site_name || "إيجي ستريت نيوز";
  const siteDesc  = settings?.site_description_ar || settings?.footer_tagline || "أخبار مصر والعالم لحظة بلحظة";
  const address   = settings?.address   || "";
  const phone     = settings?.phone     || "";
  const contactEmail = settings?.contact_email || settings?.email || "";
  const fbUrl    = settings?.facebook_url  || settings?.facebook  || "";
  const twUrl    = settings?.twitter_url   || settings?.twitter   || "";
  const ytUrl    = settings?.youtube_url   || settings?.youtube   || "";
  const igUrl    = settings?.instagram_url || settings?.instagram || "";
  const liUrl    = settings?.linkedin_url  || settings?.linkedin  || "";
  const copyright = settings?.copyright || `© ${new Date().getFullYear()} ${siteName}. جميع الحقوق محفوظة`;

  const socials = [
    { url: fbUrl, icon: <Facebook className="w-4 h-4" />, label: "Facebook" },
    { url: twUrl, icon: <Twitter  className="w-4 h-4" />, label: "Twitter"  },
    { url: ytUrl, icon: <Youtube  className="w-4 h-4" />, label: "YouTube"  },
    { url: igUrl, icon: <Instagram className="w-4 h-4" />, label: "Instagram"},
    { url: liUrl, icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn" },
  ].filter(s => s.url);

  return (
    <footer className="bg-card border-t border-border mt-16" dir={isRtl ? "rtl" : "ltr"}>

      {/* ── Top gradient bar ── */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

          {/* ── Col 1: Brand ── */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              {settings?.logo_url
                ? <img src={settings.logo_url} alt={siteName} className="h-9 object-contain" />
                : <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg shadow-md">
                    {siteName.charAt(0)}
                  </div>
              }
              <span className="font-black text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                {siteName}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">{siteDesc}</p>

            {/* Socials */}
            {socials.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {socials.map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-9 h-9 rounded-xl bg-muted hover:bg-primary hover:text-white text-muted-foreground flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm">
                    {s.icon}
                  </a>
                ))}
              </div>
            )}

            {/* Contact */}
            <div className="space-y-2 pt-1">
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-3.5 h-3.5 shrink-0" />{contactEmail}
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-3.5 h-3.5 shrink-0" />{phone}
                </a>
              )}
              {address && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />{address}
                </p>
              )}
            </div>
          </div>

          {/* ── Col 2: Categories ── */}
          {categories.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">
                {t("الأقسام", "Sections")}
              </h3>
              <ul className="space-y-2">
                {categories.map(cat => (
                  <li key={cat.id}>
                    <Link
                      to={`/category/${cat.slug}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                      {isRtl ? cat.name_ar : cat.name_en}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Col 3: Pages ── */}
          {pages.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">
                {t("روابط مهمة", "Quick Links")}
              </h3>
              <ul className="space-y-2">
                {pages.map(p => (
                  <li key={p.id}>
                    <Link
                      to={`/page/${p.slug}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                      {isRtl ? p.title_ar : p.title_en}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/archive" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                    {t("الأرشيف", "Archive")}
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* ── Col 4: Newsletter ── */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">
              {t("النشرة البريدية", "Newsletter")}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("اشترك واحصل على أحدث الأخبار مباشرة في بريدك", "Subscribe to get the latest news in your inbox")}
            </p>
            {subDone ? (
              <div className="flex items-center gap-2 text-sm text-primary font-medium py-2">
                <Rss className="w-4 h-4" />
                {t("شكراً! تم اشتراكك بنجاح", "Thanks! You're subscribed")}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && subscribe()}
                  placeholder={t("بريدك الإلكتروني", "Your email")}
                  className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors"
                />
                <button
                  onClick={subscribe}
                  disabled={subLoading}
                  className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/85 transition-colors shadow-sm disabled:opacity-60 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* RSS */}
            <a href="/sitemap.xml" target="_blank" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Rss className="w-3.5 h-3.5" />
              {t("خلاصة RSS", "RSS Feed")}
            </a>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-border bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground text-center sm:text-start">{copyright}</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-8 h-8 rounded-xl bg-muted border border-border hover:bg-primary hover:text-white hover:border-primary text-muted-foreground flex items-center justify-center transition-all duration-200 shrink-0"
            aria-label="Back to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
