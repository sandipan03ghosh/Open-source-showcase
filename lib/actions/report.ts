"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseServerActionResponse } from "@/lib/utils";
import { reportSchema } from "@/lib/validation";

export async function submitReport(_state: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const parsed = reportSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return parseServerActionResponse({
      error: parsed.error.issues[0]?.message ?? "Invalid report.",
      status: "ERROR",
    });
  }

  const repositoryId =
    parsed.data.targetType === "REPOSITORY" ? parsed.data.targetId : undefined;

  await prisma.report.create({
    data: {
      reporterId: session.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      repositoryId,
      reason: parsed.data.reason,
    },
  });

  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}
