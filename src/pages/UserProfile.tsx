import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { User, Edit3, BookOpen, Eye, Clock, Save } from "lucide-react";

export default function UserProfile() {
  const { username } = useParams();
  const { user, profile: myProfile, updateProfile } = useAuth();
  const [profile,   setProfile]   = useState(null);
  const [articles,  setArticles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState(false);
  const [dispName,  setDispName]  = useState("");
  const [bio,       setBio]       = useState("");
  const [saving,    setSaving]    = useState(false);

  const isOwn = myProfile?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    supabase.from("profiles").select("*").eq("username", username).maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setDispName(data?.display_name || "");
        setBio(data?.bio || "");
        if (data?.user_id) {
          supabase.from("articles").select("id,title,slug,views,published_at,featured_image")
            .eq("author_id", data.user_id).eq("status","published")
            .order("published_at", { ascending: false }).limit(12)
            .then(({ data: arts }) => { setArticles(arts || []); setLoading(false); });
        } else { setLoading(false); }
      });
  }, [username]);

  const saveProfile = async () => {
    setSaving(true);
    await updateProfile({ display_name: dispName, bio });
    setProfile(p => ({ ...p, display_name: dispName, bio }));
    setSaving(false); setEditing(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Header/>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="h-24 w-24 rounded-full bg-muted animate-pulse mx-auto mb-4"/>
        <div className="h-6 w-40 bg-muted rounded animate-pulse mx-auto"/>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header/>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4"/>
        <p className="font-bold text-lg">المستخدم غير موجود</p>
        <Link to="/" className="text-primary text-sm mt-2 block">العودة للرئيسية</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header/>
      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Profile card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-3xl font-black text-primary">
            {profile.avatar_url
              ? <img src={profile.avatar_url} className="w-20 h-20 rounded-full object-cover"/>
              : (profile.display_name || profile.username)?.[0]?.toUpperCase()
            }
          </div>

          {editing ? (
            <div className="space-y-3 max-w-xs mx-auto">
              <input value={dispName} onChange={e => setDispName(e.target.value)}
                placeholder="الاسم الظاهر"
                className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
              <textarea value={bio} onChange={e => setBio(e.target.value)}
                placeholder="نبذة عنك..."
                rows={3}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"/>
              <div className="flex gap-2">
                <button onClick={saveProfile} disabled={saving}
                  className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1">
                  <Save className="w-3.5 h-3.5"/>{saving ? "..." : "حفظ"}
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex-1 border border-border py-2 rounded-xl text-sm font-bold hover:bg-muted">
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-black text-xl">{profile.display_name || profile.username}</h1>
              <p className="text-sm text-primary font-bold mt-0.5">@{profile.username}</p>
              {profile.bio && <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{profile.bio}</p>}
              {isOwn && (
                <button onClick={() => setEditing(true)}
                  className="mt-3 text-xs font-bold border border-border px-4 py-1.5 rounded-xl hover:bg-muted flex items-center gap-1 mx-auto transition-colors">
                  <Edit3 className="w-3 h-3"/>تعديل الملف
                </button>
              )}
            </>
          )}

          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border text-sm">
            <div className="text-center">
              <div className="font-black text-lg">{articles.length}</div>
              <div className="text-xs text-muted-foreground">مقال</div>
            </div>
            <div className="text-center">
              <div className="font-black text-lg">
                {articles.reduce((s,a) => s+(a.views||0), 0).toLocaleString("ar-EG")}
              </div>
              <div className="text-xs text-muted-foreground">قراءة</div>
            </div>
          </div>
        </div>

        {/* Articles */}
        {articles.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-primary"/>
              <h2 className="font-black">مقالات {profile.display_name||profile.username}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {articles.map(a => (
                <Link key={a.id} to={"/article/"+a.slug}
                  className="group flex gap-3 p-3 bg-card border border-border rounded-xl hover:bg-muted/40 transition-all">
                  {a.featured_image
                    ? <img src={a.featured_image} alt={a.title} className="w-16 h-12 object-cover rounded-lg shrink-0"/>
                    : <div className="w-16 h-12 rounded-lg bg-muted shrink-0"/>
                  }
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold line-clamp-2 group-hover:text-primary transition-colors">{a.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Eye className="w-2 h-2"/>{(a.views||0).toLocaleString("ar-EG")}</span>
                      <span className="flex items-center gap-0.5"><Clock className="w-2 h-2"/>
                        {a.published_at ? new Date(a.published_at).toLocaleDateString("ar-EG") : ""}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
      <Footer/>
    </div>
  );
}
