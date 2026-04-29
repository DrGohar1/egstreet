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
/* ── Image Crop Helper ── */
type CropBox = { x:number; y:number; w:number; h:number };

const ImageCropModal = ({ src, onDone, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<CropBox>({x:0,y:0,w:100,h:100});
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({x:0,y:0});
  const [imgLoaded, setImgLoaded] = useState(false);
  const [aspect, setAspect] = useState<"free"|"16:9"|"4:3"|"1:1">("16:9");

  const ASPECTS:Record<string,number|null> = { "free":null, "16:9":16/9, "4:3":4/3, "1:1":1 };

  const applyCrop = () => {
    const img = imgRef.current; const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    canvas.width  = crop.w * scaleX;
    canvas.height = crop.h * scaleY;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, crop.x*scaleX, crop.y*scaleY, crop.w*scaleX, crop.h*scaleY, 0, 0, canvas.width, canvas.height);
    onDone(canvas.toDataURL("image/jpeg", 0.92));
  };

  const onMouseDown = (e:React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    setDragging(true); setStart({x,y});
    setCrop({x, y, w:0, h:0});
  };
  const onMouseMove = (e:React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    let w = x - start.x; let h = y - start.y;
    const asp = ASPECTS[aspect];
    if (asp) h = w / asp;
    setCrop({x:Math.min(start.x,x), y:Math.min(start.y,y), w:Math.abs(w), h:Math.abs(h)});
  };
  const onMouseUp = () => setDragging(false);

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card rounded-2xl p-4 max-w-2xl w-full space-y-3" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h4 className="font-black text-sm flex items-center gap-2">✂️ قص الصورة</h4>
          <div className="flex gap-1">
            {(["free","16:9","4:3","1:1"] as const).map(a=>(
              <button key={a} onClick={()=>setAspect(a)}
                className={`text-[10px] px-2 py-1 rounded-lg border font-bold transition-all ${aspect===a?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl select-none cursor-crosshair"
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
          <img ref={imgRef} src={src} alt="" crossOrigin="anonymous" className="w-full max-h-80 object-contain"
            onLoad={()=>setImgLoaded(true)}/>
          {crop.w>0 && crop.h>0 && (
            <div className="absolute border-2 border-primary bg-primary/10" style={{
              left:crop.x, top:crop.y, width:crop.w, height:crop.h, pointerEvents:"none"
            }}/>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden"/>
        <div className="flex gap-2">
          <button onClick={applyCrop} className="flex-1 bg-primary text-white py-2 rounded-xl font-black text-sm hover:bg-primary/85 transition-colors">
            تطبيق القص
          </button>
          <button onClick={onCancel} className="px-4 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

const ImagePicker = ({ onSelect, onClose }) => {
  const [tab,       setTab]       = useState<"unsplash"|"upload"|"url">("unsplash");
  const [query,     setQuery]     = useState("egypt news");
  const [images,    setImages]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [urlInput,  setUrlInput]  = useState("");
  const [uploading, setUploading] = useState(false);
  const [cropSrc,   setCropSrc]   = useState<string|null>(null);
  const [pendingSelect, setPendingSelect] = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const searchUnsplash = async (q:string) => {
    if (!q.trim()) return;
    setLoading(true);
    setImages([]);
    try {
      const r = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=20&orientation=landscape&content_filter=high`,
        { headers:{ Authorization:`Client-ID ${UNSPLASH_KEY}` } }
      );
      if (!r.ok) throw new Error(`${r.status}`);
      const data = await r.json();
      if (!data.results?.length) throw new Error("no results");
      setImages(data.results);
    } catch(e) {
      // Fallback to Pexels-style random images
      setImages(Array.from({length:16},(_,i)=>({
        id:`fallback_${i}`,
        urls:{ small:`https://picsum.photos/seed/${encodeURIComponent(q)}${i}/400/250`, regular:`https://picsum.photos/seed/${encodeURIComponent(q)}${i}/1200/750` },
        alt_description:`${q} ${i+1}`, user:{ name:"Picsum Photos" }
      })));
    }
    setLoading(false);
  };

  const handleUpload = async (file:File) => {
    setUploading(true);
    try {
      if (!file.type.startsWith("image/")) throw new Error("الملف ليس صورة");
      if (file.size > 10 * 1024 * 1024) throw new Error("الصورة أكبر من 10MB");
      const ext  = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `articles/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert:true, contentType: file.type, cacheControl:"3600" });
      if (error) {
        // Bucket may not exist yet — use blob URL as temporary preview
        if (error.message?.includes("bucket") || error.message?.includes("not found") || error.statusCode===404) {
          const url = URL.createObjectURL(file);
          onSelect(url);
          toast.warning("الـ bucket غير موجود — تم الاختيار كـ preview مؤقت. أنشئ bucket باسم 'media' في Supabase Storage.");
          return;
        }
        throw error;
      }
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onSelect(data.publicUrl);
      toast.success("تم رفع الصورة بنجاح ✓");
    } catch(e:any) {
      const url = URL.createObjectURL(file);
      onSelect(url);
      toast.error(`فشل الرفع: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  useEffect(()=>{ searchUnsplash("egypt news مصر"); },[]);

  return (
    <>
    {cropSrc && <ImageCropModal src={cropSrc} onDone={url=>{ onSelect(url); setCropSrc(null); onClose(); }} onCancel={()=>setCropSrc(null)}/>}
    <div style={{display: cropSrc ? "none" : undefined}}>
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
                  <div key={img.id} className="relative group overflow-hidden rounded-xl aspect-video">
                    <img src={img.urls.small} alt={img.alt_description||""} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-1">
                      <button onClick={()=>{onSelect(img.urls.regular||img.urls.small); onClose();}}
                        className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-black bg-primary px-2 py-1 rounded-lg transition-all">
                        اختر
                      </button>
                      <button onClick={()=>{ setPendingSelect(img.urls.regular||img.urls.small); setCropSrc(img.urls.regular||img.urls.small); }}
                        className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-black bg-black/70 px-2 py-1 rounded-lg transition-all">
                        ✂️ قص
                      </button>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 p-1">
                      <p className="text-white text-[8px] truncate">{img.user?.name}</p>
                    </div>
                  </div>
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
    </div>
  </>
  );
};

// ── Text Format Toolbar ──
const Toolbar = ({ onFormat }) => {
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
    scheduled_at: "",
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
          scheduled_at: data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0,16) : "",
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { scheduled_at: _sched, ...formData } = form;
    const payload = {
      ...formData,
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
      navigate("/G63-admin/articles");
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
          <button onClick={()=>navigate("/G63-admin/articles")}
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
            {/* Scheduled publish */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3"/> جدولة النشر
              </label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e=>setForm(f=>({...f,scheduled_at:e.target.value}))}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {form.scheduled_at && (
                <button onClick={()=>save("draft")} disabled={saving}
                  className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-600 disabled:opacity-50 transition-colors">
                  <Clock className="w-4 h-4"/> جدولة النشر
                </button>
              )}
            </div>
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
