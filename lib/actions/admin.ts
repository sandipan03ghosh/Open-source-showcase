"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseServerActionResponse } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit";

const MODERATOR_ROLES = ["ADMIN", "MODERATOR"];

/**
 * Defense in depth: middleware already blocks non-admins from /admin/**,
 * but every action re-checks here too, since server actions can be called
 * directly and must never trust the route guard alone.
 */
async function requireModerator() {
  const session = await auth();
  if (!session?.id || !MODERATOR_ROLES.includes(session.user.role)) {
    return null;
  }
  return session;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.id || session.user.role !== "ADMIN") return null;
  return session;
}

export async function setUserRole(userId: string, role: "USER" | "ADMIN" | "MODERATOR") {
  const session = await requireAdmin();
  if (!session) return parseServerActionResponse({ error: "Forbidden.", status: "ERROR" });

  await prisma.user.update({ where: { id: userId }, data: { role } });
  await logAdminAction(session.id, "SET_USER_ROLE", "User", userId, { role });

  revalidatePath("/admin/users");
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}

export async function setUserBanned(userId: string, isBanned: boolean) {
  const session = await requireModerator();
  if (!session) return parseServerActionResponse({ error: "Forbidden.", status: "ERROR" });

  await prisma.user.update({ where: { id: userId }, data: { isBanned } });
  await logAdminAction(session.id, isBanned ? "BAN_USER" : "UNBAN_USER", "User", userId);

  revalidatePath("/admin/users");
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}

export async function setRepositoryFeatured(repositoryId: string, isFeatured: boolean) {
  const session = await requireModerator();
  if (!session) return parseServerActionResponse({ error: "Forbidden.", status: "ERROR" });

  await prisma.repository.update({ where: { id: repositoryId }, data: { isFeatured } });
  await logAdminAction(
    session.id,
    isFeatured ? "FEATURE_REPOSITORY" : "UNFEATURE_REPOSITORY",
    "Repository",
    repositoryId,
  );

  revalidatePath("/admin/repositories");
  revalidatePath("/");
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}

export async function setRepositoryArchived(repositoryId: string, isArchived: boolean) {
  const session = await requireModerator();
  if (!session) return parseServerActionResponse({ error: "Forbidden.", status: "ERROR" });

  await prisma.repository.update({ where: { id: repositoryId }, data: { isArchived } });
  await logAdminAction(
    session.id,
    isArchived ? "ARCHIVE_REPOSITORY" : "UNARCHIVE_REPOSITORY",
    "Repository",
    repositoryId,
  );

  revalidatePath("/admin/repositories");
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}

export async function deleteRepositoryAdmin(repositoryId: string) {
  const session = await requireAdmin();
  if (!session) return parseServerActionResponse({ error: "Forbidden.", status: "ERROR" });

  await prisma.repository.delete({ where: { id: repositoryId } });
  await logAdminAction(session.id, "DELETE_REPOSITORY", "Repository", repositoryId);

  revalidatePath("/admin/repositories");
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}

export async function resolveReport(reportId: string, status: "RESOLVED" | "DISMISSED") {
  const session = await requireModerator();
  if (!session) return parseServerActionResponse({ error: "Forbidden.", status: "ERROR" });

  await prisma.report.update({ where: { id: reportId }, data: { status } });
  await logAdminAction(session.id, `REPORT_${status}`, "Report", reportId);

  revalidatePath("/admin/reports");
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}
