import { api } from "@/shared/api/client";
import type { NotificationsResult } from "./types";

export const notificationsApi = {
  getMyNotifications: async (page: number): Promise<NotificationsResult> => {
    const res = await api.get("/notifications/mine", { params: { page } });
    return res.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put("/notifications/read-all");
  },
};
