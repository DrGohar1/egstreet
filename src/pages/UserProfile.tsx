import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ArticleCard from "@/components/ArticleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, History, Settings, User, Save, Loader2 } from "lucide-react";

const UserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [profileRes, savedRes, catRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("saved_articles").select("article_id").eq("user_id", user.id).order("saved_at", { ascending: false }).limit(20),
        supabase.from("categories").select("*"),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setDisplayName(profileRes.data.display_name || "");
        setBio(profileRes.data.bio || "");
      }
      if (catRes.data) setCategories(catRes.data);

      if (savedRes.data && savedRes.data.length > 0) {
        const ids = savedRes.data.map((s: any) => s.article_id);
        const { data: arts } = await supabase.from("articles").select("*").in("id", ids).eq("status", "published");
        if (arts) setSavedArticles(arts);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const getCategoryName = (catId: string | null) => {
    if (!catId) return undefined;
    const cat = categories.find((c) => c.id === catId);
    return cat ? (language === "ar" ? cat.name_ar : cat.name_en) : undefined;
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, bio }).eq("user_id", user.id);
    if (error) {
      toast({ title: t("خطأ في الحفظ", "Save error"), variant: "destructive" });
    } else {
      toast({ title: t("تم حفظ الملف الشخصي", "Profile saved") });
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t("حسابي", "My Account")} description={t("إدارة حسابي", "Manage my account")} />
      <Header />

      <main className="container py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">{displayName || user.email}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Tabs defaultValue="saved" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="saved" className="gap-2">
              <Bookmark className="w-4 h-4" />
              {t("المحفوظة", "Saved")}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              {t("الإعدادات", "Settings")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved">
            {savedArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    title={article.title}
                    excerpt={article.excerpt || undefined}
                    slug={article.slug}
                    featuredImage={article.featured_image || undefined}
                    categoryName={getCategoryName(article.category_id)}
                    publishedAt={article.published_at || undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Bookmark className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground">{t("لم تحفظ أي مقالات بعد", "No saved articles yet")}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("إعدادات الملف الشخصي", "Profile Settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("الاسم المعروض", "Display Name")}</label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("نبذة", "Bio")}</label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("البريد الإلكتروني", "Email")}</label>
                  <Input value={user.email || ""} disabled className="bg-muted" />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t("حفظ التغييرات", "Save Changes")}
                </Button>
              </CardContent>
            </Card>

            {/* Password Reset */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">{t("تغيير كلمة المرور", "Change Password")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!user.email) return;
                    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) {
                      toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
                    } else {
                      toast({ title: t("تم إرسال رابط إعادة التعيين إلى بريدك", "Reset link sent to your email") });
                    }
                  }}
                >
                  {t("إرسال رابط إعادة التعيين", "Send Reset Link")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;
