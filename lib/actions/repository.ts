"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseServerActionResponse } from "@/lib/utils";
import { connectRepositorySchema } from "@/lib/validation";
import { getUserGithubAccessToken, parseRepoInput, RepositoryNotFoundError } from "@/lib/github/client";
import { connectAndSyncRepository, DuplicateRepositoryError, syncRepository } from "@/lib/github/sync";

const REFRESH_COOLDOWN_MS = 5 * 60 * 1000;

export async function connectRepository(_state: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const parsed = connectRepositorySchema.safeParse({
    repoInput: formData.get("repoInput"),
    demoUrl: formData.get("demoUrl") || undefined,
    difficulty: formData.get("difficulty") || undefined,
  });

  if (!parsed.success) {
    return parseServerActionResponse({
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      status: "ERROR",
    });
  }

  const target = parseRepoInput(parsed.data.repoInput);
  if (!target) {
    return parseServerActionResponse({
      error: "Enter a valid GitHub repository, e.g. vercel/next.js or a GitHub URL.",
      status: "ERROR",
    });
  }

  try {
    const accessToken = await getUserGithubAccessToken(session.id);
    const repository = await connectAndSyncRepository({
      ownerId: session.id,
      owner: target.owner,
      repo: target.repo,
      accessToken,
    });

    if (parsed.data.demoUrl || parsed.data.difficulty) {
      await prisma.repository.update({
        where: { id: repository.id },
        data: {
          demoUrl: parsed.data.demoUrl || null,
          difficulty: parsed.data.difficulty,
        },
      });
    }

    revalidatePath("/");

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      owner: repository.githubOwnerLogin,
      repo: repository.name,
    });
  } catch (error) {
    if (error instanceof DuplicateRepositoryError || error instanceof RepositoryNotFoundError) {
      return parseServerActionResponse({ error: error.message, status: "ERROR" });
    }
    console.error("Failed to connect repository:", error);
    return parseServerActionResponse({
      error: "Failed to connect that repository. Please try again.",
      status: "ERROR",
    });
  }
}

export async function refreshRepository(repositoryId: string) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: {
      id: true,
      ownerId: true,
      lastSyncedAt: true,
      syncStatus: true,
      githubOwnerLogin: true,
      name: true,
    },
  });

  if (!repository) {
    return parseServerActionResponse({ error: "Repository not found.", status: "ERROR" });
  }
  if (repository.ownerId !== session.id) {
    return parseServerActionResponse({
      error: "Only the owner can refresh this repository.",
      status: "ERROR",
    });
  }
  if (repository.syncStatus === "SYNCING") {
    return parseServerActionResponse({ error: "A sync is already in progress.", status: "ERROR" });
  }
  if (repository.lastSyncedAt) {
    const elapsed = Date.now() - repository.lastSyncedAt.getTime();
    if (elapsed < REFRESH_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((REFRESH_COOLDOWN_MS - elapsed) / 1000);
      return parseServerActionResponse({
        error: `Please wait ${waitSeconds}s before refreshing again.`,
        status: "ERROR",
      });
    }
  }

  const accessToken = await getUserGithubAccessToken(session.id);
  const result = await syncRepository(repositoryId, accessToken);

  revalidatePath(`/repo/${repository.githubOwnerLogin}/${repository.name}`);

  if (result.status === "failed") {
    return parseServerActionResponse({
      error: result.error ?? "Sync failed.",
      status: "ERROR",
    });
  }

  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}

export async function incrementRepositoryView(repositoryId: string) {
  try {
    await prisma.repository.update({
      where: { id: repositoryId },
      data: { viewCount: { increment: 1 } },
    });
  } catch (error) {
    console.error("Failed to record repository view:", error);
  }
}

export async function removeRepositoryMedia(mediaId: string) {
  const session = await auth();
  if (!session?.id) {
    return parseServerActionResponse({ error: "Not signed in.", status: "ERROR" });
  }

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { id: true, key: true, repository: { select: { ownerId: true, githubOwnerLogin: true, name: true } } },
  });

  if (!media) {
    return parseServerActionResponse({ error: "Media not found.", status: "ERROR" });
  }
  if (media.repository.ownerId !== session.id) {
    return parseServerActionResponse({ error: "Only the owner can remove media.", status: "ERROR" });
  }

  await prisma.media.delete({ where: { id: mediaId } });

  try {
    const { UTApi } = await import("uploadthing/server");
    await new UTApi().deleteFiles(media.key);
  } catch (error) {
    console.error("Failed to delete UploadThing file:", error);
  }

  revalidatePath(`/repo/${media.repository.githubOwnerLogin}/${media.repository.name}`);

  return parseServerActionResponse({ status: "SUCCESS", error: "" });
}
