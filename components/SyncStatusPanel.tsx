"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { refreshRepository } from "@/lib/actions/repository";

type SyncStatus = "IDLE" | "SYNCING" | "FAILED";

const STATUS_CONFIG: Record<SyncStatus, { label: string; className: string }> = {
  IDLE: { label: "Synced", className: "sync-badge-idle" },
  SYNCING: { label: "Syncing...", className: "sync-badge-syncing" },
  FAILED: { label: "Sync failed", className: "sync-badge-failed" },
};

const SyncStatusPanel = ({
  repositoryId,
  isOwner,
  syncStatus,
  syncError,
  lastSyncedAt,
}: {
  repositoryId: string;
  isOwner: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: Date | string | null;
}) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshRepository(repositoryId);
      if (result.status === "SUCCESS") {
        toast({ title: "Sync complete", description: "Repository data is up to date." });
        router.refresh();
      } else {
        toast({ title: "Sync failed", description: result.error, variant: "destructive" });
      }
    });
  };

  const config = STATUS_CONFIG[syncStatus];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
      <span className="text-14-normal">
        {lastSyncedAt ? `Last synced ${formatDate(lastSyncedAt)}` : "Not yet synced"}
      </span>
      {syncStatus === "FAILED" && syncError && (
        <span className="text-destructive text-sm">{syncError}</span>
      )}
      {isOwner && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending || syncStatus === "SYNCING"}
          className="ml-auto gap-2"
        >
          <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
          Refresh
        </Button>
      )}
    </div>
  );
};

export default SyncStatusPanel;
