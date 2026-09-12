import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * We deliberately don't store historical star/fork snapshots (lean schema,
 * no history/aggregation tables). So "recent star growth" is approximated
 * instead of measured directly: raw counts are log-dampened (so a repo with
 * 50k stars can't dominate forever just by existing) and then multiplied by
 * a freshness decay based on when GitHub last saw activity on it — a repo
 * that's gone stale loses trending rank even if its star count stays high.
 */
const WEIGHTS = {
  stars: 10,
  forks: 5,
  views: 1,
  bookmarks: 3,
  likes: 2,
  comments: 4,
  reviews: 5,
};

const DECAY_HALF_LIFE_DAYS = 14;

function freshnessDecay(referenceDate: Date | null): number {
  if (!referenceDate) return 0.5;
  const days = (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
  return 1 / (1 + Math.max(days, 0) / DECAY_HALF_LIFE_DAYS);
}

function computeScore(input: {
  stars: number;
  forks: number;
  viewCount: number;
  bookmarks: number;
  likes: number;
  comments: number;
  reviews: number;
  githubUpdatedAt: Date | null;
}): number {
  const engagement =
    Math.log1p(input.stars) * WEIGHTS.stars +
    Math.log1p(input.forks) * WEIGHTS.forks +
    Math.log1p(input.viewCount) * WEIGHTS.views +
    input.bookmarks * WEIGHTS.bookmarks +
    input.likes * WEIGHTS.likes +
    input.comments * WEIGHTS.comments +
    input.reviews * WEIGHTS.reviews;

  return engagement * freshnessDecay(input.githubUpdatedAt);
}

export async function recomputeTrendingScores(): Promise<{ updated: number }> {
  const repositories = await prisma.repository.findMany({
    where: { isArchived: false },
    select: {
      id: true,
      stars: true,
      forks: true,
      viewCount: true,
      githubUpdatedAt: true,
      _count: { select: { bookmarks: true, likes: true, comments: true, reviews: true } },
    },
  });

  const now = new Date();

  await prisma.$transaction(
    repositories.map((repository) =>
      prisma.repository.update({
        where: { id: repository.id },
        data: {
          trendingScore: computeScore({
            stars: repository.stars,
            forks: repository.forks,
            viewCount: repository.viewCount,
            bookmarks: repository._count.bookmarks,
            likes: repository._count.likes,
            comments: repository._count.comments,
            reviews: repository._count.reviews,
            githubUpdatedAt: repository.githubUpdatedAt,
          }),
          trendingComputedAt: now,
        },
      }),
    ),
  );

  return { updated: repositories.length };
}
