import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  ImageIcon, Link as LinkIcon, Quote, Undo, Redo,
  Code, Minus, Upload, Copy, Check, AlignJustify,
  MoveLeft, MoveRight, Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const Btn = ({ onClick, active, children, title }: {
  onClick: () => void; active?: boolean; children: React.ReactNode; title?: string;
}) => (
  <button type="button" onClick={onClick} title={title}
    className={cn("p-1.5 rounded hover:bg-muted transition-colors text-foreground",
      active && "bg-primary/10 text-primary")}>
    {children}
  </button>
);

const Sep = () => <div className="w-px h-5 bg-border mx-0.5 shrink-0"/>;

export const RichTextEditor = ({ content, onChange, placeholder }: RichTextEditorProps) => {
  const { t } = useLanguage();
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl,  setLinkUrl]  = useState("");
  const [uploading, setUploading] = useState(false);
  const [imgPanel, setImgPanel] = useState(false);
  const [lnkPanel, setLnkPanel] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1,2,3] } }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: { class: "editor-img" },
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      TextAlign.configure({ types: ["heading","paragraph","image"] }),
      Underline,
      Placeholder.configure({ placeholder: placeholder || "ابدأ الكتابة..." }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "article-body min-h-[350px] p-4 focus:outline-none",
        dir: "rtl",
      },
    },
  });

  if (!editor) return null;

  // Insert image by URL
  const insertImgUrl = () => {
    if (imageUrl.trim()) {
      editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
      setImageUrl(""); setImgPanel(false);
    }
  };

  // Upload image
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `editor/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file);
    if (error) { toast.error("فشل رفع الصورة"); setUploading(false); return; }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    editor.chain().focus().setImage({ src: data.publicUrl }).run();
    // Copy URL to clipboard
    await navigator.clipboard.writeText(data.publicUrl).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2000);
    setUploading(false); setImgPanel(false);
    e.target.value = "";
  };

  // Float image left / center / right via class
  const setImgFloat = (align: "right"|"center"|"left") => {
    editor.chain().focus().setTextAlign(align).run();
  };

  const addLink = () => {
    if (linkUrl.trim()) {
      editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
      setLinkUrl(""); setLnkPanel(false);
    }
  };

  const S = "h-3.5 w-3.5";

  return (
    <div className="border border-border rounded-xl bg-background overflow-hidden">
      {/* ─ Toolbar ─ */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30" dir="rtl">

        {/* History */}
        <Btn onClick={()=>editor.chain().focus().undo().run()} title="تراجع"><Undo className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().redo().run()} title="إعادة"><Redo className={S}/></Btn>
        <Sep/>

        {/* Headings */}
        <Btn onClick={()=>editor.chain().focus().toggleHeading({level:1}).run()} active={editor.isActive("heading",{level:1})} title="عنوان 1"><Heading1 className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().toggleHeading({level:2}).run()} active={editor.isActive("heading",{level:2})} title="عنوان 2"><Heading2 className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().toggleHeading({level:3}).run()} active={editor.isActive("heading",{level:3})} title="عنوان 3"><Heading3 className={S}/></Btn>
        <Sep/>

        {/* Text style */}
        <Btn onClick={()=>editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="عريض"><Bold className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="مائل"><Italic className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="تسطير"><UnderlineIcon className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="شطب"><Strikethrough className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="كود"><Code className={S}/></Btn>
        <Sep/>

        {/* Lists */}
        <Btn onClick={()=>editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="قائمة"><List className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="قائمة مرقمة"><ListOrdered className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="اقتباس"><Quote className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().setHorizontalRule().run()} title="فاصل"><Minus className={S}/></Btn>
        <Sep/>

        {/* Align */}
        <Btn onClick={()=>editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({textAlign:"right"})} title="يمين"><AlignRight className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({textAlign:"center"})} title="وسط"><AlignCenter className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({textAlign:"left"})} title="يسار"><AlignLeft className={S}/></Btn>
        <Btn onClick={()=>editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({textAlign:"justify"})} title="ضبط"><AlignJustify className={S}/></Btn>
        <Sep/>

        {/* Image */}
        <div className="relative">
          <Btn onClick={()=>setImgPanel(p=>!p)} title="إدراج صورة"><ImageIcon className={S}/></Btn>
          {imgPanel && (
            <div className="absolute top-8 right-0 z-30 bg-card border border-border rounded-xl shadow-lg p-3 min-w-[260px] space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground">رابط صورة (URL)</p>
              <div className="flex gap-1">
                <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&insertImgUrl()}
                  placeholder="https://..." dir="ltr"
                  className="flex-1 text-xs px-2 py-1.5 border border-border rounded-lg bg-muted focus:outline-none focus:border-primary"/>
                <button type="button" onClick={insertImgUrl}
                  className="px-2 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary/85">إدراج</button>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-px flex-1 bg-border"/>
                <span className="text-[10px] text-muted-foreground">أو</span>
                <div className="h-px flex-1 bg-border"/>
              </div>
              <button type="button" onClick={()=>fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-1.5 border border-dashed border-border rounded-lg text-xs hover:bg-muted transition-colors">
                {uploading ? "جاري الرفع..." : <><Upload className="w-3.5 h-3.5"/> رفع صورة من جهازك</>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload}/>
              {copied && (
                <p className="text-[10px] text-green-600 flex items-center gap-1"><Check className="w-3 h-3"/> تم نسخ رابط الصورة تلقائياً</p>
              )}
              <div className="border-t border-border pt-2">
                <p className="text-[10px] text-muted-foreground mb-1.5">محاذاة الصورة المحددة</p>
                <div className="flex gap-1">
                  <button type="button" onClick={()=>setImgFloat("right")} className="flex-1 py-1 text-[10px] border border-border rounded hover:bg-muted">يمين</button>
                  <button type="button" onClick={()=>setImgFloat("center")} className="flex-1 py-1 text-[10px] border border-border rounded hover:bg-muted">وسط</button>
                  <button type="button" onClick={()=>setImgFloat("left")} className="flex-1 py-1 text-[10px] border border-border rounded hover:bg-muted">يسار</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Link */}
        <div className="relative">
          <Btn onClick={()=>setLnkPanel(p=>!p)} active={editor.isActive("link")} title="رابط"><LinkIcon className={S}/></Btn>
          {lnkPanel && (
            <div className="absolute top-8 right-0 z-30 bg-card border border-border rounded-xl shadow-lg p-3 min-w-[240px] space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground">رابط URL</p>
              <div className="flex gap-1">
                <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&addLink()}
                  placeholder="https://..." dir="ltr"
                  className="flex-1 text-xs px-2 py-1.5 border border-border rounded-lg bg-muted focus:outline-none focus:border-primary"/>
                <button type="button" onClick={addLink}
                  className="px-2 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary/85">ربط</button>
              </div>
              <button type="button" onClick={()=>editor.chain().focus().unsetLink().run()}
                className="w-full py-1 text-[10px] text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10">
                إزالة الرابط
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─ Editor area ─ */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
