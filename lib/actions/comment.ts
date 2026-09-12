"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseServerActionResponse } from "@/lib/utils";
import { commentSchema } from "@/lib/validation";
import { createNotification } from "@/lib/notifications";

export async function createComment(repositoryId: string, _state: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const parsed = commentSchema.safeParse({
    body: formData.get("body"),
    parentId: formData.get("parentId") || undefined,
  });
  if (!parsed.success) {
    return parseServerActionResponse({
      error: parsed.error.issues[0]?.message ?? "Invalid comment.",
      status: "ERROR",
    });
  }

  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: { ownerId: true, name: true, githubOwnerLogin: true },
  });
  if (!repository) {
    return parseServerActionResponse({ error: "Repository not found.", status: "ERROR" });
  }

  if (parsed.data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: { repositoryId: true },
    });
    if (!parent || parent.repositoryId !== repositoryId) {
      return parseServerActionResponse({ error: "Invalid reply target.", status: "ERROR" });
    }
  }

  await prisma.comment.create({
    data: {
      repositoryId,
      authorId: session.id,
      parentId: parsed.data.parentId,
      body: parsed.data.body,
    },
  });

  if (repository.ownerId !== session.id) {
    await createNotification(repository.ownerId, "REPOSITORY_COMMENTED", {
      repositoryId,
      repositoryName: repository.name,
      repositoryOwnerLogin: repository.githubOwnerLogin,
      actorId: session.id,
      actorUsername: session.user.username ?? null,
    });
  }

  revalidatePath(`/repo/${repository.githubOwnerLogin}/${repository.name}`);
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}

export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      authorId: true,
      repository: { select: { githubOwnerLogin: true, name: true, ownerId: true } },
    },
  });
  if (!comment) {
    return parseServerActionResponse({ error: "Comment not found.", status: "ERROR" });
  }

  const canDelete =
    comment.authorId === session.id ||
    comment.repository.ownerId === session.id ||
    session.user.role === "ADMIN" ||
    session.user.role === "MODERATOR";

  if (!canDelete) {
    return parseServerActionResponse({ error: "You can't delete this comment.", status: "ERROR" });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/repo/${comment.repository.githubOwnerLogin}/${comment.repository.name}`);
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}
