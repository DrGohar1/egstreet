import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogoUploaderProps {
  label: string;
  currentUrl: string;
  settingKey: string;
  onUploaded: (url: string) => void;
}

const LogoUploader = ({ label, currentUrl, settingKey, onUploaded }: LogoUploaderProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: t("يجب رفع صورة", "Must upload an image"), variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${settingKey}.${ext}`;

    // Delete old file if exists
    await supabase.storage.from("site-assets").remove([filePath]);

    const { error } = await supabase.storage.from("site-assets").upload(filePath, file, { upsert: true });

    if (error) {
      toast({ title: t("فشل الرفع", "Upload failed"), variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(filePath);
    onUploaded(urlData.publicUrl);
    setUploading(false);
    toast({ title: t("تم الرفع بنجاح", "Uploaded successfully") });
  };

  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1 space-y-2">
        {currentUrl && (
          <div className="relative inline-block p-2 bg-muted rounded border border-border">
            <img src={currentUrl} alt="" className="max-h-16 object-contain" />
            <button
              type="button"
              onClick={() => onUploaded("")}
              className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="text-xs"
          />
          {uploading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoUploader;
