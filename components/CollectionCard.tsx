import Link from "next/link";
import { Lock, Star } from "lucide-react";

export interface CollectionCardData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  isFeatured: boolean;
  owner: { username: string | null };
  _count: { items: number };
}

const CollectionCard = ({ collection }: { collection: CollectionCardData }) => {
  return (
    <li className="repo-card">
      <div className="flex-between">
        <span className="repo-card_date">{collection._count.items} repositories</span>
        {collection.visibility === "PRIVATE" && (
          <Lock className="size-4 text-muted-foreground" />
        )}
        {collection.isFeatured && <Star className="size-4 fill-primary text-primary" />}
      </div>

      <Link href={`/collections/${collection.slug}`}>
        <h3 className="text-[20px] font-semibold text-foreground line-clamp-1 mt-3">
          {collection.name}
        </h3>
      </Link>

      {collection.description && (
        <p className="repo-card_desc">{collection.description}</p>
      )}

      <p className="text-14-normal mt-3">by @{collection.owner.username}</p>
    </li>
  );
};

export default CollectionCard;
