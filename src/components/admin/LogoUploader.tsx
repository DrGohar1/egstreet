import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Check, Loader2, Image } from "lucide-react";
import { toast } from "sonner";

const SUPA = "https://neojditfucitnovcfspw.supabase.co";

interface LogoUploaderProps {
  currentUrl?: string;
  settingKey?: string;
  label?: string;
  onUploaded?: (url: string) => void;
}

export default function LogoUploader({
  currentUrl, settingKey = "site_logo", label = "لوجو الموقع", onUploaded
}: LogoUploaderProps) {
  const [preview,  setPreview]  = useState<string>(currentUrl || "");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("الملف يجب أن يكون صورة"); return; }
    if (file.size > 5 * 1024 * 1024)     { toast.error("الحجم الأقصى 5 MB");       return; }
    setLoading(true); setSuccess(false);
    try {
      const ext  = file.name.split(".").pop() || "jpg";
      const name = `${settingKey}.${ext}`;
      // Upload to site-assets bucket
      const { error: upErr } = await supabase.storage
        .from("site-assets").upload(name, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(name);
      const publicUrl = urlData.publicUrl + "?t=" + Date.now();

      // Save to site_settings
      await supabase.from("site_settings").upsert({ key: settingKey, value: publicUrl }, { onConflict: "key" });

      setPreview(publicUrl);
      setSuccess(true);
      onUploaded?.(publicUrl);
      toast.success(`✅ تم رفع ${label} بنجاح`);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      toast.error(e.message || "فشل الرفع");
    } finally { setLoading(false); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-muted-foreground">{label}</label>

      {/* Preview */}
      {preview && (
        <div className="relative inline-block">
          <img src={preview} alt={label} className="h-20 w-20 rounded-2xl object-cover border-2 border-border shadow"/>
          <button onClick={() => { setPreview(""); supabase.from("site_settings").update({ value: "" }).eq("key", settingKey); }}
            className="absolute -top-2 -end-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors shadow">
            <X className="w-3 h-3"/>
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e=>e.preventDefault()} onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}/>
        {loading
          ? <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto"/>
          : success
            ? <Check className="w-8 h-8 text-green-500 mx-auto"/>
            : <Image className="w-8 h-8 text-muted-foreground group-hover:text-primary mx-auto transition-colors"/>
        }
        <p className="text-xs text-muted-foreground mt-2">
          {loading ? "جارٍ الرفع..." : success ? "تم الرفع ✅" : "اسحب الصورة هنا أو اضغط للاختيار"}
        </p>
        <p className="text-[10px] text-muted-foreground/50 mt-1">PNG, JPG, WebP — حجم أقصى 5 MB</p>
      </div>
    </div>
  );
}
