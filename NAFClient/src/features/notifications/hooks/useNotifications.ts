import { useEffect, useRef } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { notificationsApi } from "../api";
import type { NotificationDTO, NotificationsResult } from "../types";

const QUERY_KEY = ["notifications", 1] as const;

const hubUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "") + "/hubs/notifications";

export function useNotifications() {
  const queryClient = useQueryClient();
  const connectionRef = useRef<ReturnType<typeof buildConnection> | null>(null);

  function buildConnection() {
    return new HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true })
      .withAutomaticReconnect()
      .build();
  }

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificationsApi.getMyNotifications(1),
    staleTime: 30_000,
  });

  useEffect(() => {
    const connection = buildConnection();
    connectionRef.current = connection;

    connection.on("ReceiveNotification", (notification: NotificationDTO) => {
      queryClient.setQueryData<NotificationsResult>(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: [notification, ...old.data],
          totalCount: old.totalCount + 1,
          unreadCount: old.unreadCount + 1,
        };
      });
    });

    connection
      .start()
      .catch(() => {});

    return () => {
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop();
      }
    };
  }, [queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onMutate: (id) => {
      queryClient.setQueryData<NotificationsResult>(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          unreadCount: Math.max(0, old.unreadCount - 1),
        };
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onMutate: () => {
      queryClient.setQueryData<NotificationsResult>(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        };
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    notifications: data?.data ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
  };
}
