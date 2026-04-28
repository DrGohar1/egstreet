import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Image, Upload, Trash2, Copy, Check, Loader2, X } from "lucide-react";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  created_at: string;
  size?: number;
}

export default function MediaManagement() {
  const { user } = useAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const BUCKET = "article-images";

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      limit: 100, sortBy: { column: "created_at", order: "desc" }
    });
    if (!error && data) {
      setFiles(data.map(f => ({
        id: f.id || f.name,
        name: f.name,
        url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
        created_at: f.created_at || "",
        size: f.metadata?.size,
      })).filter(f => !f.name.startsWith(".")));
    }
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, []);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) toast.error(`فشل رفع ${file.name}: ${error.message}`);
      else toast.success(`✅ تم رفع ${file.name}`);
    }
    setUploading(false);
    fetchFiles();
    e.target.value = "";
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  };

  const deleteFile = async (name: string) => {
    setDeleting(name);
    const { error } = await supabase.storage.from(BUCKET).remove([name]);
    if (error) toast.error(`فشل الحذف: ${error.message}`);
    else { toast.success("✅ تم الحذف"); fetchFiles(); }
    setDeleting(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Image className="w-7 h-7 text-primary"/> مكتبة الوسائط
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{files.length} ملف في المكتبة</p>
        </div>
        <label className={`flex items-center gap-2 bg-primary text-white font-bold px-4 py-2.5 rounded-xl cursor-pointer hover:bg-primary/85 transition-colors shadow-sm ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
          {uploading ? "جارٍ الرفع..." : "رفع صور"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={upload} disabled={uploading}/>
        </label>
      </div>

      {loading
        ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
        : files.length === 0
          ? <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Image className="w-16 h-16 opacity-20"/>
              <p className="font-bold">لا توجد صور بعد — ارفع أول صورة!</p>
            </div>
          : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map(f => (
                <div key={f.id} className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all">
                  <div className="aspect-square">
                    <img src={f.url} alt={f.name} className="w-full h-full object-cover"/>
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-muted-foreground truncate">{f.name}</p>
                    {f.size && <p className="text-[9px] text-muted-foreground">{(f.size/1024).toFixed(1)} KB</p>}
                  </div>
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => copyUrl(f.url)}
                      className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white" title="نسخ الرابط">
                      {copied === f.url ? <Check className="w-4 h-4 text-green-400"/> : <Copy className="w-4 h-4"/>}
                    </button>
                    <button onClick={() => deleteFile(f.name)} disabled={deleting === f.name}
                      className="w-9 h-9 rounded-xl bg-red-500/80 hover:bg-red-600 flex items-center justify-center transition-colors text-white" title="حذف">
                      {deleting === f.name ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  );
}
