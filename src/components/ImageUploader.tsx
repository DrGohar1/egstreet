import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon, Check, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploaderProps {
  currentUrl?: string;
  bucket?: string;
  folder?: string;
  onUploaded: (url: string) => void;
  onCancel?: () => void;
  label?: string;
  maxSizeMB?: number;
}

export default function ImageUploader({
  currentUrl = "",
  bucket = "media",
  folder = "avatars",
  onUploaded,
  onCancel,
  label = "صورة الملف الشخصي",
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]   = useState<string>(currentUrl);
  const [file,    setFile]      = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,   setError]     = useState("");
  const [done,    setDone]      = useState(false);

  const handleFile = useCallback((f: File) => {
    setError("");
    setDone(false);
    if (!f.type.startsWith("image/")) { setError("الملف المختار ليس صورة"); return; }
    if (f.size > maxSizeMB * 1024 * 1024) { setError(`الحجم يتجاوز ${maxSizeMB}MB`); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, [maxSizeMB]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError("");
    try {
      const ext  = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const name = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      // Use standard upload (Supabase JS client handles TUS for files > 6MB)
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(name, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (upErr) throw upErr;

      setProgress(100);
      const { data } = supabase.storage.from(bucket).getPublicUrl(name);
      setDone(true);
      onUploaded(data.publicUrl);
    } catch (e: any) {
      setError(e.message || "فشل الرفع، تأكد من إعداد bucket المخزون في Supabase");
    } finally {
      setUploading(false);
    }
  };

  const clear = () => { setPreview(currentUrl); setFile(null); setDone(false); setError(""); };

  return (
    <div className="space-y-3 w-full" dir="rtl">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed
          cursor-pointer transition-all overflow-hidden
          ${preview ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}
          ${uploading ? "pointer-events-none" : ""}`}
        style={{ minHeight: 140 }}
      >
        {preview ? (
          <>
            <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-100"/>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white"/>
            </div>
          </>
        ) : (
          <>
            <Upload className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors"/>
            <p className="text-xs text-muted-foreground group-hover:text-primary text-center px-4">
              اسحب صورة أو انقر للاختيار
              <br/>
              <span className="text-[10px] opacity-60">JPG، PNG، WebP — حتى {maxSizeMB}MB</span>
            </p>
          </>
        )}

        {/* Progress bar */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3"
            >
              <Loader2 className="w-8 h-8 text-white animate-spin"/>
              <div className="w-2/3 bg-white/20 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-white h-1.5 rounded-full"
                />
              </div>
              <p className="text-xs text-white/80">جارٍ الرفع...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Done badge */}
        {done && !uploading && (
          <div className="absolute top-2 end-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <Check className="w-4 h-4 text-white"/>
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f); }}/>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Actions */}
      {file && !uploading && !done && (
        <div className="flex gap-2">
          <button onClick={upload}
            className="flex-1 bg-primary text-white text-xs font-black py-2.5 rounded-xl hover:bg-primary/85 transition-colors flex items-center justify-center gap-1.5">
            <Upload className="w-3.5 h-3.5"/>رفع الصورة
          </button>
          <button onClick={clear}
            className="w-10 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground"/>
          </button>
        </div>
      )}

      {done && (
        <button onClick={clear}
          className="w-full border border-border text-muted-foreground text-xs py-2 rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5"/>تغيير الصورة
        </button>
      )}

      {onCancel && !file && (
        <button onClick={onCancel}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
          إلغاء
        </button>
      )}
    </div>
  );
}
