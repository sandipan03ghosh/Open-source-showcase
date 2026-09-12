import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { REPOSITORY_CARD_SELECT } from "@/lib/repository-select";
import RepositoryCard from "@/components/RepositoryCard";

export const metadata: Metadata = { title: "Trending repositories" };

const Page = async () => {
  const repositories = await prisma.repository.findMany({
    where: { isArchived: false, trendingScore: { not: null } },
    orderBy: { trendingScore: "desc" },
    take: 48,
    select: REPOSITORY_CARD_SELECT,
  });

  return (
    <>
      <section className="hero-container !min-h-[180px]">
        <h1 className="heading !text-[32px]">Trending repositories</h1>
        <p className="sub-heading">
          Ranked by recent stars and forks, views, community engagement, and freshness — not just
          total star count.
        </p>
      </section>

      <section className="section-container">
        <ul className="card-grid">
          {repositories.length > 0 ? (
            repositories.map((repository) => (
              <RepositoryCard key={repository.id} repository={repository} />
            ))
          ) : (
            <p className="no-result">
              Trending scores haven&apos;t been computed yet — check back soon.
            </p>
          )}
        </ul>
      </section>
    </>
  );
};

export default Page;
