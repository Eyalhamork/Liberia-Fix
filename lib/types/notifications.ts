// lib/types/notifications.ts

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

export type NotificationCategory = 
  | 'bookings'
  | 'messages'
  | 'custom_requests'
  | 'payments'
  | 'reviews'
  | 'promotions'
  | 'system'
  | 'performance'
  | 'user_management'
  | 'disputes'
  | 'subscriptions';

export type NotificationChannel = 'push' | 'email' | 'sms';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  action_url: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  channels: NotificationChannel[];
  delivery_status: Record<string, string>;
  scheduled_for: string | null;
  created_at: string;
  read_at: string | null;
  expires_at: string | null;
}

export interface NotificationSubscription {
  id: string;
  user_id: string;
  device_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  device_type: string | null;
  active: boolean;
  last_used: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_timezone: string;
  max_daily_notifications: number;
  min_notification_interval: number;
  categories: Record<NotificationCategory, boolean>;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title_template: string;
  body_template: string;
  channels: NotificationChannel[];
  user_types: ('customer' | 'provider' | 'admin')[];
  variables: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: string;
  data?: Record<string, any>;
  actionUrl?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
}

export interface SendNotificationResult {
  success: boolean;
  notificationId?: string;
  deliveryStatus: Record<string, string>;
  errors?: string[];
}

// Helper type for notification list items (with optional user info)
export interface NotificationListItem extends Notification {
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}
