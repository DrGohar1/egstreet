import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Facebook, Twitter, Youtube, Instagram, Send, Rss, ArrowUp } from "lucide-react";

const Footer = () => {
  const { settings } = useSiteSettings();
  const [categories, setCategories] = useState<{id:string;name_ar:string;slug:string}[]>([]);
  const [pages,      setPages]      = useState<{id:string;title_ar:string;slug:string}[]>([]);
  const [email,      setEmail]      = useState("");
  const [subDone,    setSubDone]    = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id,name_ar,slug").order("sort_order").limit(8)
      .then(({ data }) => setCategories(data || []));
    supabase.from("pages").select("id,title_ar,slug").eq("is_active", true).limit(5)
      .then(({ data }) => setPages(data || []));
  }, []);

  const subscribe = async () => {
    if (!email.includes("@")) return;
    setSubLoading(true);
    await supabase.from("subscribers").upsert({ email }, { onConflict: "email" });
    setSubDone(true); setSubLoading(false);
  };

  const siteName  = settings?.site_name_ar || "جريدة الشارع المصري";
  const siteDesc  = settings?.site_description_ar || "أخبار مصر والعالم لحظة بلحظة";
  const slogan    = settings?.newspaper_slogan || "صحافة تضرم عقلك";
  const logoUrl   = settings?.logo_url || settings?.site_logo || "";
  const copyright = settings?.footer_text_ar
    || `© ${new Date().getFullYear()} ${siteName} — جميع الحقوق محفوظة`;
  const devName   = settings?.developer_name || "GoharTech";
  const devUrl    = settings?.developer_url || "#";

  // Social icons — always render, gray if no URL
  const socials = [
    { key:"instagram_url", icon:<Instagram className="w-4 h-4"/>, label:"Instagram",
      color:"hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500" },
    { key:"youtube_url",   icon:<Youtube   className="w-4 h-4"/>, label:"YouTube",
      color:"hover:bg-red-600" },
    { key:"twitter_url",   icon:<Twitter   className="w-4 h-4"/>, label:"Twitter / X",
      color:"hover:bg-black" },
    { key:"facebook_url",  icon:<Facebook  className="w-4 h-4"/>, label:"Facebook",
      color:"hover:bg-blue-600" },
  ];

  const quickLinks = [
    { label:"الرئيسية",     to:"/" },
    { label:"تواصل معنا",   to:"/contact" },
    { label:"سياسة الخصوصية", to:"/page/privacy-policy" },
    { label:"الشروط",       to:"/page/terms" },
    ...(pages || []).map(p => ({ label: p.title_ar, to: `/page/${p.slug}` })),
  ];

  return (
    <footer className="bg-card border-t border-border mt-16" dir="rtl">
      <div className="h-1 bg-gradient-to-l from-primary via-primary/60 to-primary/20"/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

          {/* ── Col 1: Brand + Socials ── */}
          <div className="lg:col-span-1 space-y-5">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              {logoUrl
                ? <img src={logoUrl} alt={siteName} className="h-12 w-12 rounded-xl object-cover shadow-md"/>
                : <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-md">ش</div>
              }
              <div>
                <div className="font-black text-sm leading-tight text-foreground group-hover:text-primary transition-colors">
                  {siteName}
                </div>
                <div className="text-[10px] text-muted-foreground">{slogan}</div>
              </div>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed">{siteDesc}</p>

            {/* Social icons — always visible */}
            <div className="flex gap-2">
              {socials.map(s => {
                const url = settings?.[s.key] || null;
                const Wrap = url ? "a" : "span";
                return (
                  <Wrap key={s.key}
                    {...(url ? { href: url, target:"_blank", rel:"noopener noreferrer" } : {})}
                    aria-label={s.label}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
                      text-white shadow-sm cursor-pointer hover:scale-110
                      ${url ? `bg-muted/80 text-muted-foreground ${s.color} hover:text-white` : "bg-muted/50 text-muted-foreground/40 cursor-default"}`}>
                    {s.icon}
                  </Wrap>
                );
              })}
            </div>
          </div>

          {/* ── Col 2: Categories ── */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm border-b border-border pb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block"/>
              الأقسام
            </h3>
            <ul className="space-y-2">
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

          {/* ── Col 3: Quick Links ── */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm border-b border-border pb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block"/>
              روابط مهمة
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((lnk, i) => (
                <li key={i}>
                  <Link to={lnk.to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary transition-colors shrink-0"/>
                    {lnk.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 4: Newsletter ── */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm border-b border-border pb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block"/>
              النشرة الإخبارية
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {settings?.newsletter_text || "اشترك واحصل على أحد الأخبار مباشرةً لبريدك الإلكتروني كل يوم."}
            </p>
            {subDone
              ? <div className="text-sm text-primary font-bold py-2 flex items-center gap-2">
                  <Rss className="w-4 h-4"/> شكراً! تم اشتراكك ✅
                </div>
              : <div className="flex gap-2">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && subscribe()}
                    placeholder="بريدك الإلكتروني"
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors"/>
                  <button onClick={subscribe} disabled={subLoading}
                    className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/85 transition-colors shrink-0 disabled:opacity-60 shadow-sm">
                    <Send className="w-4 h-4"/>
                  </button>
                </div>
            }
            <a href="/sitemap.xml" target="_blank"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Rss className="w-3.5 h-3.5"/> خلاصة RSS
            </a>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-border bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground text-center sm:text-start">{copyright}</p>
          <div className="flex items-center gap-4">
            <Link to="/page/privacy-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              الخصوصية
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link to="/page/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              الشروط
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <button onClick={() => window.scrollTo({ top:0, behavior:"smooth" })}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-primary hover:text-white text-muted-foreground flex items-center justify-center transition-all shadow-sm">
              <ArrowUp className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
        {/* Developer credit */}
        <div className="border-t border-border/50 py-2 text-center">
          <a href={devUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground/50 hover:text-primary transition-colors flex items-center justify-center gap-1">
            <span className="font-mono">&lt;/&gt;</span>
            تم التطوير بواسطة
            <span className="font-bold">{devName}</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
