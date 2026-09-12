import "server-only";

import type {
  GithubCommit,
  GithubContributor,
  GithubOrganizationMember,
  GithubOrganizationProfile,
  GithubRelease,
} from "@/lib/github/types";

const GITHUB_API = "https://api.github.com";
const REVALIDATE_SECONDS = 3600;

function authHeaders(accessToken?: string, accept = "application/vnd.github+json") {
  const token = accessToken || process.env.GITHUB_SYNC_TOKEN;
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "open-source-showcase",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Live, cached reads that back the repository detail page. Never persisted
 * to Postgres — always fetched fresh (within the cache window) from GitHub.
 * Every function fails soft (returns null/[]) so a GitHub outage or rate
 * limit never breaks the page.
 */
export async function getRepositoryReadme(
  owner: string,
  repo: string,
  accessToken?: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
      headers: authHeaders(accessToken, "application/vnd.github.raw"),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function getRepositoryContributors(
  owner: string,
  repo: string,
  accessToken?: string,
  limit = 12,
): Promise<GithubContributor[]> {
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contributors?per_page=${limit}&anon=false`,
      { headers: authHeaders(accessToken), next: { revalidate: REVALIDATE_SECONDS } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      login?: string;
      avatar_url?: string;
      html_url?: string;
      contributions?: number;
    }>;
    return data
      .filter((c) => c.login)
      .map((c) => ({
        login: c.login!,
        avatarUrl: c.avatar_url ?? "",
        htmlUrl: c.html_url ?? `https://github.com/${c.login}`,
        contributions: c.contributions ?? 0,
      }));
  } catch {
    return [];
  }
}

export async function getRepositoryReleases(
  owner: string,
  repo: string,
  accessToken?: string,
  limit = 5,
): Promise<GithubRelease[]> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/releases?per_page=${limit}`, {
      headers: authHeaders(accessToken),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      tag_name: string;
      name: string | null;
      body: string | null;
      published_at: string | null;
      html_url: string;
    }>;
    return data.map((r) => ({
      tagName: r.tag_name,
      name: r.name,
      body: r.body,
      publishedAt: r.published_at,
      htmlUrl: r.html_url,
    }));
  } catch {
    return [];
  }
}

export async function getLatestCommits(
  owner: string,
  repo: string,
  accessToken?: string,
  limit = 10,
): Promise<GithubCommit[]> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=${limit}`, {
      headers: authHeaders(accessToken),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      sha: string;
      html_url: string;
      commit: { message: string; author: { name: string; date: string } | null };
      author: { avatar_url: string } | null;
    }>;
    return data.map((c) => ({
      sha: c.sha,
      message: c.commit.message.split("\n")[0] ?? c.commit.message,
      authorName: c.commit.author?.name ?? "Unknown",
      authorAvatarUrl: c.author?.avatar_url ?? null,
      date: c.commit.author?.date ?? null,
      htmlUrl: c.html_url,
    }));
  } catch {
    return [];
  }
}

export async function getOrganizationProfile(
  login: string,
  accessToken?: string,
): Promise<GithubOrganizationProfile | null> {
  try {
    const res = await fetch(`${GITHUB_API}/orgs/${login}`, {
      headers: authHeaders(accessToken),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      login: string;
      name: string | null;
      avatar_url: string;
      description: string | null;
      blog: string | null;
      html_url: string;
      public_repos: number;
      followers: number;
    };
    return {
      login: data.login,
      name: data.name,
      avatarUrl: data.avatar_url,
      description: data.description,
      websiteUrl: data.blog || null,
      htmlUrl: data.html_url,
      publicRepos: data.public_repos,
      followers: data.followers,
    };
  } catch {
    return null;
  }
}

export async function getOrganizationMembers(
  login: string,
  accessToken?: string,
  limit = 24,
): Promise<GithubOrganizationMember[]> {
  try {
    const res = await fetch(`${GITHUB_API}/orgs/${login}/public_members?per_page=${limit}`, {
      headers: authHeaders(accessToken),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      login: string;
      avatar_url: string;
      html_url: string;
    }>;
    return data.map((m) => ({ login: m.login, avatarUrl: m.avatar_url, htmlUrl: m.html_url }));
  } catch {
    return [];
  }
}
