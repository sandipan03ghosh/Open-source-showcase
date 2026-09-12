import "server-only";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  createOctokit,
  fetchRepositoryLanguages,
  fetchRepositoryMetadata,
} from "@/lib/github/client";
import { detectTechnologies } from "@/lib/github/technologies";
import type { RepositoryLanguages, RepositoryMetadata } from "@/lib/github/types";

export class DuplicateRepositoryError extends Error {
  constructor(fullName: string) {
    super(`${fullName} has already been showcased.`);
    this.name = "DuplicateRepositoryError";
  }
}

async function resolveOrganizationId(metadata: RepositoryMetadata): Promise<string | null> {
  if (metadata.githubOwnerType !== "Organization") return null;

  const organization = await prisma.organization.upsert({
    where: { githubId: metadata.githubOwnerId },
    update: {
      login: metadata.githubOwnerLogin,
      avatarUrl: metadata.githubOwnerAvatarUrl,
    },
    create: {
      githubId: metadata.githubOwnerId,
      login: metadata.githubOwnerLogin,
      avatarUrl: metadata.githubOwnerAvatarUrl,
    },
  });

  return organization.id;
}

function toRepositoryData(
  metadata: RepositoryMetadata,
  languages: RepositoryLanguages,
  organizationId: string | null,
): Omit<Prisma.RepositoryUncheckedCreateInput, "ownerId"> {
  return {
    githubId: metadata.githubId,
    name: metadata.name,
    fullName: metadata.fullName,
    description: metadata.description,
    homepageUrl: metadata.homepageUrl,
    defaultBranch: metadata.defaultBranch,
    license: metadata.license,
    visibility: metadata.visibility,
    isArchived: metadata.isArchived,
    githubOwnerLogin: metadata.githubOwnerLogin,
    githubOwnerAvatarUrl: metadata.githubOwnerAvatarUrl,
    githubOwnerType: metadata.githubOwnerType,
    stars: metadata.stars,
    forks: metadata.forks,
    watchers: metadata.watchers,
    openIssues: metadata.openIssues,
    sizeKb: metadata.sizeKb,
    topics: metadata.topics,
    languages: languages as Prisma.InputJsonValue,
    languageNames: Object.keys(languages),
    technologies: detectTechnologies(metadata.topics),
    githubCreatedAt: metadata.githubCreatedAt,
    githubUpdatedAt: metadata.githubUpdatedAt,
    organizationId,
    lastSyncedAt: new Date(),
    syncStatus: "IDLE",
    syncError: null,
  };
}

function toSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 500);
  return "Unknown sync error";
}

/**
 * Imports a new repository showcase. Fails if the repository is already
 * showcased (unique on githubId).
 */
export async function connectAndSyncRepository(params: {
  ownerId: string;
  owner: string;
  repo: string;
  accessToken?: string;
}) {
  const octokit = createOctokit(params.accessToken);
  const metadata = await fetchRepositoryMetadata(octokit, params.owner, params.repo);

  const existing = await prisma.repository.findUnique({
    where: { githubId: metadata.githubId },
    select: { id: true },
  });
  if (existing) throw new DuplicateRepositoryError(metadata.fullName);

  const languages = await fetchRepositoryLanguages(octokit, params.owner, params.repo);
  const organizationId = await resolveOrganizationId(metadata);

  return prisma.repository.create({
    data: {
      ...toRepositoryData(metadata, languages, organizationId),
      ownerId: params.ownerId,
    },
  });
}

/**
 * Always incremental: compares GitHub's `updated_at` against what's stored
 * and skips the metadata write if nothing changed (still bumps
 * `lastSyncedAt` so the repo isn't picked again immediately by the
 * stale-repo cron query). There is no "full resync" code path.
 */
export async function syncRepository(
  repositoryId: string,
  accessToken?: string,
): Promise<{ status: "synced" | "unchanged" | "failed"; error?: string }> {
  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: { id: true, fullName: true, githubUpdatedAt: true },
  });
  if (!repository) return { status: "failed", error: "Repository not found." };

  const [owner, repo] = repository.fullName.split("/");
  if (!owner || !repo) return { status: "failed", error: "Invalid repository reference." };

  await prisma.repository.update({
    where: { id: repositoryId },
    data: { syncStatus: "SYNCING" },
  });

  try {
    const octokit = createOctokit(accessToken);
    const metadata = await fetchRepositoryMetadata(octokit, owner, repo);

    const unchanged =
      repository.githubUpdatedAt !== null &&
      metadata.githubUpdatedAt.getTime() === repository.githubUpdatedAt.getTime();

    if (unchanged) {
      await prisma.repository.update({
        where: { id: repositoryId },
        data: { lastSyncedAt: new Date(), syncStatus: "IDLE", syncError: null },
      });
      return { status: "unchanged" };
    }

    const languages = await fetchRepositoryLanguages(octokit, owner, repo);
    const organizationId = await resolveOrganizationId(metadata);

    await prisma.repository.update({
      where: { id: repositoryId },
      data: toRepositoryData(metadata, languages, organizationId),
    });

    return { status: "synced" };
  } catch (error) {
    const message = toSafeErrorMessage(error);
    await prisma.repository.update({
      where: { id: repositoryId },
      data: { syncStatus: "FAILED", syncError: message, lastSyncedAt: new Date() },
    });
    return { status: "failed", error: message };
  }
}
