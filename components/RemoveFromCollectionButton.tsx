"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { removeRepositoryFromCollection } from "@/lib/actions/collection";

const RemoveFromCollectionButton = ({ collectionItemId }: { collectionItemId: string }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleClick = () => {
    startTransition(async () => {
      const result = await removeRepositoryFromCollection(collectionItemId);
      if (result.status === "SUCCESS") {
        router.refresh();
      } else {
        toast({ title: "Couldn't remove item", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="absolute top-3 right-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-destructive transition-colors disabled:opacity-50"
      aria-label="Remove from collection"
    >
      <X className="size-4" />
    </button>
  );
};

export default RemoveFromCollectionButton;
