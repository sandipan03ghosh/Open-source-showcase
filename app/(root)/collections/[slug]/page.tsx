import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { REPOSITORY_CARD_SELECT } from "@/lib/repository-select";
import { Badge } from "@/components/ui/badge";
import RepositoryCard from "@/components/RepositoryCard";
import RemoveFromCollectionButton from "@/components/RemoveFromCollectionButton";
import DeleteCollectionButton from "@/components/DeleteCollectionButton";

type PageParams = { slug: string };

async function getCollection(slug: string) {
  return prisma.collection.findUnique({
    where: { slug },
    include: {
      owner: { select: { username: true } },
      items: {
        orderBy: { position: "asc" },
        include: { repository: { select: { id: true, ...REPOSITORY_CARD_SELECT } } },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return { title: "Collection not found" };
  return { title: collection.name, description: collection.description ?? undefined };
}

const Page = async ({ params }: { params: Promise<PageParams> }) => {
  const { slug } = await params;
  const [collection, session] = await Promise.all([getCollection(slug), auth()]);

  if (!collection) return notFound();

  const isOwner = session?.id === collection.ownerId;
  if (collection.visibility === "PRIVATE" && !isOwner) return notFound();

  return (
    <>
      <section className="hero-container !min-h-[200px]">
        <p className="tag">by @{collection.owner.username}</p>
        <h1 className="heading !text-[32px]">{collection.name}</h1>
        {collection.description && <p className="sub-heading">{collection.description}</p>}
      </section>

      <section className="section-container">
        <div className="flex-between mb-7">
          <div className="flex items-center gap-2">
            {collection.visibility === "PRIVATE" && <Badge variant="outline">Private</Badge>}
            {collection.isFeatured && <Badge variant="secondary">Featured</Badge>}
            <span className="text-14-normal">{collection.items.length} repositories</span>
          </div>
          {isOwner && <DeleteCollectionButton collectionId={collection.id} />}
        </div>

        <ul className="card-grid">
          {collection.items.length > 0 ? (
            collection.items.map((item) => (
              <RepositoryCard
                key={item.id}
                repository={item.repository}
                actions={isOwner ? <RemoveFromCollectionButton collectionItemId={item.id} /> : undefined}
              />
            ))
          ) : (
            <p className="no-result">No repositories in this collection yet.</p>
          )}
        </ul>
      </section>
    </>
  );
};

export default Page;
