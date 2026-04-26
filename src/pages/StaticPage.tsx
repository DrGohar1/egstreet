import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowRight } from "lucide-react";

const StaticPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      setPage(data);
      setLoading(false);
    };
    if (slug) fetch();
  }, [slug]);

  const title = page ? (language === "ar" ? page.title_ar : page.title_en) : "";
  const content = page ? (language === "ar" ? page.content_ar : page.content_en) : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("الصفحة غير موجودة", "Page Not Found")}</h2>
          <Link to="/" className="text-primary hover:underline">{t("العودة للرئيسية", "Back to Home")}</Link>
        </div>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={title} description={title} />
      <Header />
      <main className="container py-8">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">{t("الرئيسية", "Home")}</Link>
          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          <span className="text-foreground">{title}</span>
        </nav>
        <article className="max-w-3xl mx-auto bg-card rounded-lg border border-border p-6 md:p-10">
          <h1 className="text-3xl font-black text-foreground mb-6">{title}</h1>
          <div
            className="prose prose-lg max-w-none text-foreground/90 leading-loose"
            dangerouslySetInnerHTML={{ __html: content || "" }}
          />
        </article>
      </main>
      
    <Footer />
    </div>
  );
};

export default StaticPage;
