import React, { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import { subscribeToNotifications, markNotificationAsRead } from '../services/notificationService';

export const NotificationListener: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const processedNotifications = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToNotifications(currentUser.uid, (notifications) => {
      notifications.forEach(notification => {
        if (!processedNotifications.current.has(notification.id)) {
          processedNotifications.current.add(notification.id);
          
          // Show toast
          showToast(notification.message, 'info');
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser, showToast]);

  return null;
};
