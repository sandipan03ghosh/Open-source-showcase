"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useToast } from "@/hooks/use-toast";
import { resolveReport } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";

export interface AdminReportRowData {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: Date | string;
  reporter: { username: string | null };
  repository: { fullName: string; githubOwnerLogin: string; name: string } | null;
}

const ReportRow = ({ report }: { report: AdminReportRowData }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleResolve = (status: "RESOLVED" | "DISMISSED") => {
    startTransition(async () => {
      const result = await resolveReport(report.id, status);
      if (result.status === "SUCCESS") {
        router.refresh();
      } else {
        toast({ title: "Couldn't update report", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex-between">
        <span className="text-14-normal">
          {report.targetType} · reported by @{report.reporter.username} ·{" "}
          {formatDate(report.createdAt)}
        </span>
        <span className="text-14-normal font-medium">{report.status}</span>
      </div>

      {report.repository && (
        <p className="text-14-normal mt-1">
          Target:{" "}
          <Link
            href={`/repo/${report.repository.githubOwnerLogin}/${report.repository.name}`}
            className="text-primary hover:underline"
          >
            {report.repository.fullName}
          </Link>
        </p>
      )}

      <p className="mt-2 text-[15px] text-foreground">{report.reason}</p>

      {report.status === "OPEN" && (
        <div className="flex gap-3 mt-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleResolve("RESOLVED")}
            className="text-sm font-medium text-success hover:underline disabled:opacity-50"
          >
            Mark resolved
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleResolve("DISMISSED")}
            className="text-sm font-medium text-muted-foreground hover:underline disabled:opacity-50"
          >
            Dismiss
          </button>
        </div>
      )}
    </li>
  );
};

export default ReportRow;
