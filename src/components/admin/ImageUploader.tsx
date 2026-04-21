import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, Loader2, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

const ImageUploader = ({ value, onChange, label, className }: ImageUploaderProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: t("الملف ليس صورة", "File is not an image"), variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("الصورة أكبر من 5MB", "Image must be under 5MB"), variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(filePath, file, { upsert: false });
    if (error) {
      toast({ title: t("فشل الرفع", "Upload failed"), description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("site-assets").getPublicUrl(filePath);
      onChange(data.publicUrl);
      toast({ title: t("✅ تم رفع الصورة", "✅ Image uploaded") });
    }
    setUploading(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  };

  const handleUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith("http")) {
      toast({ title: t("رابط غير صالح", "Invalid URL"), variant: "destructive" });
      return;
    }
    onChange(url);
    setUrlInput("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && <Label className="text-sm font-bold">{label}</Label>}

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-border">
          <img src={value} alt="featured" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => onChange("")} className="text-xs gap-1">
              <X className="h-3 w-3" />
              {t("إزالة", "Remove")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} className="text-xs gap-1">
              <Upload className="h-3 w-3" />
              {t("تغيير", "Change")}
            </Button>
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
        </div>
      ) : (
        <Tabs defaultValue="upload">
          <TabsList className="h-8 text-xs w-full">
            <TabsTrigger value="upload" className="flex-1 text-xs gap-1">
              <Upload className="h-3 w-3" />{t("رفع صورة", "Upload")}
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1 text-xs gap-1">
              <LinkIcon className="h-3 w-3" />{t("رابط", "URL")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-2">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !uploading && inputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">{t("جارٍ الرفع...", "Uploading...")}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{t("اسحب الصورة هنا أو اضغط للاختيار", "Drag image here or click to select")}</p>
                  <p className="text-xs text-muted-foreground">{t("PNG, JPG, WebP — أقل من 5MB", "PNG, JPG, WebP — under 5MB")}</p>
                </div>
              )}
              <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-2">
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleUrl()}
              />
              <Button onClick={handleUrl} size="sm" className="shrink-0">
                {t("إضافة", "Add")}
              </Button>
            </div>
            {urlInput && (
              <div className="mt-2 rounded-lg overflow-hidden border border-border">
                <img src={urlInput} alt="preview" className="w-full h-32 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ImageUploader;
