"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addRepositoryToCollection } from "@/lib/actions/collection";

const AddToCollectionMenu = ({
  repositoryId,
  collections,
}: {
  repositoryId: string;
  collections: Array<{ id: string; name: string }>;
}) => {
  const [selected, setSelected] = useState(collections[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  if (collections.length === 0) {
    return (
      <Link href="/collections/new" className="text-sm font-medium text-primary hover:underline">
        Create a collection to save this repository
      </Link>
    );
  }

  const handleClick = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await addRepositoryToCollection(selected, repositoryId);
      if (result.status === "SUCCESS") {
        toast({ title: "Added to collection" });
      } else {
        toast({ title: "Couldn't add to collection", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="repo-form_input !mt-0 !py-2 text-sm bg-background"
      >
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.name}
          </option>
        ))}
      </select>
      <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={isPending} className="gap-1.5">
        <FolderPlus className="size-4" />
        Save
      </Button>
    </div>
  );
};

export default AddToCollectionMenu;
