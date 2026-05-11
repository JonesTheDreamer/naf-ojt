import { Bell } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { cn } from "@/shared/utils/utils";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-amber-500 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={8}
          align="end"
          className="z-50 w-80 max-h-[480px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg outline-none"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="px-4 py-6 text-sm text-gray-500 text-center">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500 text-center">
              No notifications
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      if (!n.isRead) markAsRead(n.id);
                      navigate(n.link);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50",
                      !n.isRead && "border-l-4 border-l-amber-400 pl-3"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900 leading-snug">
                        {n.title}
                      </span>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap mt-0.5">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
