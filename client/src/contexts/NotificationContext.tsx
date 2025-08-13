import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext.tsx';
import { API_ENDPOINTS } from '../config/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  postId?: string;
  commentId?: string;
  isRead: boolean;
  createdAt: string;
  fromUser: {
    id: string;
    username: string;
    profilePhoto?: string;
  };
  post?: {
    id: string;
    title: string;
  };
  comment?: {
    id: string;
    content: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user || !token) return;

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || !token) return;

    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  }, [user, token]);

  const markAsRead = async (notificationId: string) => {
    if (!user || !token) return;

    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATION_READ(notificationId), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || !token) return;

    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS_READ_ALL, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user || !token) return;

    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATION_DELETE(notificationId), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  // Fetch notifications when user logs in
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, token, fetchNotifications]);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    if (!user || !token) return;

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, token, fetchUnreadCount]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
