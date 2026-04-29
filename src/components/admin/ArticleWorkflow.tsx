import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Facebook, Send, MessageCircle, Mail, 
  CheckCircle2, Clock, AlertCircle, Share2, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkflowItem {
  id: string;
  platform: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
}

interface ArticleWorkflowProps {
  articleId: string;
  articleTitle: string;
  articleSlug: string;
}

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-[#1877f2]", bgColor: "bg-[#1877f2]/10" },
  { id: "twitter", name: "Twitter / X", icon: Twitter, color: "text-foreground", bgColor: "bg-foreground/10" },
  { id: "telegram", name: "Telegram", icon: Send, color: "text-[#0088cc]", bgColor: "bg-[#0088cc]/10" },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, color: "text-[#25d366]", bgColor: "bg-[#25d366]/10" },
  { id: "newsletter", name: "Newsletter", icon: Mail, color: "text-primary", bgColor: "bg-primary/10" },
];

const ArticleWorkflow = ({ articleId, articleTitle, articleSlug }: ArticleWorkflowProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflow();
  }, [articleId]);

  const fetchWorkflow = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("article_workflow")
      .select("*")
      .eq("article_id", articleId);
    
    if (data) setItems(data);
    setLoading(false);
  };

  const toggleStatus = async (platform: string, currentStatus?: string) => {
    const newStatus = currentStatus === "published" ? "pending" : "published";
    
    if (currentStatus) {
      await supabase
        .from("article_workflow")
        .update({ 
          status: newStatus, 
          published_at: newStatus === "published" ? new Date().toISOString() : null 
        })
        .eq("article_id", articleId)
        .eq("platform", platform);
    } else {
      await supabase
        .from("article_workflow")
        .insert({
          article_id: articleId,
          platform,
          status: newStatus,
          published_at: newStatus === "published" ? new Date().toISOString() : null
        });
    }
    
    fetchWorkflow();
    toast({
      title: t("تم تحديث الحالة", "Status Updated"),
      description: `${platform} -> ${newStatus}`,
    });
  };

  return (
    <Card className="border-primary/20 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          {t("سير نشر الخبر عبر المنصات", "Article Distribution Workflow")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PLATFORMS.map((p) => {
            const item = items.find(i => i.platform === p.id);
            const isPublished = item?.status === "published";
            const Icon = p.icon;

            return (
              <div 
                key={p.id}
                className={`relative p-3 rounded-xl border transition-all duration-300 ${
                  isPublished 
                    ? "border-emerald-500/30 bg-emerald-500/5 shadow-sm" 
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${p.bgColor}`}>
                    <Icon className={`h-4 w-4 ${p.color}`} />
                  </div>
                  {isPublished ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                
                <h4 className="text-xs font-bold mb-1">{p.name}</h4>
                
                <div className="flex items-center justify-between mt-3">
                  <Badge variant={isPublished ? "default" : "outline"} className={`text-[10px] px-1.5 py-0 ${isPublished ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}>
                    {isPublished ? t("تم النشر", "Published") : t("معلق", "Pending")}
                  </Badge>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-full"
                    onClick={() => toggleStatus(p.id, item?.status)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ArticleWorkflow;
