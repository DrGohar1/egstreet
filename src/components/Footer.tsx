import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Facebook, X as XIcon, Youtube, Instagram, Send, Rss, ArrowUp, MapPin, Phone, Mail, Radio, Star } from "lucide-react";

const Footer = () => {
  const { settings } = useSiteSettings();
  const [categories, setCategories] = useState<{id:string;name_ar:string;slug:string}[]>([]);
  const [pages,      setPages]      = useState<{id:string;title_ar:string;slug:string}[]>([]);
  const [email,      setEmail]      = useState("");
  const [subDone,    setSubDone]    = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id,name_ar,slug").order("sort_order")
      .then(({ data }) => setCategories(data || []));
    supabase.from("pages").select("id,title_ar,slug").eq("is_active", true).order("id").limit(10)
      .then(({ data }) => setPages(data || []));
  }, []);

  const subscribe = async () => {
    if (!email.includes("@")) return;
    setSubLoading(true);
    await supabase.from("subscribers").upsert({ email }, { onConflict: "email" });
    setSubDone(true); setSubLoading(false);
  };

  const siteName    = settings?.site_name_ar   || "جريدة الشارع المصري";
  const slogan      = settings?.newspaper_slogan || "من قلب الحدث";
  const siteDesc    = settings?.site_description_ar || "أخبار مصر والعالم العربي لحظة بلحظة";
  const logoUrl     = settings?.logo_url || settings?.site_logo || "";
  const copyright   = settings?.footer_text_ar || `© ${new Date().getFullYear()} ${siteName} — جميع الحقوق محفوظة`;
  const devName     = settings?.developer_name  || "GoharTech";
  const devUrl      = settings?.developer_url   || "#";
  const editorName  = settings?.chief_editor_name  || "";
  const editorTitle = settings?.chief_editor_title || "رئيس التحرير";
  const address     = settings?.newspaper_address  || "";
  const phone       = settings?.newspaper_phone    || "";
  const newsEmail   = settings?.newspaper_email    || "";

  // ── Sponsor ──
  const sponsorShow = settings?.sponsor_show !== "false";
  const sponsorText = settings?.sponsor_text || "برعاية";
  const sponsorName = settings?.sponsor_name || "شركة الكينج للإنتاج الفني — كابتن سعيد الدمرداش";
  const sponsorLogo = settings?.sponsor_logo || "";
  const sponsorUrl  = settings?.sponsor_url  || "#";

  const socials = [
    { key:"facebook_url",  Icon: Facebook,  label:"Facebook",  bg:"bg-[#1877F2]" },
    { key:"twitter_url",   Icon: XIcon,     label:"X",         bg:"bg-[#000]"    },
    { key:"youtube_url",   Icon: Youtube,   label:"YouTube",   bg:"bg-[#FF0000]" },
    { key:"instagram_url", Icon: Instagram, label:"Instagram", bg:"bg-gradient-to-br from-purple-500 to-pink-500" },
  ];

  const pageLinks = [
    { label:"الرئيسية",  to:"/" },
    { label:"الأرشيف",   to:"/archive" },
    ...(pages || []).map(p => ({ label: p.title_ar, to: `/page/${p.slug}` })),
  ];

  return (
    <footer className="bg-card border-t-4 border-primary" dir="rtl">

      {/* ══ Main Footer Content ══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Col 1 — Brand + Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              {logoUrl
                ? <img src={logoUrl} alt={siteName} className="h-14 w-14 rounded-xl object-cover shadow-md"/>
                : <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-white font-black text-2xl shadow-md">ش</div>
              }
              <div>
                <div className="font-black text-base leading-tight group-hover:text-primary transition-colors">
                  {siteName.replace("جريدة ","")}
                </div>
                <div className="text-[10px] text-muted-foreground">{slogan}</div>
              </div>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed">{siteDesc}</p>

            {editorName && (
              <div className="flex items-center gap-2 text-sm font-bold text-primary border border-primary/20 rounded-xl px-3 py-2 bg-primary/5 w-fit">
                <Radio className="w-3.5 h-3.5"/>
                {editorTitle}: {editorName}
              </div>
            )}

            <div className="space-y-1.5 text-xs text-muted-foreground">
              {address   && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-primary shrink-0"/>{address}</div>}
              {phone     && <div className="flex items-center gap-1.5"><Phone   className="w-3 h-3 text-primary shrink-0"/>{phone}</div>}
              {newsEmail && <div className="flex items-center gap-1.5"><Mail    className="w-3 h-3 text-primary shrink-0"/>{newsEmail}</div>}
            </div>

            <div className="flex gap-2 flex-wrap">
              {socials.map(({ key, Icon, label, bg }) => {
                const url = settings?.[key];
                if (!url) return (
                  <span key={key} aria-label={label}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg} opacity-30 cursor-default`}>
                    <Icon className="w-4 h-4 text-white"/>
                  </span>
                );
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg} text-white hover:scale-110 hover:shadow-lg transition-all duration-200 shadow-sm`}>
                    <Icon className="w-4 h-4"/>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Col 2 — Categories */}
          <div className="space-y-4">
            <h3 className="font-black text-sm flex items-center gap-2 pb-2 border-b border-border">
              <span className="w-1 h-5 bg-primary rounded-full shrink-0"/>
              روابط سريعة
            </h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary transition-colors shrink-0"/>
                    {cat.name_ar}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Page Links */}
          <div className="space-y-4">
            <h3 className="font-black text-sm flex items-center gap-2 pb-2 border-b border-border">
              <span className="w-1 h-5 bg-primary rounded-full shrink-0"/>
              عن الشارع المصري
            </h3>
            <ul className="space-y-2">
              {pageLinks.map((lnk, i) => (
                <li key={i}>
                  <Link to={lnk.to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary transition-colors shrink-0"/>
                    {lnk.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href="/sitemap.xml" target="_blank"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <Rss className="w-3 h-3 text-primary/50 group-hover:text-primary shrink-0"/>
                  خلاصة RSS
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4 — Newsletter */}
          <div className="space-y-4">
            <h3 className="font-black text-sm flex items-center gap-2 pb-2 border-b border-border">
              <span className="w-1 h-5 bg-primary rounded-full shrink-0"/>
              النشرة الإخبارية
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {settings?.newsletter_text || "اشترك واحصل على أبرز الأخبار مباشرةً على بريدك الإلكتروني كل يوم."}
            </p>
            {subDone
              ? <div className="text-sm text-primary font-bold py-2 flex items-center gap-2">
                  <Send className="w-4 h-4"/> شكراً! تم اشتراكك ✅
                </div>
              : <div className="space-y-2">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && subscribe()}
                    placeholder="أدخل بريدك الإلكتروني"
                    className="w-full text-sm px-3 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors"
                    dir="rtl"/>
                  <button onClick={subscribe} disabled={subLoading}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-primary/85 transition-colors disabled:opacity-60 shadow-sm">
                    <Send className="w-4 h-4"/>
                    {subLoading ? "جارٍ الاشتراك..." : "اشتراك"}
                  </button>
                </div>
            }
          </div>
        </div>
      </div>

      {/* ══ Sponsor Bar ══ */}
      {sponsorShow && (
        <div className="border-t border-amber-200/50 bg-gradient-to-r from-amber-50/80 via-yellow-50/60 to-amber-50/80 dark:from-amber-900/20 dark:via-yellow-900/10 dark:to-amber-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
            <a
              href={sponsorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 group w-fit mx-auto"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 shrink-0"/>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">{sponsorText}</span>
              {sponsorLogo && (
                <img
                  src={sponsorLogo}
                  alt={sponsorName}
                  className="h-7 w-auto max-w-[80px] object-contain rounded-md shadow-sm"
                />
              )}
              <span className="text-xs font-black text-amber-800 dark:text-amber-300 group-hover:text-amber-600 transition-colors">
                {sponsorName}
              </span>
              <Star className="w-3.5 h-3.5 text-amber-500 shrink-0"/>
            </a>
          </div>
        </div>
      )}

      {/* ══ Bottom Bar ══ */}
      <div className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground text-center">{copyright}</p>
          <div className="flex items-center gap-3">
            <Link to="/page/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">الخصوصية</Link>
            <span className="text-muted-foreground/30">•</span>
            <Link to="/page/terms"   className="text-xs text-muted-foreground hover:text-primary transition-colors">الشروط</Link>
            <span className="text-muted-foreground/30">•</span>
            <button onClick={() => window.scrollTo({top:0,behavior:"smooth"})}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-primary hover:text-white text-muted-foreground flex items-center justify-center transition-all">
              <ArrowUp className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
        <div className="border-t border-border/40 py-2 text-center">
          <a href={devUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground/50 hover:text-primary transition-colors flex items-center justify-center gap-1">
            <span className="font-mono">&lt;/&gt;</span>
            تم التطوير بواسطة <span className="font-bold">{devName}</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
