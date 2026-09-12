"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseServerActionResponse } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

async function toggle(
  model: "bookmark" | "like",
  repositoryId: string,
): Promise<{ status: "SUCCESS" | "ERROR"; error: string; active?: boolean }> {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const where = { userId_repositoryId: { userId: session.id, repositoryId } };

  const existing =
    model === "bookmark"
      ? await prisma.bookmark.findUnique({ where })
      : await prisma.like.findUnique({ where });

  if (existing) {
    if (model === "bookmark") {
      await prisma.bookmark.delete({ where: { id: existing.id } });
    } else {
      await prisma.like.delete({ where: { id: existing.id } });
    }
    return parseServerActionResponse({ status: "SUCCESS", error: "", active: false });
  }

  if (model === "bookmark") {
    await prisma.bookmark.create({ data: { userId: session.id, repositoryId } });
  } else {
    await prisma.like.create({ data: { userId: session.id, repositoryId } });

    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { ownerId: true, name: true, githubOwnerLogin: true },
    });
    if (repository && repository.ownerId !== session.id) {
      await createNotification(repository.ownerId, "REPOSITORY_LIKED", {
        repositoryId,
        repositoryName: repository.name,
        repositoryOwnerLogin: repository.githubOwnerLogin,
        actorId: session.id,
        actorUsername: session.user.username ?? null,
      });
    }
  }

  return parseServerActionResponse({ status: "SUCCESS", error: "", active: true });
}

export async function toggleBookmark(repositoryId: string) {
  return toggle("bookmark", repositoryId);
}

export async function toggleLike(repositoryId: string) {
  return toggle("like", repositoryId);
}

export async function toggleFollow(targetUserId: string) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }
  if (session.id === targetUserId) {
    return parseServerActionResponse({ error: "You can't follow yourself.", status: "ERROR" });
  }

  const where = { followerId_followingId: { followerId: session.id, followingId: targetUserId } };
  const existing = await prisma.follow.findUnique({ where });

  if (existing) {
    await prisma.$transaction([
      prisma.follow.delete({ where: { id: existing.id } }),
      prisma.user.update({
        where: { id: targetUserId },
        data: { followersCount: { decrement: 1 } },
      }),
      prisma.user.update({
        where: { id: session.id },
        data: { followingCount: { decrement: 1 } },
      }),
    ]);
    return parseServerActionResponse({ status: "SUCCESS", error: "", active: false });
  }

  await prisma.$transaction([
    prisma.follow.create({ data: { followerId: session.id, followingId: targetUserId } }),
    prisma.user.update({
      where: { id: targetUserId },
      data: { followersCount: { increment: 1 } },
    }),
    prisma.user.update({
      where: { id: session.id },
      data: { followingCount: { increment: 1 } },
    }),
  ]);

  await createNotification(targetUserId, "NEW_FOLLOWER", {
    actorId: session.id,
    actorUsername: session.user.username ?? null,
  });

  return parseServerActionResponse({ status: "SUCCESS", error: "", active: true });
}
