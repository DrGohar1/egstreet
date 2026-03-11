import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, FileText, Tag, Layers, Loader2, Shield, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const TABLES = [
  { key: "articles", icon: FileText, ar: "المقالات", en: "Articles" },
  { key: "categories", icon: Layers, ar: "الأقسام", en: "Categories" },
  { key: "tags", icon: Tag, ar: "الوسوم", en: "Tags" },
  { key: "site_settings", icon: Database, ar: "الإعدادات", en: "Settings" },
  { key: "pages", icon: FileText, ar: "الصفحات", en: "Pages" },
] as const;

type TableKey = typeof TABLES[number]["key"];

const BackupRestore = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const exportTable = async (table: TableKey, format: "json" | "csv") => {
    setExporting(table);
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;
      if (!data || data.length === 0) {
        toast({ title: t("لا توجد بيانات للتصدير", "No data to export") });
        setExporting(null);
        return;
      }

      let content: string;
      let mimeType: string;
      let ext: string;

      if (format === "csv") {
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(h => JSON.stringify((row as any)[h] ?? "")).join(","));
        content = [headers.join(","), ...rows].join("\n");
        mimeType = "text/csv";
        ext = "csv";
      } else {
        content = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        ext = "json";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table}_backup_${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: t(`تم تصدير ${table} بنجاح`, `${table} exported successfully`) });
    } catch (e: any) {
      toast({ title: t("خطأ في التصدير", "Export error"), description: e.message, variant: "destructive" });
    }
    setExporting(null);
  };

  const exportAll = async () => {
    setExporting("all");
    try {
      const allData: Record<string, any> = {};
      for (const table of TABLES) {
        const { data } = await supabase.from(table.key).select("*");
        allData[table.key] = data || [];
      }
      const content = JSON.stringify(allData, null, 2);
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `full_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("تم تصدير النسخة الاحتياطية الكاملة", "Full backup exported") });
    } catch (e: any) {
      toast({ title: t("خطأ", "Error"), description: e.message, variant: "destructive" });
    }
    setExporting(null);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Check if it's a full backup (object with table keys) or single table (array)
      if (Array.isArray(data)) {
        toast({ title: t("استخدم ملف نسخة احتياطية كاملة", "Use a full backup file"), variant: "destructive" });
      } else {
        let restored = 0;
        for (const [table, rows] of Object.entries(data)) {
          if (Array.isArray(rows) && rows.length > 0 && TABLES.some(t => t.key === table)) {
            const { error } = await supabase.from(table as TableKey).upsert(rows as any[], { onConflict: "id" });
            if (!error) restored++;
          }
        }
        toast({ title: t(`تم استعادة ${restored} جداول`, `${restored} tables restored`) });
      }
    } catch (e: any) {
      toast({ title: t("خطأ في الاستيراد", "Import error"), description: e.message, variant: "destructive" });
    }
    setImporting(false);
    e.target.value = "";
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="rounded-2xl bg-gradient-to-l from-secondary to-secondary/80 p-6 text-secondary-foreground">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-black">{t("النسخ الاحتياطي والاستعادة", "Backup & Restore")}</h1>
            <p className="text-sm opacity-80">{t("صدّر بياناتك واستعدها في أي وقت", "Export your data and restore anytime")}</p>
          </div>
        </div>
      </div>

      {/* Full Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {t("نسخة احتياطية كاملة", "Full Backup")}
          </CardTitle>
          <CardDescription>{t("صدّر جميع الجداول في ملف واحد", "Export all tables in one file")}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button onClick={exportAll} disabled={!!exporting} className="gap-2">
            {exporting === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t("تصدير كامل JSON", "Export Full JSON")}
          </Button>
          <div className="relative">
            <Button variant="outline" className="gap-2" disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {t("استعادة من ملف", "Restore from File")}
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={importing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-Table Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TABLES.map(table => {
          const Icon = table.icon;
          return (
            <Card key={table.key}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{language === "ar" ? table.ar : table.en}</p>
                    <p className="text-[10px] text-muted-foreground">{table.key}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1 text-xs"
                    onClick={() => exportTable(table.key, "json")}
                    disabled={exporting === table.key}
                  >
                    {exporting === table.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1 text-xs"
                    onClick={() => exportTable(table.key, "csv")}
                    disabled={exporting === table.key}
                  >
                    {exporting === table.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
};

export default BackupRestore;
