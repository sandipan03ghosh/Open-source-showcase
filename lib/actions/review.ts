"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseServerActionResponse } from "@/lib/utils";
import { reviewSchema } from "@/lib/validation";
import { createNotification } from "@/lib/notifications";

export async function submitReview(repositoryId: string, _state: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    body: formData.get("body") || undefined,
  });
  if (!parsed.success) {
    return parseServerActionResponse({
      error: parsed.error.issues[0]?.message ?? "Invalid review.",
      status: "ERROR",
    });
  }

  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: { id: true, ownerId: true, name: true, githubOwnerLogin: true },
  });
  if (!repository) {
    return parseServerActionResponse({ error: "Repository not found.", status: "ERROR" });
  }

  const existing = await prisma.review.findUnique({
    where: { userId_repositoryId: { userId: session.id, repositoryId } },
  });

  await prisma.review.upsert({
    where: { userId_repositoryId: { userId: session.id, repositoryId } },
    update: { rating: parsed.data.rating, body: parsed.data.body ?? null },
    create: {
      userId: session.id,
      repositoryId,
      rating: parsed.data.rating,
      body: parsed.data.body ?? null,
    },
  });

  if (!existing && repository.ownerId !== session.id) {
    await createNotification(repository.ownerId, "REPOSITORY_REVIEWED", {
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

export async function deleteReview(reviewId: string) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      userId: true,
      repository: { select: { githubOwnerLogin: true, name: true } },
    },
  });
  if (!review) {
    return parseServerActionResponse({ error: "Review not found.", status: "ERROR" });
  }
  if (review.userId !== session.id) {
    return parseServerActionResponse({ error: "You can only delete your own review.", status: "ERROR" });
  }

  await prisma.review.delete({ where: { id: reviewId } });
  revalidatePath(`/repo/${review.repository.githubOwnerLogin}/${review.repository.name}`);
  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}
