"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { cn, formatDate } from "@/lib/utils";
import { getNotificationMessage } from "@/lib/notification-message";
import { markNotificationsRead } from "@/lib/actions/notification";
import type { NotificationType } from "@/lib/notifications";

export interface NotificationItem {
  id: string;
  type: string;
  payload: unknown;
  readAt: Date | string | null;
  createdAt: Date | string;
}

const NotificationBell = ({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}) => {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      setUnreadCount(0);
      void markNotificationsRead();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-lg z-50">
          {initialNotifications.length === 0 ? (
            <p className="p-4 text-14-normal">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {initialNotifications.map((notification) => {
                const { text, href } = getNotificationMessage(
                  notification.type as NotificationType,
                  notification.payload,
                );
                return (
                  <li key={notification.id}>
                    <Link
                      href={href}
                      className={cn(
                        "block px-4 py-3 text-sm hover:bg-secondary transition-colors",
                        !notification.readAt && "bg-primary/5 font-medium",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {text}
                      <span className="block text-14-normal mt-0.5">
                        {formatDate(notification.createdAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/notifications"
            className="block px-4 py-2.5 text-center text-sm font-medium text-primary border-t border-border hover:bg-secondary"
            onClick={() => setOpen(false)}
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
