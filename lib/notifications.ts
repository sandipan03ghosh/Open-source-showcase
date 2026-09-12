import "server-only";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "NEW_FOLLOWER"
  | "REPOSITORY_LIKED"
  | "REPOSITORY_COMMENTED"
  | "REPOSITORY_REVIEWED";

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: Prisma.InputJsonValue,
) {
  try {
    await prisma.notification.create({ data: { userId, type, payload } });
  } catch (error) {
    // Notifications are best-effort — never let a failure here break the
    // action that triggered it (a like, comment, review, or follow).
    console.error("Failed to create notification:", error);
  }
}
