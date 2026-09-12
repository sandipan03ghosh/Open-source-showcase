import "server-only";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function logAdminAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Prisma.InputJsonValue,
) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, targetType, targetId, metadata },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
