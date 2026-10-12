/**
 * Notification system types
 */

export type NotificationType =
  | "weight_approval_request"
  | "weight_approved"
  | "weight_rejected"
  | "experiment_completed"
  | "experiment_winner"
  | "data_quality_warning"
  | "rank_reversal"
  | "system";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  userId: string;
  enableInApp: boolean;
  enableEmail: boolean;
  types: {
    [K in NotificationType]: {
      enabled: boolean;
      priority: NotificationPriority;
    };
  };
}
