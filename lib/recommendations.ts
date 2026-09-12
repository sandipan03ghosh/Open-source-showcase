import "server-only";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { REPOSITORY_CARD_SELECT } from "@/lib/repository-select";

const CANDIDATE_POOL_SIZE = 50;

/**
 * Content-based "similar repositories" — on-the-fly topic/technology/
 * language overlap scoring against a small candidate pool, no dedicated
 * recommendations table or offline job.
 */
export async function getSimilarRepositories(repositoryId: string, limit = 6) {
  const target = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: { topics: true, technologies: true, languageNames: true },
  });
  if (!target) return [];

  const overlapClauses: Prisma.RepositoryWhereInput[] = [];
  if (target.topics.length > 0) overlapClauses.push({ topics: { hasSome: target.topics } });
  if (target.technologies.length > 0)
    overlapClauses.push({ technologies: { hasSome: target.technologies } });
  if (target.languageNames.length > 0)
    overlapClauses.push({ languageNames: { hasSome: target.languageNames } });

  const baseWhere: Prisma.RepositoryWhereInput = {
    id: { not: repositoryId },
    isArchived: false,
  };

  const candidates = await prisma.repository.findMany({
    where: overlapClauses.length > 0 ? { ...baseWhere, OR: overlapClauses } : baseWhere,
    orderBy: { stars: "desc" },
    take: CANDIDATE_POOL_SIZE,
    select: { ...REPOSITORY_CARD_SELECT, languageNames: true },
  });

  const scored = candidates
    .map((candidate) => {
      const sharedTopics = candidate.topics.filter((t) => target.topics.includes(t)).length;
      const sharedTech = candidate.technologies.filter((t) =>
        target.technologies.includes(t),
      ).length;
      const sharedLanguages = candidate.languageNames.filter((l) =>
        target.languageNames.includes(l),
      ).length;

      return {
        candidate,
        score: sharedTopics * 2 + sharedTech * 2 + sharedLanguages,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ candidate }) => candidate);

  return scored;
}
