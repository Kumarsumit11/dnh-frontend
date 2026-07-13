import api from "./axios";

export type NotificationType =
  | "ACCOUNT"
  | "FUNDING"
  | "PROPOSAL"
  | "INVESTMENT"
  | "DOCUMENT"
  | "SYSTEM";

export interface NotificationData {
  id: string;
  accountId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export const getNotifications = async (): Promise<NotificationData[]> => {
  const response = await api.get("/notifications");
  return response.data.data;
};

export const markNotificationRead = async (id: string) => {
  await api.put(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async () => {
  await api.put("/notifications/read-all");
};