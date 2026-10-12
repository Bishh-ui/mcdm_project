"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { subscribeToCollection } from "@/lib/firebase/firestore";
import { markAsRead, markAllAsRead, deleteNotification } from "@/lib/notifications/service";
import type { Notification } from "@/lib/notifications/types";

interface NotificationCenterProps {
  userId: string;
  onClose?: () => void;
}

export function NotificationCenter({ userId, onClose }: NotificationCenterProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Notification>(
      "mcdm:notifications",
      (data) => {
        const userNotifications = data
          .filter((n) => n.userId === userId)
          .filter((n) => !n.expiresAt || new Date(n.expiresAt) > new Date())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setNotifications(userNotifications);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose?.();
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(userId);
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "urgent":
        return "pink";
      case "high":
        return "amber";
      case "medium":
        return "cyan";
      case "low":
        return "neutral";
      default:
        return "neutral";
    }
  };

  if (loading) {
    return (
      <Card className="p-6 w-96">
        <div className="text-center text-gray-400">Loading notifications...</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 w-96 max-h-[600px] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="cyan">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">🔔</div>
            <div>No notifications</div>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                notification.read
                  ? "bg-gray-900/30 border-gray-800 hover:bg-gray-900/50"
                  : "bg-cyan-500/5 border-cyan-500/20 hover:bg-cyan-500/10"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">
                    {notification.title}
                  </h4>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  )}
                </div>
                <Badge variant={getPriorityColor(notification.priority)}>
                  {notification.priority}
                </Badge>
              </div>

              <p className="text-xs text-gray-400 mb-2">{notification.message}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                <div className="flex items-center gap-2">
                  {notification.actionLabel && (
                    <span className="text-xs text-cyan-400">{notification.actionLabel} →</span>
                  )}
                  <button
                    onClick={(e) => handleDelete(notification.id, e)}
                    className="text-xs text-gray-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
