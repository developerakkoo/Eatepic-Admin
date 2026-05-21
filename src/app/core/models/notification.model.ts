export type NotificationType = 'order' | 'subscription' | 'system' | 'promo';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  audience: string;
  read: boolean;
  sent?: boolean;
}
