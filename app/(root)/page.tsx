import Link from "next/link";

import SearchForm from "@/components/SearchForm";
import RepositoryCard from "@/components/RepositoryCard";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { REPOSITORY_CARD_SELECT } from "@/lib/repository-select";

export default async function Home() {
  const repositories = await prisma.repository.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    select: REPOSITORY_CARD_SELECT,
  });

  return (
    <>
      <section className="hero-container">
        <p className="tag">Discover. Showcase. Analyze. Collaborate.</p>
        <h1 className="heading">Find your next open source project</h1>
        <p className="sub-heading">
          Connect your GitHub account, showcase your repositories, and discover great open-source
          work from developers around the world.
        </p>
        <SearchForm />
      </section>

      <section className="section-container">
        <div className="flex-between">
          <p className="text-30-semibold">Recently showcased</p>
          <Button variant="outline" asChild>
            <Link href="/search">Browse all</Link>
          </Button>
        </div>

        <ul className="mt-7 card-grid">
          {repositories.length > 0 ? (
            repositories.map((repository) => (
              <RepositoryCard key={repository.id} repository={repository} />
            ))
          ) : (
            <p className="no-result">No repositories showcased yet.</p>
          )}
        </ul>
      </section>
    </>
  );
}
