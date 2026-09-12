import "server-only";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { RepositorySearchParamsInput } from "@/lib/validation";

export const REPOSITORY_PAGE_SIZE = 24;

export function buildRepositoryWhere(
  params: RepositorySearchParamsInput,
): Prisma.RepositoryWhereInput {
  const and: Prisma.RepositoryWhereInput[] = [];

  if (params.query) {
    const query = params.query;
    and.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { githubOwnerLogin: { contains: query, mode: "insensitive" } },
        { topics: { has: query.toLowerCase() } },
      ],
    });
  }

  if (params.language) and.push({ languageNames: { has: params.language } });
  if (params.technology) and.push({ technologies: { has: params.technology } });
  if (params.topic) and.push({ topics: { has: params.topic.toLowerCase() } });
  if (params.license) and.push({ license: params.license });
  if (params.difficulty) and.push({ difficulty: params.difficulty });
  if (params.featured) and.push({ isFeatured: true });
  if (params.org) {
    and.push({ githubOwnerLogin: params.org, githubOwnerType: "Organization" });
  }
  if (params.developer) {
    and.push({ owner: { username: params.developer } });
  }

  return and.length > 0 ? { AND: and } : {};
}

export function getRepositoryOrderBy(
  sort: RepositorySearchParamsInput["sort"],
): Prisma.RepositoryOrderByWithRelationInput[] {
  switch (sort) {
    case "trending":
      return [{ trendingScore: { sort: "desc", nulls: "last" } }, { stars: "desc" }];
    case "recent-updated":
      return [{ githubUpdatedAt: { sort: "desc", nulls: "last" } }];
    case "recent-added":
      return [{ createdAt: "desc" }];
    case "stars":
    default:
      return [{ stars: "desc" }];
  }
}

/**
 * Distinct filter option values for the search filter bar (bounded sets
 * only — language/license are small enough to list; topic/org/developer
 * stay free-text inputs on the UI side instead of exhaustive dropdowns).
 */
export async function getFilterOptions() {
  const [rows, licenseRows] = await Promise.all([
    prisma.repository.findMany({ select: { languageNames: true, technologies: true } }),
    prisma.repository.findMany({
      distinct: ["license"],
      where: { license: { not: null } },
      select: { license: true },
      orderBy: { license: "asc" },
    }),
  ]);

  const languages = new Set<string>();
  const technologies = new Set<string>();
  for (const row of rows) {
    row.languageNames.forEach((l) => languages.add(l));
    row.technologies.forEach((t) => technologies.add(t));
  }

  return {
    languages: Array.from(languages).sort(),
    technologies: Array.from(technologies).sort(),
    licenses: licenseRows.map((r) => r.license).filter((l): l is string => Boolean(l)),
  };
}
