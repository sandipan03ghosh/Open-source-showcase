import type { Prisma } from "@prisma/client";

/** Shared field selection for anywhere a RepositoryCard is rendered from a query. */
export const REPOSITORY_CARD_SELECT = {
  id: true,
  name: true,
  fullName: true,
  description: true,
  githubOwnerLogin: true,
  githubOwnerAvatarUrl: true,
  stars: true,
  forks: true,
  license: true,
  topics: true,
  technologies: true,
  viewCount: true,
  createdAt: true,
} satisfies Prisma.RepositorySelect;
