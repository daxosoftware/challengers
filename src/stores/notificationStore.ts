import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Notification } from '../types';
import { notificationService } from '../services/database';
import { ErrorHandler } from '../utils/errorHandler';

interface NotificationState {
  // Data
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  removeNotification: (notificationId: string) => void;
  clearError: () => void;
  
  // Computed values
  recentNotifications: Notification[];
  unreadNotifications: Notification[];
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,

      // Actions
      fetchNotifications: async (userId) => {
        try {
          set({ loading: true, error: null });
          const notifications = await notificationService.getUserNotifications(userId);
          const unreadCount = notifications.filter(n => !n.read).length;
          set({ notifications, unreadCount });
        } catch (error) {
          const appError = ErrorHandler.handle(error);
          set({ error: appError.message });
        } finally {
          set({ loading: false });
        }
      },

      markAsRead: async (notificationId) => {
        try {
          await notificationService.markAsRead(notificationId);
          set(state => ({
            notifications: state.notifications.map(n =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }));
        } catch (error) {
          const appError = ErrorHandler.handle(error);
          set({ error: appError.message });
        }
      },

      markAllAsRead: async (userId) => {
        try {
          await notificationService.markAllAsRead(userId);
          set(state => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0
          }));
        } catch (error) {
          const appError = ErrorHandler.handle(error);
          set({ error: appError.message });
        }
      },

      addNotification: (notification) => {
        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + (notification.read ? 0 : 1)
        }));
      },

      removeNotification: (notificationId) => {
        set(state => {
          const notification = state.notifications.find(n => n.id === notificationId);
          return {
            notifications: state.notifications.filter(n => n.id !== notificationId),
            unreadCount: state.unreadCount - (notification?.read ? 0 : 1)
          };
        });
      },

      clearError: () => set({ error: null }),

      // Computed values
      recentNotifications: () => {
        const { notifications } = get();
        return notifications.slice(0, 5);
      },

      unreadNotifications: () => {
        const { notifications } = get();
        return notifications.filter(n => !n.read);
      },
    }),
    {
      name: 'notification-store',
    }
  )
);
