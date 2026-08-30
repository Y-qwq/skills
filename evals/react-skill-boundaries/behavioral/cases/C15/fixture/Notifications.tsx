import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { notificationClient } from './notificationClient';

export function useNotificationInbox(businessId: string) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationClient.subscribe(businessId, snapshot => {
      setUnreadCount(snapshot.unreadCount);
    });
  }, []);

  return unreadCount;
}

export function NotificationBell({ businessId }: { businessId: string }) {
  const unreadCount = useNotificationInbox(businessId);
  return <Text accessibilityLabel="Unread notifications">{unreadCount}</Text>;
}
