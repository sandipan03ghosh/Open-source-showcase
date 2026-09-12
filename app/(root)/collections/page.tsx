import Link from "next/link";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import CollectionCard from "@/components/CollectionCard";

export const metadata: Metadata = { title: "Collections" };

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) => {
  const { owner } = await searchParams;
  const session = await auth();

  const collections = await prisma.collection.findMany({
    where: owner
      ? { owner: { username: owner }, OR: [{ visibility: "PUBLIC" }, { ownerId: session?.id }] }
      : { visibility: "PUBLIC" },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 48,
    include: { owner: { select: { username: true } }, _count: { select: { items: true } } },
  });

  return (
    <>
      <section className="hero-container !min-h-[180px]">
        <h1 className="heading !text-[32px]">
          {owner ? `${owner}'s collections` : "Collections"}
        </h1>
        <p className="sub-heading">Curated groups of repositories around a theme or stack.</p>
      </section>

      <section className="section-container">
        <div className="flex-between mb-7">
          <p className="text-30-semibold">Browse</p>
          {session?.user && (
            <Button asChild>
              <Link href="/collections/new">New collection</Link>
            </Button>
          )}
        </div>

        <ul className="card-grid">
          {collections.length > 0 ? (
            collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))
          ) : (
            <p className="no-result">No collections yet.</p>
          )}
        </ul>
      </section>
    </>
  );
};

export default Page;
