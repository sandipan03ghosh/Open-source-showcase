import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { repositorySearchParamsSchema } from "@/lib/validation";
import {
  buildRepositoryWhere,
  getFilterOptions,
  getRepositoryOrderBy,
  REPOSITORY_PAGE_SIZE,
} from "@/lib/search";
import { REPOSITORY_CARD_SELECT } from "@/lib/repository-select";
import SearchFilters from "@/components/SearchFilters";
import InfiniteRepositoryList from "@/components/InfiniteRepositoryList";

export const metadata: Metadata = { title: "Search repositories" };

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const rawParams = await searchParams;
  const normalized = Object.fromEntries(
    Object.entries(rawParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );

  const parsed = repositorySearchParamsSchema.safeParse(normalized);
  const values = parsed.success ? parsed.data : repositorySearchParamsSchema.parse({});

  const [filterOptions, repositories] = await Promise.all([
    getFilterOptions(),
    prisma.repository.findMany({
      where: buildRepositoryWhere(values),
      orderBy: getRepositoryOrderBy(values.sort),
      skip: values.page * REPOSITORY_PAGE_SIZE,
      take: REPOSITORY_PAGE_SIZE,
      select: REPOSITORY_CARD_SELECT,
    }),
  ]);

  const nextPage = repositories.length === REPOSITORY_PAGE_SIZE ? values.page + 1 : null;

  const queryStringParams = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (key === "page") return;
    if (value === undefined || value === false || value === "") return;
    queryStringParams.set(key, String(value));
  });
  const queryString = queryStringParams.toString();

  return (
    <>
      <section className="hero-container !min-h-[180px]">
        <h1 className="heading !text-[32px]">Search repositories</h1>
      </section>

      <section className="section-container">
        <SearchFilters
          values={values}
          languages={filterOptions.languages}
          technologies={filterOptions.technologies}
          licenses={filterOptions.licenses}
        />

        <InfiniteRepositoryList
          key={queryString}
          initialRepositories={repositories}
          initialNextPage={nextPage}
          queryString={queryString}
        />
      </section>
    </>
  );
};

export default Page;
