import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Trash2, MessageSquare } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  article_id: string;
  status: string;
  created_at: string;
  article_title?: string;
  user_name?: string;
}

const CommentManagement = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const articleIds = [...new Set(data.map((c: any) => c.article_id))];
      const userIds = [...new Set(data.map((c: any) => c.user_id))];

      const [artRes, profRes] = await Promise.all([
        supabase.from("articles").select("id, title").in("id", articleIds),
        supabase.from("profiles").select("user_id, display_name").in("user_id", userIds),
      ]);

      const artMap: Record<string, string> = {};
      artRes.data?.forEach((a: any) => { artMap[a.id] = a.title; });
      const profMap: Record<string, string> = {};
      profRes.data?.forEach((p: any) => { profMap[p.user_id] = p.display_name; });

      setComments(data.map((c: any) => ({
        ...c,
        article_title: artMap[c.article_id] || "—",
        user_name: profMap[c.user_id] || "—",
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("comments").update({ status }).eq("id", id);
    if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("تم التحديث", "Updated") });
    fetchComments();
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) { toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("تم الحذف", "Deleted") });
    fetchComments();
  };

  const pending = comments.filter((c) => c.status === "pending");
  const approved = comments.filter((c) => c.status === "approved");
  const rejected = comments.filter((c) => c.status === "rejected");

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const CommentList = ({ items, showApprove }: { items: Comment[]; showApprove?: boolean }) => (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">{t("لا توجد تعليقات", "No comments")}</p>
      )}
      {items.map((c) => (
        <div key={c.id} className="p-4 rounded-lg border border-border bg-card space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{c.user_name}</span>
              <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
            </div>
            <Badge variant="outline" className="text-xs">{c.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{t("على:", "On:")} {c.article_title}</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{c.content}</p>
          <div className="flex gap-2 pt-1">
            {showApprove && (
              <>
                <Button size="sm" variant="default" className="gap-1 h-7 text-xs" onClick={() => updateStatus(c.id, "approved")}>
                  <Check className="w-3 h-3" /> {t("موافقة", "Approve")}
                </Button>
                <Button size="sm" variant="destructive" className="gap-1 h-7 text-xs" onClick={() => updateStatus(c.id, "rejected")}>
                  <X className="w-3 h-3" /> {t("رفض", "Reject")}
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs text-destructive" onClick={() => deleteComment(c.id)}>
              <Trash2 className="w-3 h-3" /> {t("حذف", "Delete")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          {t("إدارة التعليقات", "Comment Management")}
        </h2>
        <Badge variant="outline">{comments.length} {t("تعليق", "comments")}</Badge>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">{t("معلقة", "Pending")} ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">{t("موافق عليها", "Approved")} ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">{t("مرفوضة", "Rejected")} ({rejected.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending"><CommentList items={pending} showApprove /></TabsContent>
        <TabsContent value="approved"><CommentList items={approved} /></TabsContent>
        <TabsContent value="rejected"><CommentList items={rejected} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default CommentManagement;
