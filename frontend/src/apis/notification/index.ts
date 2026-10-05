import http from '@/apis/http';
import type { NotificationResponse } from './types';

export const getNotifications = async (): Promise<NotificationResponse[]> => {
  const { data } = await http.get<NotificationResponse[]>('/notifications');
  return data;
};

export const markAsRead = async (id: number): Promise<void> => {
  await http.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await http.patch('/notifications/read-all');
};

export const deleteNotification = async (id: number): Promise<void> => {
  await http.delete(`/notifications/${id}`);
};
