import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Facebook, X as XIcon, Youtube, Instagram, ArrowUp } from "lucide-react";

const Footer = () => {
  const { settings } = useSiteSettings();
  const [categories, setCategories] = useState<{id:string;name_ar:string;slug:string}[]>([]);
  const [pages, setPages] = useState<{id:string;title_ar:string;slug:string}[]>([]);

  useEffect(() => {
    supabase.from("categories").select("id,name_ar,slug").order("sort_order").limit(8)
      .then(({ data }) => setCategories(data || []));
    supabase.from("pages").select("id,title_ar,slug").eq("is_active", true).order("id").limit(8)
      .then(({ data }) => setPages(data || []));
  }, []);

  const siteName  = settings?.site_name_ar   || "جريدة الشارع المصري";
  const slogan    = settings?.newspaper_slogan || "من قلب الحدث";
  const logoUrl   = settings?.logo_url || settings?.site_logo || "";
  const copyright = settings?.footer_text_ar || `© ${new Date().getFullYear()} ${siteName}`;
  const devName   = settings?.developer_name  || "GoharTech";
  const devUrl    = settings?.developer_url   || "#";
  const address   = settings?.newspaper_address || "";
  const phone     = settings?.newspaper_phone   || "";
  const newsEmail = settings?.newspaper_email   || "";

  // Sponsor (tiny, tasteful)
  const sponsorShow = settings?.sponsor_show !== "false";
  const sponsorText = settings?.sponsor_text || "برعاية";
  const sponsorName = settings?.sponsor_name || "";
  const sponsorUrl  = settings?.sponsor_url  || "#";

  const socials = [
    { key:"facebook_url",  Icon: Facebook,  bg:"bg-[#1877F2]" },
    { key:"twitter_url",   Icon: XIcon,     bg:"bg-black" },
    { key:"youtube_url",   Icon: Youtube,   bg:"bg-[#FF0000]" },
    { key:"instagram_url", Icon: Instagram, bg:"bg-gradient-to-br from-purple-500 to-pink-500" },
  ];

  const quickLinks = [
    { label:"الرئيسية", to:"/" },
    { label:"الأرشيف",  to:"/archive" },
    { label:"من نحن",   to:"/page/about" },
    { label:"اتصل بنا", to:"/page/contact" },
    { label:"أعلن معنا",to:"/page/advertise" },
    { label:"سياسة الخصوصية", to:"/page/privacy" },
    ...(pages.map(p => ({ label: p.title_ar, to: `/page/${p.slug}` }))),
  ];

  return (
    <footer className="bg-card border-t-2 border-primary/60 mt-auto" dir="rtl">

      {/* ══ Main Footer ══ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              {logoUrl
                ? <img src={logoUrl} alt={siteName} className="h-12 w-12 rounded-xl object-cover shadow"/>
                : <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow">ش</div>
              }
              <div>
                <div className="font-black text-sm leading-tight group-hover:text-primary transition-colors">{siteName}</div>
                <div className="text-[10px] text-muted-foreground">{slogan}</div>
              </div>
            </Link>

            {/* Contact */}
            <div className="space-y-1 text-[11px] text-muted-foreground">
              {address && <p>{address}</p>}
              {phone   && <p dir="ltr" className="text-right">{phone}</p>}
              {newsEmail && <p>{newsEmail}</p>}
            </div>

            {/* Socials */}
            <div className="flex gap-1.5 flex-wrap">
              {socials.map(({ key, Icon, bg }) => {
                const url = settings?.[key];
                return url ? (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-white hover:opacity-80 transition-opacity ${bg}`}>
                    <Icon className="w-3.5 h-3.5"/>
                  </a>
                ) : null;
              })}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-black text-xs mb-3 pb-1 border-b border-border text-primary">الأقسام</h3>
            <ul className="space-y-1.5">
              {categories.map(c => (
                <li key={c.id}>
                  <Link to={`/category/${c.slug}`}
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
                    {c.name_ar}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-black text-xs mb-3 pb-1 border-b border-border text-primary">روابط سريعة</h3>
            <ul className="space-y-1.5">
              {quickLinks.map(l => (
                <li key={l.to}>
                  <Link to={l.to}
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Staff */}
          <div>
            <h3 className="font-black text-xs mb-3 pb-1 border-b border-border text-primary">الفريق التحريري</h3>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              <li><span className="text-foreground font-bold">د/محمود عليوة</span><br/><span className="text-[10px]">رئيس مجلس الإدارة</span></li>
              <li><span className="text-foreground font-bold">ممدوح القعيد</span><br/><span className="text-[10px]">رئيس التحرير</span></li>
              <li><span className="text-foreground font-bold">محمد عنبر</span><br/><span className="text-[10px]">مدير التحرير التنفيذي</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* ══ Bottom Bar ══ */}
      <div className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span>{copyright} — جميع الحقوق محفوظة</span>
          <div className="flex items-center gap-3">
            {sponsorShow && sponsorName && (
              <a href={sponsorUrl} target="_blank" rel="noopener noreferrer"
                className="opacity-60 hover:opacity-100 transition-opacity">
                {sponsorText}: {sponsorName}
              </a>
            )}
            <span>تطوير: <a href={devUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{devName}</a></span>
            <button onClick={() => window.scrollTo({top:0,behavior:"smooth"})}
              className="w-6 h-6 rounded bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors" title="أعلى الصفحة">
              <ArrowUp className="w-3 h-3 text-primary"/>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
