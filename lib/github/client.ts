import "server-only";
import { Octokit } from "@octokit/rest";

import { prisma } from "@/lib/prisma";
import type { RepositoryLanguages, RepositoryMetadata } from "@/lib/github/types";

const GITHUB_URL_PATTERN =
  /^https?:\/\/(www\.)?github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)\/([A-Za-z0-9._-]+?)(\.git)?\/?$/;
const OWNER_REPO_PATTERN = /^([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)\/([A-Za-z0-9._-]+)$/;

export function parseRepoInput(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();

  const urlMatch = trimmed.match(GITHUB_URL_PATTERN);
  if (urlMatch) return { owner: urlMatch[2], repo: urlMatch[3] };

  const shortMatch = trimmed.match(OWNER_REPO_PATTERN);
  if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };

  return null;
}

export function createOctokit(accessToken?: string): Octokit {
  const auth = accessToken || process.env.GITHUB_SYNC_TOKEN;
  return new Octokit(auth ? { auth } : {});
}

export async function getUserGithubAccessToken(userId: string): Promise<string | undefined> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });
  return account?.access_token ?? undefined;
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries on rate-limit (403/429) and transient upstream errors (502/503)
 * with exponential backoff. Anything else (404, 422, ...) fails fast.
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (error) {
      const status = getErrorStatus(error);
      const retryable = status === 403 || status === 429 || status === 502 || status === 503;
      if (!retryable || attempt >= retries) throw error;
      await sleep(Math.min(1000 * 2 ** attempt, 15000));
      attempt++;
    }
  }
}

export class RepositoryNotFoundError extends Error {
  constructor(owner: string, repo: string) {
    super(`GitHub repository ${owner}/${repo} was not found or is not accessible.`);
    this.name = "RepositoryNotFoundError";
  }
}

export async function fetchRepositoryMetadata(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<RepositoryMetadata> {
  let data;
  try {
    ({ data } = await withRetry(() => octokit.rest.repos.get({ owner, repo })));
  } catch (error) {
    if (getErrorStatus(error) === 404) throw new RepositoryNotFoundError(owner, repo);
    throw error;
  }

  return {
    githubId: data.id,
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    homepageUrl: data.homepage || null,
    defaultBranch: data.default_branch,
    license: data.license
      ? data.license.spdx_id && data.license.spdx_id !== "NOASSERTION"
        ? data.license.spdx_id
        : data.license.name
      : null,
    visibility: data.private ? "PRIVATE" : "PUBLIC",
    isArchived: data.archived ?? false,
    stars: data.stargazers_count ?? 0,
    forks: data.forks_count ?? 0,
    watchers: data.subscribers_count ?? data.watchers_count ?? 0,
    openIssues: data.open_issues_count ?? 0,
    sizeKb: data.size ?? 0,
    topics: data.topics ?? [],
    githubCreatedAt: new Date(data.created_at),
    githubUpdatedAt: new Date(data.updated_at),
    githubOwnerId: data.owner.id,
    githubOwnerLogin: data.owner.login,
    githubOwnerAvatarUrl: data.owner.avatar_url ?? null,
    githubOwnerType: data.owner.type === "Organization" ? "Organization" : "User",
  };
}

export async function fetchRepositoryLanguages(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<RepositoryLanguages> {
  const { data } = await withRetry(() => octokit.rest.repos.listLanguages({ owner, repo }));

  const total = Object.values(data).reduce((sum: number, bytes) => sum + (bytes ?? 0), 0);
  if (total === 0) return {};

  const percentages: RepositoryLanguages = {};
  for (const [language, bytes] of Object.entries(data)) {
    percentages[language] = Math.round(((bytes ?? 0) / total) * 1000) / 10;
  }
  return percentages;
}
