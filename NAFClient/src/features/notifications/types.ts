import type { PagedResult } from "@/shared/types/common/pagedResult";

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export type NotificationsResult = PagedResult<NotificationDTO> & {
  unreadCount: number;
};
