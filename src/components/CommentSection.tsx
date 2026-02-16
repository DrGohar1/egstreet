import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Flag } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  status: string;
  parent_id: string | null;
  profile?: { display_name: string; avatar_url: string | null };
}

const CommentSection = ({ articleId }: { articleId: string }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("article_id", articleId)
      .eq("status", "approved")
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch profiles for commenters
      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

      setComments(data.map((c: any) => ({ ...c, profile: profileMap[c.user_id] })));
    }
  }, [articleId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      article_id: articleId,
      user_id: user.id,
      content: newComment.trim(),
    });
    if (error) {
      toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("تم إرسال تعليقك وسيظهر بعد الموافقة", "Comment submitted, pending approval") });
      setNewComment("");
    }
    setSubmitting(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        {t("التعليقات", "Comments")} ({comments.length})
      </h3>

      {/* Comment form */}
      {user ? (
        <div className="mb-6 space-y-3">
          <Textarea
            placeholder={t("اكتب تعليقك...", "Write a comment...")}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
            maxLength={1000}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSubmit} disabled={submitting || !newComment.trim()} className="gap-1">
              <Send className="w-3.5 h-3.5" />
              {t("إرسال", "Submit")}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-6">
          <a href="/auth" className="text-primary hover:underline">{t("سجل الدخول", "Sign in")}</a>{" "}
          {t("للتعليق", "to comment")}
        </p>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {(comment.profile?.display_name || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">
                  {comment.profile?.display_name || t("مستخدم", "User")}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">
            {t("لا توجد تعليقات بعد. كن أول من يعلق!", "No comments yet. Be the first!")}
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
