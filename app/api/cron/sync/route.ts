import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { syncRepository } from "@/lib/github/sync";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 10;
const STALE_AFTER_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Vercel Cron target. Always incremental: only repos that have never synced
 * or are past the staleness window are picked, in one small batch per run.
 * There is no "resync everything" mode.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staleBefore = new Date(Date.now() - STALE_AFTER_MS);

  const repositories = await prisma.repository.findMany({
    where: {
      syncStatus: { not: "SYNCING" },
      OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: staleBefore } }],
    },
    orderBy: { lastSyncedAt: { sort: "asc", nulls: "first" } },
    take: BATCH_SIZE,
    select: { id: true, fullName: true },
  });

  const results = await Promise.allSettled(
    repositories.map((repository) => syncRepository(repository.id)),
  );

  const summary = repositories.map((repository, index) => {
    const result = results[index];
    return {
      repository: repository.fullName,
      status: result?.status === "fulfilled" ? result.value.status : "failed",
    };
  });

  return NextResponse.json({ checked: summary.length, results: summary });
}
