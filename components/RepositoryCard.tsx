import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, Star, GitFork } from "lucide-react";

import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface RepositoryCardData {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  githubOwnerLogin: string;
  githubOwnerAvatarUrl: string | null;
  stars: number;
  forks: number;
  license: string | null;
  topics: string[];
  technologies: string[];
  viewCount: number;
  createdAt: Date | string;
}

const RepositoryCard = ({
  repository,
  actions,
}: {
  repository: RepositoryCardData;
  actions?: ReactNode;
}) => {
  const tags = [...repository.technologies, ...repository.topics].slice(0, 3);

  return (
    <li className="repo-card group relative">
      {actions}
      <div className="flex-between">
        <p className="repo-card_date">{formatDate(repository.createdAt)}</p>
        <div className="flex gap-1.5 items-center text-muted-foreground">
          <Eye className="size-4" />
          <span className="text-sm font-medium">{repository.viewCount}</span>
        </div>
      </div>

      <div className="flex-between mt-4 gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`https://github.com/${repository.githubOwnerLogin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground line-clamp-1"
          >
            {repository.githubOwnerLogin}
          </Link>
          <Link href={`/repo/${repository.githubOwnerLogin}/${repository.name}`}>
            <h3 className="text-[20px] font-semibold text-foreground line-clamp-1 mt-0.5">
              {repository.name}
            </h3>
          </Link>
        </div>
        {repository.githubOwnerAvatarUrl && (
          <Link href={`/repo/${repository.githubOwnerLogin}/${repository.name}`}>
            <Image
              src={repository.githubOwnerAvatarUrl}
              alt={repository.githubOwnerLogin}
              width={44}
              height={44}
              className="rounded-full border border-border"
            />
          </Link>
        )}
      </div>

      <Link href={`/repo/${repository.githubOwnerLogin}/${repository.name}`}>
        <p className="repo-card_desc">{repository.description || "No description provided."}</p>
      </Link>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex-between gap-3 mt-5">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <span className="flex items-center gap-1">
            <Star className="size-4" />
            {repository.stars.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="size-4" />
            {repository.forks.toLocaleString()}
          </span>
          {repository.license && <span className="line-clamp-1">{repository.license}</span>}
        </div>
        <Button className="repo-card_btn" variant="ghost" asChild>
          <Link href={`/repo/${repository.githubOwnerLogin}/${repository.name}`}>Details</Link>
        </Button>
      </div>
    </li>
  );
};

export const RepositoryCardSkeleton = () => (
  <>
    {[0, 1, 2, 3, 4, 5].map((index: number) => (
      <li key={cn("skeleton", index)}>
        <Skeleton className="repo-card_skeleton" />
      </li>
    ))}
  </>
);

export default RepositoryCard;
