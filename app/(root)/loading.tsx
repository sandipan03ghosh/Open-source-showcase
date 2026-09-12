import { RepositoryCardSkeleton } from "@/components/RepositoryCard";

export default function Loading() {
  return (
    <section className="section-container">
      <div className="h-8 w-56 rounded-md bg-muted animate-pulse mb-7" />
      <ul className="card-grid">
        <RepositoryCardSkeleton />
      </ul>
    </section>
  );
}
