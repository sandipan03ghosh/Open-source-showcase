"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseServerActionResponse } from "@/lib/utils";

export async function markNotificationsRead() {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  await prisma.notification.updateMany({
    where: { userId: session.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}
