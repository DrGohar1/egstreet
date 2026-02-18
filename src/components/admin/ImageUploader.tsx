import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, ImageIcon, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

const ImageUploader = ({ value, onChange, placeholder, className }: ImageUploaderProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: t("يجب رفع صورة", "Must upload an image"), variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("الحد الأقصى 5 ميجا", "Max 5MB"), variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("site-assets").upload(filePath, file);

    if (error) {
      toast({ title: t("فشل الرفع", "Upload failed"), description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(filePath);
    onChange(urlData.publicUrl);
    setUploading(false);
    toast({ title: t("تم الرفع بنجاح", "Uploaded successfully") });
  };

  return (
    <div className={className}>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img src={value} alt="" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 end-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-md"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border p-6 text-center bg-muted/20 hover:border-primary/50 transition-colors">
          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground mb-3">{t("أضف صورة رئيسية للمقال", "Add a featured image")}</p>

          <div className="flex items-center justify-center gap-2 mb-3">
            <Button
              type="button"
              variant={mode === "upload" ? "default" : "outline"}
              size="sm"
              className="gap-1 text-xs rounded-lg"
              onClick={() => setMode("upload")}
            >
              <Upload className="h-3 w-3" />
              {t("رفع صورة", "Upload")}
            </Button>
            <Button
              type="button"
              variant={mode === "url" ? "default" : "outline"}
              size="sm"
              className="gap-1 text-xs rounded-lg"
              onClick={() => setMode("url")}
            >
              <LinkIcon className="h-3 w-3" />
              {t("رابط", "URL")}
            </Button>
          </div>

          {mode === "upload" ? (
            <div className="flex items-center justify-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="max-w-xs text-xs"
              />
              {uploading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary shrink-0" />
              )}
            </div>
          ) : (
            <Input
              placeholder={placeholder || t("رابط الصورة", "Image URL")}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="max-w-md mx-auto text-sm rounded-xl"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
