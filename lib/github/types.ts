export interface RepositoryMetadata {
  githubId: number;
  name: string;
  fullName: string;
  description: string | null;
  homepageUrl: string | null;
  defaultBranch: string;
  license: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  isArchived: boolean;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  sizeKb: number;
  topics: string[];
  githubCreatedAt: Date;
  githubUpdatedAt: Date;
  githubOwnerId: number;
  githubOwnerLogin: string;
  githubOwnerAvatarUrl: string | null;
  githubOwnerType: "User" | "Organization";
}

export interface RepositoryLanguages {
  [language: string]: number;
}

export interface GithubContributor {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  contributions: number;
}

export interface GithubRelease {
  tagName: string;
  name: string | null;
  body: string | null;
  publishedAt: string | null;
  htmlUrl: string;
}

export interface GithubCommit {
  sha: string;
  message: string;
  authorName: string;
  authorAvatarUrl: string | null;
  date: string | null;
  htmlUrl: string;
}

export interface GithubOrganizationProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  description: string | null;
  websiteUrl: string | null;
  htmlUrl: string;
  publicRepos: number;
  followers: number;
}

export interface GithubOrganizationMember {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
}
