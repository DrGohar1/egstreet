import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { FileText } from "lucide-react";

// Built-in placeholder pages (إذا لم توجد الصفحة في DB)
const PLACEHOLDERS: Record<string, { title: string; content: string }> = {
  about: {
    title: "من نحن",
    content: `<h2>من نحن</h2>
    <p>جريدة الشارع المصري — منبر إعلامي مستقل يسعى لتقديم الخبر الحقيقي من قلب الحدث.</p>
    <h3>رئيس مجلس الإدارة</h3><p>د/محمود عليوة</p>
    <h3>رئيس التحرير</h3><p>ممدوح القعيد</p>
    <h3>مدير التحرير التنفيذي</h3><p>محمد عنبر</p>
    <p><em>هذه الصفحة قيد التحرير — يمكن تعديل محتواها من لوحة التحكم ← الصفحات.</em></p>`,
  },
  contact: {
    title: "اتصل بنا",
    content: `<h2>اتصل بنا</h2>
    <p>نرحب بتواصلكم معنا لأي استفسارات أو مقترحات أو بلاغات.</p>
    <p><em>هذه الصفحة قيد التحرير — يمكن إضافة بيانات التواصل من لوحة التحكم ← الصفحات ← اتصل بنا.</em></p>`,
  },
  advertise: {
    title: "أعلن معنا",
    content: `<h2>أعلن معنا</h2>
    <p>للإعلان في جريدة الشارع المصري وللوصول لأكبر شريحة من القراء المصريين، يرجى التواصل معنا.</p>
    <p><em>هذه الصفحة قيد التحرير — يمكن إضافة تفاصيل الإعلانات من لوحة التحكم ← الصفحات ← أعلن معنا.</em></p>`,
  },
  privacy: {
    title: "سياسة الخصوصية",
    content: `<h2>سياسة الخصوصية</h2>
    <p>تلتزم جريدة الشارع المصري بحماية خصوصية مستخدميها وعدم مشاركة بياناتهم الشخصية مع أي طرف ثالث.</p>
    <h3>البيانات التي نجمعها</h3>
    <ul><li>بيانات التصفح الأساسية لتحسين تجربة المستخدم</li>
    <li>الاشتراك في النشرة البريدية بشكل اختياري فقط</li></ul>
    <p><em>هذه الصفحة قيد التحرير — يمكن تعديلها من لوحة التحكم ← الصفحات ← سياسة الخصوصية.</em></p>`,
  },
};

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<{ title_ar:string; content_ar:string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase.from("pages").select("title_ar, content_ar, meta_title, meta_description")
      .eq("slug", slug).eq("is_active", true).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPage({ title_ar: data.title_ar, content_ar: data.content_ar || "" });
        } else if (PLACEHOLDERS[slug]) {
          setPage({ title_ar: PLACEHOLDERS[slug].title, content_ar: PLACEHOLDERS[slug].content });
        } else {
          setPage(null);
        }
        setLoading(false);
      });
  }, [slug]);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <SEOHead title={page?.title_ar} url={`/page/${slug}`}/>
      <Header/>
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"/>
            <div className="h-4 bg-muted rounded w-full"/>
            <div className="h-4 bg-muted rounded w-5/6"/>
          </div>
        ) : page ? (
          <>
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary"/>
              </div>
              <h1 className="text-2xl font-black" style={{fontFamily:"'Noto Kufi Arabic','Cairo',sans-serif"}}>{page.title_ar}</h1>
            </div>
            <div
              className="article-body"
              style={{fontFamily:"'Noto Kufi Arabic','Cairo',sans-serif"}}
              dangerouslySetInnerHTML={{ __html: page.content_ar }}
            />
          </>
        ) : (
          <div className="text-center py-20 space-y-3">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto"/>
            <p className="text-lg font-bold text-muted-foreground">الصفحة غير موجودة</p>
            <Link to="/" className="text-primary text-sm hover:underline">العودة للرئيسية</Link>
          </div>
        )}
      </main>
      <Footer/>
    </div>
  );
}
