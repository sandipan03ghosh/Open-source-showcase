"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteCollection } from "@/lib/actions/collection";

const DeleteCollectionButton = ({ collectionId }: { collectionId: string }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleClick = () => {
    if (!confirm("Delete this collection? This can't be undone.")) return;

    startTransition(async () => {
      const result = await deleteCollection(collectionId);
      if (result.status === "SUCCESS") {
        toast({ title: "Collection deleted" });
        router.push("/collections");
      } else {
        toast({ title: "Couldn't delete collection", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={isPending} className="gap-2">
      <Trash2 className="size-4" />
      Delete collection
    </Button>
  );
};

export default DeleteCollectionButton;
