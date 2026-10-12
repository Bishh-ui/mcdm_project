/**
 * Notification service for in-app notifications
 */

import { setDocument, getCollection, updateDocument } from "@/lib/firebase/firestore";
import type { Notification, NotificationType, NotificationPriority } from "./types";

const NOTIFICATIONS_COLLECTION = "mcdm:notifications";

/**
 * Create a new notification
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  options?: {
    priority?: NotificationPriority;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, unknown>;
    expiresInDays?: number;
  }
): Promise<Notification> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const notification: Notification = {
    id,
    type,
    priority: options?.priority || "medium",
    title,
    message,
    userId,
    read: false,
    actionUrl: options?.actionUrl,
    actionLabel: options?.actionLabel,
    metadata: options?.metadata,
    createdAt: new Date().toISOString(),
    expiresAt: options?.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
  };

  await setDocument(`${NOTIFICATIONS_COLLECTION}/${id}`, notification);

  return notification;
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  unreadOnly = false
): Promise<Notification[]> {
  const allNotifications = await getCollection<Notification>(NOTIFICATIONS_COLLECTION);

  let filtered = allNotifications.filter((n) => n.userId === userId);

  if (unreadOnly) {
    filtered = filtered.filter((n) => !n.read);
  }

  // Filter out expired notifications
  const now = new Date().toISOString();
  filtered = filtered.filter((n) => !n.expiresAt || n.expiresAt > now);

  // Sort by created date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return filtered;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await updateDocument(`${NOTIFICATIONS_COLLECTION}/${notificationId}`, {
    read: true,
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const notifications = await getUserNotifications(userId, true);

  await Promise.all(
    notifications.map((n) =>
      updateDocument(`${NOTIFICATIONS_COLLECTION}/${n.id}`, {
        read: true,
      })
    )
  );
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { deleteDocument } = await import("@/lib/firebase/firestore");
  await deleteDocument(`${NOTIFICATIONS_COLLECTION}/${notificationId}`);
}

/**
 * Helper functions for common notification types
 */

export async function notifyWeightApprovalRequest(
  reviewerId: string,
  proposalId: string,
  criterionName: string,
  proposedBy: string
): Promise<void> {
  await createNotification(
    reviewerId,
    "weight_approval_request",
    "Weight Approval Request",
    `${proposedBy} proposed a weight change for ${criterionName}`,
    {
      priority: "high",
      actionUrl: `/dashboard/weights?proposal=${proposalId}`,
      actionLabel: "Review",
      metadata: { proposalId, criterionName },
    }
  );
}

export async function notifyExperimentCompleted(
  userId: string,
  experimentId: string,
  experimentName: string,
  hasWinner: boolean
): Promise<void> {
  await createNotification(
    userId,
    "experiment_completed",
    "Experiment Completed",
    `${experimentName} has completed${hasWinner ? " with a winner" : ""}`,
    {
      priority: hasWinner ? "high" : "medium",
      actionUrl: `/dashboard/experiments/${experimentId}`,
      actionLabel: "View Results",
      metadata: { experimentId, hasWinner },
    }
  );
}

export async function notifyRankReversal(
  userId: string,
  criterionName: string,
  affectedAlternatives: string[]
): Promise<void> {
  await createNotification(
    userId,
    "rank_reversal",
    "Rank Reversal Detected",
    `Weight change in ${criterionName} caused rank reversals for ${affectedAlternatives.length} alternatives`,
    {
      priority: "high",
      actionUrl: "/dashboard/weights/sensitivity",
      actionLabel: "Review",
      metadata: { criterionName, affectedAlternatives },
    }
  );
}

export async function notifyDataQualityWarning(
  userId: string,
  source: string,
  issue: string
): Promise<void> {
  await createNotification(
    userId,
    "data_quality_warning",
    "Data Quality Warning",
    `${source}: ${issue}`,
    {
      priority: "medium",
      actionUrl: "/dashboard/connectors",
      actionLabel: "Check Connectors",
      metadata: { source, issue },
    }
  );
}
