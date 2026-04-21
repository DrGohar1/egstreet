import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Trash2, Download, Users } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
}

const SubscriberManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscribers = async () => {
    const { data } = await supabase
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSubscribers(data);
    setLoading(false);
  };

  useEffect(() => { fetchSubscribers(); }, []);

  const handleDelete = async (id: string) => {
    await supabase.from("subscribers").delete().eq("id", id);
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
    toast({ title: t("تم الحذف", "Deleted") });
  };

  const exportCSV = () => {
    const csv = "Email,Date\n" + subscribers.map((s) => `${s.email},${new Date(s.created_at).toLocaleDateString()}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{t("المشتركون", "Subscribers")}</h2>
        <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          {t("تصدير CSV", "Export CSV")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />{t("إجمالي المشتركين", "Total Subscribers")}</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{subscribers.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" />{t("نشطون", "Active")}</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{subscribers.filter((s) => s.is_active).length}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("البريد الإلكتروني", "Email")}</TableHead>
                <TableHead>{t("الحالة", "Status")}</TableHead>
                <TableHead>{t("تاريخ الاشتراك", "Date")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.email}</TableCell>
                  <TableCell>
                    <Badge variant={sub.is_active ? "default" : "secondary"}>
                      {sub.is_active ? t("نشط", "Active") : t("ملغي", "Inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(sub.created_at).toLocaleDateString("ar-EG")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {subscribers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {t("لا يوجد مشتركون بعد", "No subscribers yet")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriberManagement;
