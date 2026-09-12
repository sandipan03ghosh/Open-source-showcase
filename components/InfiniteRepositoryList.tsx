"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import RepositoryCard, { type RepositoryCardData } from "@/components/RepositoryCard";

interface RepositoriesResponse {
  repositories: RepositoryCardData[];
  nextPage: number | null;
}

const InfiniteRepositoryList = ({
  initialRepositories,
  initialNextPage,
  queryString,
}: {
  initialRepositories: RepositoryCardData[];
  initialNextPage: number | null;
  queryString: string;
}) => {
  const [repositories, setRepositories] = useState(initialRepositories);
  const [nextPage, setNextPage] = useState(initialNextPage);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (nextPage === null || isLoading) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams(queryString);
      params.set("page", String(nextPage));
      const res = await fetch(`/api/repositories?${params.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as RepositoriesResponse;
      setRepositories((prev) => [...prev, ...data.repositories]);
      setNextPage(data.nextPage);
    } catch (error) {
      console.error("Failed to load more repositories:", error);
    } finally {
      setIsLoading(false);
    }
  }, [nextPage, isLoading, queryString]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "400px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <ul className="mt-7 card-grid">
        {repositories.length > 0 ? (
          repositories.map((repository) => (
            <RepositoryCard key={repository.id} repository={repository} />
          ))
        ) : (
          <p className="no-result">No repositories match these filters.</p>
        )}
      </ul>

      {nextPage !== null && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isLoading && <span className="text-14-normal">Loading more...</span>}
        </div>
      )}
    </>
  );
};

export default InfiniteRepositoryList;
