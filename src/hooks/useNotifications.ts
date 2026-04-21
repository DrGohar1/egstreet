import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  type: "new_article" | "new_comment" | "new_user" | "breaking_news" | "system";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((n: Omit<Notification, "id" | "read" | "created_at">) => {
    const newN: Notification = {
      ...n,
      id: crypto.randomUUID(),
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newN, ...prev].slice(0, 50));
    setUnreadCount(c => c + 1);
    if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
      new window.Notification(n.title, { body: n.message, icon: "/pwa-192.png" });
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  useEffect(() => {
    if (!user) return;

    if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "default") {
      window.Notification.requestPermission();
    }

    const articleChannel = supabase
      .channel("admin-articles")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "articles" }, (payload: any) => {
        addNotification({
          type: "new_article",
          title: "مقال جديد 📰",
          message: payload.new?.title || "تم إضافة مقال جديد",
          link: "/eg-control-2026/articles",
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "articles" }, (payload: any) => {
        if (payload.new?.is_breaking && !payload.old?.is_breaking) {
          addNotification({
            type: "breaking_news",
            title: "خبر عاجل 🚨",
            message: payload.new?.title || "تم تمييز خبر كعاجل",
            link: "/eg-control-2026/breaking",
          });
        }
      })
      .subscribe();

    const commentChannel = supabase
      .channel("admin-comments")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments" }, (payload: any) => {
        addNotification({
          type: "new_comment",
          title: "تعليق جديد 💬",
          message: String(payload.new?.content || "").slice(0, 60) || "تعليق جديد يحتاج مراجعة",
          link: "/eg-control-2026/comments",
        });
      })
      .subscribe();

    const profileChannel = supabase
      .channel("admin-users")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
        addNotification({
          type: "new_user",
          title: "مستخدم جديد 👤",
          message: "انضم مستخدم جديد للموقع",
          link: "/eg-control-2026/users",
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(articleChannel);
      supabase.removeChannel(commentChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [user, addNotification]);

  return { notifications, unreadCount, markRead, markAllRead };
};
