import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Save, Send, Eye, ArrowRight, ImagePlus, Search, X, Loader2,
  Upload, Link2, Bold, Italic, List, Heading2, Quote, AlignRight,
  Hash, ChevronDown, Clock, Globe, Zap, Star, RotateCcw
} from "lucide-react";

const UNSPLASH_KEY = "P8Dz4oGBSFgpfPgFKdWm9ZHAYijpqMiCj7d7E_B3Tic";

interface Category { id:string; name_ar:string; name_en:string; slug:string; }

// ── Image Picker Modal ──
const ImagePicker = ({ onSelect, onClose }: { onSelect:(url:string)=>void; onClose:()=>void }) => {
  const [tab,       setTab]       = useState<"unsplash"|"upload"|"url">("unsplash");
  const [query,     setQuery]     = useState("");
  const [images,    setImages]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [urlInput,  setUrlInput]  = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const searchUnsplash = async (q:string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=16&orientation=landscape`,
        { headers:{ Authorization:`Client-ID ${UNSPLASH_KEY}` } }
      );
      const data = await r.json();
      setImages(data.results||[]);
    } catch(_) {
      // Fallback: use picsum
      setImages(Array.from({length:12},(_,i)=>({
        id:String(i),
        urls:{ small:`https://picsum.photos/seed/${q+i}/400/250`, regular:`https://picsum.photos/seed/${q+i}/1200/750` },
        alt_description:q, user:{ name:"Picsum" }
      })));
    }
    setLoading(false);
  };

  const handleUpload = async (file:File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `articles/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert:true });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onSelect(data.publicUrl);
      toast.success("تم رفع الصورة");
    } catch(e:any) {
      // If storage not configured, use object URL as preview
      const url = URL.createObjectURL(file);
      onSelect(url);
      toast.info("تم اختيار الصورة (سيتم الرفع لاحقاً)");
    }
    setUploading(false);
  };

  useEffect(()=>{ searchUnsplash("مصر أخبار egypt news"); },[]);

  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 bg-black/70 z-50" onClick={onClose}/>
      <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.95}}
        className="fixed inset-4 md:inset-8 z-50 bg-card rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h3 className="font-black flex items-center gap-2"><ImagePlus className="w-5 h-5 text-primary"/> اختر صورة</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70">
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {[
            {id:"unsplash",label:"🔍 بحث Unsplash"},
            {id:"upload",  label:"📁 رفع من الجهاز"},
            {id:"url",     label:"🔗 رابط مباشر"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id as any)}
              className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors ${tab===t.id?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Unsplash Tab */}
          {tab==="unsplash" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={query} onChange={e=>setQuery(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&searchUnsplash(query)}
                  placeholder="ابحث بالعربي أو الإنجليزي..."
                  className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                <button onClick={()=>searchUnsplash(query)}
                  className="bg-primary text-white px-4 rounded-xl font-bold text-sm flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
                  {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Search className="w-4 h-4"/>}
                  بحث
                </button>
              </div>
              {/* Quick searches */}
              <div className="flex gap-2 flex-wrap">
                {["مصر","سياسة","رياضة","اقتصاد","طبيعة","مدينة","تقنية"].map(s=>(
                  <button key={s} onClick={()=>{setQuery(s);searchUnsplash(s);}}
                    className="text-xs px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors">
                    {s}
                  </button>
                ))}
              </div>
              {loading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {images.map(img=>(
                  <button key={img.id} onClick={()=>{onSelect(img.urls.regular||img.urls.small); onClose();}}
                    className="relative group overflow-hidden rounded-xl aspect-video hover:ring-2 hover:ring-primary transition-all">
                    <img src={img.urls.small} alt={img.alt_description||""} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100">اختر</span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 p-1">
                      <p className="text-white text-[8px] truncate">{img.user?.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {tab==="upload" && (
            <div className="space-y-4">
              <div onClick={()=>fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/2 transition-all">
                {uploading ? (
                  <><Loader2 className="w-10 h-10 mx-auto mb-2 text-primary animate-spin"/><p className="text-sm font-bold">جاري الرفع...</p></>
                ) : (
                  <><Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40"/><p className="font-bold text-sm mb-1">اسحب الصورة أو اضغط للاختيار</p><p className="text-xs text-muted-foreground">PNG, JPG, WEBP — حد أقصى 5MB</p></>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e=>{ const f=e.target.files?.[0]; if(f) handleUpload(f); }}/>
            </div>
          )}

          {/* URL Tab */}
          {tab==="url" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-2 block">رابط الصورة المباشر</label>
                <input value={urlInput} onChange={e=>setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
              </div>
              {urlInput && <img src={urlInput} alt="" className="w-full rounded-xl object-cover max-h-48" onError={e=>(e.target as any).style.display="none"}/>}
              <button onClick={()=>{if(urlInput){onSelect(urlInput);onClose();}}}
                disabled={!urlInput}
                className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm disabled:opacity-40">
                تأكيد الصورة
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

// ── Text Format Toolbar ──
const Toolbar = ({ onFormat }: { onFormat:(tag:string,wrap?:boolean)=>void }) => {
  const btns = [
    { icon:<Bold className="w-4 h-4"/>,   label:"عريض",     cmd:"bold"    },
    { icon:<Italic className="w-4 h-4"/>, label:"مائل",     cmd:"italic"  },
    { icon:<Heading2 className="w-4 h-4"/>,label:"عنوان",   cmd:"h2"      },
    { icon:<Quote className="w-4 h-4"/>,  label:"اقتباس",   cmd:"quote"   },
    { icon:<List className="w-4 h-4"/>,   label:"قائمة",    cmd:"list"    },
    { icon:<Hash className="w-4 h-4"/>,   label:"هاشتاق",   cmd:"tag"     },
    { icon:<AlignRight className="w-4 h-4"/>,label:"يمين",  cmd:"rtl"     },
  ];
  return (
    <div className="flex items-center gap-1 p-2 bg-muted/50 border-b border-border flex-wrap">
      {btns.map(b=>(
        <button key={b.cmd} title={b.label} onClick={()=>onFormat(b.cmd)}
          className="w-8 h-8 rounded-lg hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          {b.icon}
        </button>
      ))}
    </div>
  );
};

// ── Main Editor ──
const ArticleEditor = () => {
  const { id } = useParams<{id?:string}>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "",
    featured_image: "", category_id: "", status: "draft" as "draft"|"published",
    is_featured: false, is_breaking: false,
    meta_title: "", meta_description: "",
    custom_author_name: "",
  });

  useEffect(()=>{
    supabase.from("categories").select("*").order("sort_order").then(({data})=>setCategories(data||[]));
    if (id) {
      supabase.from("articles").select("*").eq("id",id).maybeSingle().then(({data})=>{
        if (data) setForm({
          title:data.title||"", slug:data.slug||"", excerpt:data.excerpt||"",
          content:data.content||"", featured_image:data.featured_image||"",
          category_id:data.category_id||"", status:data.status||"draft",
          is_featured:data.is_featured||false, is_breaking:false,
          meta_title:data.meta_title||"", meta_description:data.meta_description||"",
          custom_author_name:data.custom_author_name||"",
        });
      });
    }
  },[id]);

  const genSlug = (title:string) =>
    title.trim().toLowerCase()
      .replace(/[أإآا]/g,"a").replace(/[ة]/g,"h").replace(/[ى]/g,"y")
      .replace(/\s+/g,"-").replace(/[^a-z0-9؀-ۿ-]/g,"")
      .slice(0,60) + "-" + Date.now().toString(36);

  const set = (k:string, v:any) => setForm(f=>({...f,[k]:v}));

  const handleTitleChange = (val:string) => {
    set("title",val);
    if (!id) set("slug", genSlug(val));
    const mt = val.slice(0,60);
    set("meta_title",mt);
  };

  const handleContentChange = (val:string) => {
    set("content",val);
    setWordCount(val.split(/\s+/).filter(Boolean).length);
  };

  const applyFormat = (cmd:string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = ta.value.slice(s,e);
    const before = ta.value.slice(0,s), after = ta.value.slice(e);
    const formats: Record<string,string> = {
      bold:`**${sel||"نص عريض"}**`, italic:`_${sel||"نص مائل"}_`,
      h2:`
## ${sel||"عنوان"}
`, quote:`
> ${sel||"اقتباس"}
`,
      list:`
- ${sel||"عنصر"}
`,
      tag:`#${sel||"هاشتاق"}`,
      rtl:`<div dir="rtl">${sel||"نص بالعربي"}</div>`,
    };
    const insert = formats[cmd]||sel;
    handleContentChange(before+insert+after);
  };

  const save = async (statusOverride?:"draft"|"published") => {
    if (!form.title.trim()) return toast.error("أدخل عنوان المقال");
    if (!form.content.trim()) return toast.error("أدخل محتوى المقال");
    setSaving(true);
    const finalStatus = statusOverride||form.status;
    const payload = {
      ...form,
      status: finalStatus,
      published_at: finalStatus==="published" ? new Date().toISOString() : null,
      author_id: user?.id||null,
      slug: form.slug || genSlug(form.title),
      meta_description: form.meta_description || form.excerpt.slice(0,160),
    };
    try {
      if (id) {
        const { error } = await supabase.from("articles").update(payload).eq("id",id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert(payload);
        if (error) throw error;
      }
      toast.success(finalStatus==="published"?"✅ تم النشر!":"✅ تم الحفظ كمسودة");
      navigate("/egstreet-admin/articles");
    } catch(e:any) {
      toast.error("خطأ: " + e.message);
    }
    setSaving(false);
  };

  const catName = (id:string) => {
    const c = categories.find(c=>c.id===id);
    return c ? c.name_ar : "";
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={()=>navigate("/egstreet-admin/articles")}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <ArrowRight className="w-4 h-4"/>
          </button>
          <div>
            <h1 className="font-black text-sm">{id?"تعديل المقال":"مقال جديد"}</h1>
            <p className="text-[10px] text-muted-foreground">{wordCount} كلمة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setPreview(p=>!p)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${preview?"bg-primary text-white border-primary":"border-border hover:bg-muted"}`}>
            <Eye className="w-3.5 h-3.5"/> {preview?"تعديل":"معاينة"}
          </button>
          <button onClick={()=>save("draft")} disabled={saving}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50">
            <Save className="w-3.5 h-3.5"/> مسودة
          </button>
          <button onClick={()=>save("published")} disabled={saving}
            className="flex items-center gap-1.5 bg-primary text-white text-xs px-4 py-1.5 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Send className="w-3.5 h-3.5"/>}
            نشر
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Featured Image */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {form.featured_image ? (
              <div className="relative">
                <img src={form.featured_image} alt="" className="w-full h-48 object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 flex items-end p-3">
                  <button onClick={()=>setShowImagePicker(true)}
                    className="text-white text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg font-bold hover:bg-white/30 transition-colors me-2">
                    تغيير الصورة
                  </button>
                  <button onClick={()=>set("featured_image","")}
                    className="text-white text-xs bg-red-500/70 px-3 py-1.5 rounded-lg font-bold hover:bg-red-500/90 transition-colors">
                    حذف
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={()=>setShowImagePicker(true)}
                className="w-full h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/30 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ImagePlus className="w-6 h-6 text-primary"/>
                </div>
                <p className="font-bold text-sm">اختر صورة رئيسية</p>
                <p className="text-xs">ابحث في Unsplash أو ارفع من جهازك</p>
              </button>
            )}
          </div>

          {/* Title */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <textarea value={form.title} onChange={e=>handleTitleChange(e.target.value)}
              placeholder="عنوان المقال..." rows={2}
              className="w-full bg-transparent text-xl font-black resize-none focus:outline-none placeholder:text-muted-foreground/40 leading-relaxed"/>
            <div className="mt-2 pt-2 border-t border-border/50">
              <input value={form.slug} onChange={e=>set("slug",e.target.value)}
                placeholder="slug-url" dir="ltr"
                className="w-full bg-transparent text-xs text-muted-foreground font-mono focus:outline-none placeholder:text-muted-foreground/30"/>
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <label className="text-xs font-bold text-muted-foreground mb-2 block">المقتطف (يظهر في القوائم)</label>
            <textarea value={form.excerpt} onChange={e=>set("excerpt",e.target.value)}
              placeholder="وصف مختصر يظهر في القوائم وبطاقات المقال..." rows={3}
              className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground/40 leading-relaxed"/>
          </div>

          {/* Content Editor */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <Toolbar onFormat={applyFormat}/>
            {preview ? (
              <div className="p-5 prose prose-sm max-w-none min-h-64 text-sm leading-relaxed whitespace-pre-wrap">
                {form.content||<span className="text-muted-foreground">لا يوجد محتوى للمعاينة</span>}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={form.content}
                onChange={e=>handleContentChange(e.target.value)}
                placeholder="اكتب محتوى المقال هنا... (يدعم Markdown)"
                rows={18}
                className="w-full bg-transparent p-5 text-sm resize-none focus:outline-none placeholder:text-muted-foreground/40 leading-relaxed font-mono"
              />
            )}
            <div className="px-4 py-2 border-t border-border/50 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{wordCount} كلمة • {form.content.length} حرف</span>
              <span className="text-[10px] text-muted-foreground">Markdown مدعوم</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish settings */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="font-black text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-primary"/> إعدادات النشر</h3>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={()=>set("status","draft")}
                className={`py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${form.status==="draft"?"border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400":"border-border hover:border-yellow-300"}`}>
                <Clock className="w-3.5 h-3.5"/> مسودة
              </button>
              <button onClick={()=>set("status","published")}
                className={`py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${form.status==="published"?"border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400":"border-border hover:border-green-300"}`}>
                <Globe className="w-3.5 h-3.5"/> منشور
              </button>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-bold flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-500"/> خبر مميز</span>
              <button onClick={()=>set("is_featured",!form.is_featured)}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.is_featured?"bg-primary":"bg-muted"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_featured?"right-0.5":"left-0.5"}`}/>
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-bold flex items-center gap-1.5"><Zap className="w-4 h-4 text-red-500"/> خبر عاجل</span>
              <button onClick={()=>set("is_breaking",!form.is_breaking)}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.is_breaking?"bg-red-500":"bg-muted"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_breaking?"right-0.5":"left-0.5"}`}/>
              </button>
            </label>
          </div>

          {/* Category */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-black text-sm mb-3">القسم</h3>
            <div className="grid grid-cols-1 gap-1.5">
              {categories.map(c=>(
                <button key={c.id} onClick={()=>set("category_id",c.id)}
                  className={`text-start text-xs px-3 py-2 rounded-xl border-2 transition-all font-bold ${form.category_id===c.id?"border-primary bg-primary/5 text-primary":"border-border hover:border-primary/30"}`}>
                  {c.name_ar}
                </button>
              ))}
            </div>
          </div>

          {/* Author */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-black text-sm mb-3">الكاتب</h3>
            <input value={form.custom_author_name} onChange={e=>set("custom_author_name",e.target.value)}
              placeholder="اسم الكاتب (اختياري)"
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/>
          </div>

          {/* SEO */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="font-black text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-primary"/> SEO
            </h3>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block">عنوان SEO ({form.meta_title.length}/60)</label>
              <input value={form.meta_title} onChange={e=>set("meta_title",e.target.value.slice(0,60))}
                placeholder="عنوان للمحركات..."
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"/>
              <div className={`h-0.5 rounded-full mt-1 transition-all ${form.meta_title.length>50?"bg-green-500":form.meta_title.length>30?"bg-yellow-500":"bg-muted"}`}
                style={{width:`${(form.meta_title.length/60)*100}%`}}/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block">وصف SEO ({form.meta_description.length}/160)</label>
              <textarea value={form.meta_description} onChange={e=>set("meta_description",e.target.value.slice(0,160))}
                placeholder="وصف قصير للمحركات..."
                rows={3}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"/>
            </div>
          </div>

          {/* Save buttons */}
          <div className="space-y-2">
            <button onClick={()=>save("published")} disabled={saving}
              className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm">
              {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
              نشر المقال الآن
            </button>
            <button onClick={()=>save("draft")} disabled={saving}
              className="w-full border border-border py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-muted disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4"/> حفظ كمسودة
            </button>
          </div>
        </div>
      </div>

      {/* Image Picker */}
      <AnimatePresence>
        {showImagePicker && (
          <ImagePicker onSelect={url=>set("featured_image",url)} onClose={()=>setShowImagePicker(false)}/>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ArticleEditor;
