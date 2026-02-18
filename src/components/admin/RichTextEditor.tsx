import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  ImageIcon, Link as LinkIcon, Quote, Undo, Redo, Code, Minus, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const ToolbarButton = ({
  onClick, active, children, title,
}: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "p-1.5 rounded hover:bg-muted transition-colors",
      active && "bg-primary/10 text-primary"
    )}
  >
    {children}
  </button>
);

const RichTextEditor = ({ content, onChange, placeholder }: RichTextEditorProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Placeholder.configure({ placeholder: placeholder || t("ابدأ الكتابة...", "Start writing...") }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose max-w-none min-h-[300px] p-4 focus:outline-none text-foreground",
      },
    },
  });

  if (!editor) return null;

  const addImage = () => {
    if (imageUrl.trim()) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `editor/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(filePath, file);
    if (error) {
      toast({ title: t("فشل الرفع", "Upload failed"), variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(filePath);
    editor.chain().focus().setImage({ src: urlData.publicUrl }).run();
    setUploading(false);
  };

  const addLink = () => {
    if (linkUrl.trim()) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
    }
  };

  const iconSize = "h-4 w-4";

  return (
    <div className="border border-input rounded-md bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough className={iconSize} />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}>
          <Heading1 className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
          <Heading2 className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
          <Heading3 className={iconSize} />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}>
          <AlignRight className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}>
          <AlignCenter className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}>
          <AlignLeft className={iconSize} />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          <List className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          <ListOrdered className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
          <Quote className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}>
          <Code className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className={iconSize} />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Image popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded hover:bg-muted transition-colors" title="Image">
              <ImageIcon className={iconSize} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 space-y-2">
            <Input placeholder={t("رابط الصورة", "Image URL")} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <Button size="sm" onClick={addImage} className="w-full">{t("إدراج رابط", "Insert URL")}</Button>
            <div className="relative">
              <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="text-xs" />
              {uploading && <div className="absolute inset-0 flex items-center justify-center bg-background/50"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" /></div>}
            </div>
          </PopoverContent>
        </Popover>

        {/* Link popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive("link") && "bg-primary/10 text-primary")} title="Link">
              <LinkIcon className={iconSize} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 space-y-2">
            <Input placeholder={t("رابط URL", "URL")} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={addLink} className="flex-1">{t("إدراج", "Insert")}</Button>
              {editor.isActive("link") && (
                <Button size="sm" variant="outline" onClick={() => editor.chain().focus().unsetLink().run()}>
                  {t("إزالة", "Remove")}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
          <Undo className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
          <Redo className={iconSize} />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
