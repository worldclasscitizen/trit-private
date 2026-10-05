import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { EventSourcePolyfill, NativeEventSource } from 'event-source-polyfill';
import { useAuthStore } from './auth';
import type { NotificationResponse } from '@/apis/notification/types';
import * as notificationApi from '@/apis/notification';

export const useNotificationStore = defineStore('notification', () => {
  const authStore = useAuthStore();
  const notifications = ref<NotificationResponse[]>([]);
  const eventSource = ref<EventSourcePolyfill | EventSource | null>(null);

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.isRead).length
  );

  const fetchAll = async () => {
    try {
      notifications.value = await notificationApi.getNotifications();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const connectSSE = () => {
    if (eventSource.value) return;

    const EventSourceClass = EventSourcePolyfill || NativeEventSource;

    const url = 'https://tritt.o-r.kr/api/notifications/subscribe';

    const es = new EventSourceClass(url, {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      },
      heartbeatTimeout: 60 * 60 * 1000, // 1 hour
    });

    es.addEventListener('notification', (event: any) => {
      try {
        const newNotification: NotificationResponse = JSON.parse(event.data);
        notifications.value.unshift(newNotification);
      } catch (e) {
        console.error('Error parsing notification data:', e);
      }
    });

    es.addEventListener('connect', (event: any) => {
      console.log('SSE connected:', event.data);
    });

    es.onerror = (error) => {
      console.error('SSE error:', error);
      // Optional: implement reconnect logic
    };

    eventSource.value = es;
  };

  const disconnectSSE = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }
  };

  const readNotification = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      const target = notifications.value.find(n => n.id === id);
      if (target) target.isRead = true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const readAll = async () => {
    try {
      await notificationApi.markAllAsRead();
      notifications.value.forEach(n => n.isRead = true);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const removeNotification = async (id: number) => {
    try {
      await notificationApi.deleteNotification(id);
      notifications.value = notifications.value.filter(n => n.id !== id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    fetchAll,
    connectSSE,
    disconnectSSE,
    readNotification,
    readAll,
    removeNotification
  };
});
