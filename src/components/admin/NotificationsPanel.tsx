import { useState } from "react";
import { Bell, X, Check, FileText, MessageSquare, Users, Zap, Settings } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

const TYPE_ICONS: Record<Notification["type"], React.ElementType> = {
  new_article: FileText,
  new_comment: MessageSquare,
  new_user: Users,
  breaking_news: Zap,
  system: Settings,
};

const TYPE_COLORS: Record<Notification["type"], string> = {
  new_article:   "text-blue-500 bg-blue-50 dark:bg-blue-950/40",
  new_comment:   "text-green-500 bg-green-50 dark:bg-green-950/40",
  new_user:      "text-purple-500 bg-purple-50 dark:bg-purple-950/40",
  breaking_news: "text-red-500 bg-red-50 dark:bg-red-950/40",
  system:        "text-gray-500 bg-gray-100 dark:bg-gray-800/40",
};

const NotificationsPanel = () => {
  const { t } = useLanguage();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = (n: Notification) => {
    markRead(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return t("الآن", "Now");
    if (m < 60) return `${m} ${t("د", "m")}`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ${t("س", "h")}`;
    return `${Math.floor(h / 24)} ${t("ي", "d")}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label={t("الإشعارات", "Notifications")}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 end-1 min-w-[16px] h-4 px-1 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                {t("الإشعارات", "Notifications")}
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {t("قراءة الكل", "Mark all read")}
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">{t("لا توجد إشعارات بعد", "No notifications yet")}</p>
                </div>
              ) : (
                notifications.map(n => {
                  const Icon = TYPE_ICONS[n.type];
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-start px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 items-start ${!n.read ? "bg-primary/5" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${TYPE_COLORS[n.type]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsPanel;
