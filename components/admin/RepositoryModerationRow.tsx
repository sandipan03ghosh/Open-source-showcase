"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useToast } from "@/hooks/use-toast";
import {
  deleteRepositoryAdmin,
  setRepositoryArchived,
  setRepositoryFeatured,
} from "@/lib/actions/admin";

export interface AdminRepositoryRowData {
  id: string;
  fullName: string;
  githubOwnerLogin: string;
  name: string;
  stars: number;
  isFeatured: boolean;
  isArchived: boolean;
  owner: { username: string | null };
}

const RepositoryModerationRow = ({
  repository,
  canDelete,
}: {
  repository: AdminRepositoryRowData;
  canDelete: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const run = (action: Promise<{ status: string; error: string }>) => {
    startTransition(async () => {
      const result = await action;
      if (result.status === "SUCCESS") {
        router.refresh();
      } else {
        toast({ title: "Action failed", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete ${repository.fullName}? This can't be undone.`)) return;
    startTransition(async () => {
      const result = await deleteRepositoryAdmin(repository.id);
      if (result.status === "SUCCESS") {
        router.refresh();
      } else {
        toast({ title: "Couldn't delete repository", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4">
        <Link
          href={`/repo/${repository.githubOwnerLogin}/${repository.name}`}
          className="text-[15px] font-medium text-foreground hover:text-primary"
        >
          {repository.fullName}
        </Link>
        <p className="text-14-normal">showcased by @{repository.owner.username}</p>
      </td>
      <td className="py-3 pr-4 text-14-normal">{repository.stars.toLocaleString()}</td>
      <td className="py-3 pr-4">
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(setRepositoryFeatured(repository.id, !repository.isFeatured))}
          className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
        >
          {repository.isFeatured ? "Unfeature" : "Feature"}
        </button>
      </td>
      <td className="py-3 pr-4">
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(setRepositoryArchived(repository.id, !repository.isArchived))}
          className="text-sm font-medium text-muted-foreground hover:underline disabled:opacity-50"
        >
          {repository.isArchived ? "Unarchive" : "Archive"}
        </button>
      </td>
      <td className="py-3 pr-4">
        {canDelete && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="text-sm font-medium text-destructive hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </td>
    </tr>
  );
};

export default RepositoryModerationRow;
