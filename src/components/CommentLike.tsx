import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentLikeProps {
  commentId: string;
  initialLikesCount?: number;
}

const CommentLike = ({ commentId, initialLikesCount = 0 }: CommentLikeProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkIfLiked = async () => {
      const { data } = await supabase
        .from("comment_likes")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", user.id)
        .maybeSingle();

      setIsLiked(!!data);
    };

    checkIfLiked();
  }, [user, commentId]);

  const handleToggleLike = async () => {
    if (!user) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول أولاً",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        // Add like
        const { error } = await supabase.from("comment_likes").insert({
          comment_id: commentId,
          user_id: user.id,
        });

        if (error) throw error;
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggleLike}
      disabled={loading}
      variant="ghost"
      size="sm"
      className={`gap-1 ${isLiked ? "text-primary" : "text-muted-foreground"}`}
    >
      <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
      <span className="text-xs">{likesCount}</span>
    </Button>
  );
};

export default CommentLike;
