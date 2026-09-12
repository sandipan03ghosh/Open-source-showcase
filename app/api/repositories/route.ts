import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { buildRepositoryWhere, getRepositoryOrderBy, REPOSITORY_PAGE_SIZE } from "@/lib/search";
import { repositorySearchParamsSchema } from "@/lib/validation";
import { REPOSITORY_CARD_SELECT } from "@/lib/repository-select";

export async function GET(request: NextRequest) {
  const parsed = repositorySearchParamsSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search parameters." }, { status: 400 });
  }

  const { page, ...filters } = parsed.data;

  const repositories = await prisma.repository.findMany({
    where: buildRepositoryWhere(filters),
    orderBy: getRepositoryOrderBy(filters.sort),
    skip: page * REPOSITORY_PAGE_SIZE,
    take: REPOSITORY_PAGE_SIZE,
    select: REPOSITORY_CARD_SELECT,
  });

  return NextResponse.json({
    repositories,
    nextPage: repositories.length === REPOSITORY_PAGE_SIZE ? page + 1 : null,
  });
}
