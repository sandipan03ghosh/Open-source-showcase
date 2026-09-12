import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Star,
  GitFork,
  Eye,
  CircleAlert,
  ExternalLink,
  HardDrive,
  CalendarClock,
  Bookmark,
  Heart,
} from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ReadmeViewer from "@/components/ReadmeViewer";
import SyncStatusPanel from "@/components/SyncStatusPanel";
import RepositoryMediaGallery from "@/components/RepositoryMediaGallery";
import RepositoryViewTracker from "@/components/RepositoryViewTracker";
import EngagementButton from "@/components/EngagementButton";
import AddToCollectionMenu from "@/components/AddToCollectionMenu";
import ReportButton from "@/components/ReportButton";
import ReviewSection from "@/components/ReviewSection";
import CommentThread from "@/components/CommentThread";
import { toggleBookmark, toggleLike } from "@/lib/actions/engagement";
import {
  getLatestCommits,
  getRepositoryContributors,
  getRepositoryReadme,
  getRepositoryReleases,
} from "@/lib/github/live";
import { getSimilarRepositories } from "@/lib/recommendations";
import RepositoryCard from "@/components/RepositoryCard";

type PageParams = { owner: string; repo: string };

async function getRepository(owner: string, repo: string) {
  return prisma.repository.findFirst({
    where: { fullName: { equals: `${owner}/${repo}`, mode: "insensitive" } },
    include: {
      media: { orderBy: { order: "asc" } },
      _count: { select: { bookmarks: true, likes: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { owner, repo } = await params;
  const repository = await getRepository(owner, repo);
  if (!repository) return { title: "Repository not found" };

  return {
    title: `${repository.fullName} · Open Source Showcase`,
    description: repository.description ?? `Explore ${repository.fullName} on Open Source Showcase.`,
  };
}

const Page = async ({ params }: { params: Promise<PageParams> }) => {
  const { owner, repo } = await params;
  const [repository, session] = await Promise.all([getRepository(owner, repo), auth()]);

  if (!repository) return notFound();

  const isOwner = session?.id === repository.ownerId;

  const [readme, contributors, releases, commits, similarRepositories, myBookmark, myLike] =
    await Promise.all([
      getRepositoryReadme(repository.githubOwnerLogin, repository.name),
      getRepositoryContributors(repository.githubOwnerLogin, repository.name),
      getRepositoryReleases(repository.githubOwnerLogin, repository.name),
      getLatestCommits(repository.githubOwnerLogin, repository.name),
      getSimilarRepositories(repository.id),
      session?.id
        ? prisma.bookmark.findUnique({
            where: { userId_repositoryId: { userId: session.id, repositoryId: repository.id } },
          })
        : null,
      session?.id
        ? prisma.like.findUnique({
            where: { userId_repositoryId: { userId: session.id, repositoryId: repository.id } },
          })
        : null,
    ]);

  const myCollections = session?.id
    ? await prisma.collection.findMany({
        where: { ownerId: session.id },
        select: { id: true, name: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const languages = (repository.languages as Record<string, number> | null) ?? {};
  const languageEntries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const tags = [...repository.technologies, ...repository.topics];

  return (
    <>
      <section className="hero-container !min-h-[220px]">
        {repository.githubOwnerType === "Organization" ? (
          <Link href={`/organizations/${repository.githubOwnerLogin}`} className="tag">
            {repository.githubOwnerLogin}
          </Link>
        ) : (
          <p className="tag">{repository.githubOwnerLogin}</p>
        )}
        <h1 className="heading !text-[32px] sm:!text-[42px]">{repository.name}</h1>
        {repository.description && (
          <p className="sub-heading !max-w-3xl">{repository.description}</p>
        )}
      </section>

      <section className="section-container max-w-5xl">
        <SyncStatusPanel
          repositoryId={repository.id}
          isOwner={isOwner}
          syncStatus={repository.syncStatus}
          syncError={repository.syncError}
          lastSyncedAt={repository.lastSyncedAt}
        />

        {isOwner && (
          <Link
            href={`/repo/${repository.githubOwnerLogin}/${repository.name}/analytics`}
            className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
          >
            View analytics →
          </Link>
        )}

        {session?.user && (
          <div className="flex items-center gap-3 mt-4">
            <EngagementButton
              targetId={repository.id}
              initialActive={Boolean(myBookmark)}
              initialCount={repository._count.bookmarks}
              action={toggleBookmark}
              icon={Bookmark}
              activeLabel="Bookmarked"
              inactiveLabel="Bookmark"
            />
            <EngagementButton
              targetId={repository.id}
              initialActive={Boolean(myLike)}
              initialCount={repository._count.likes}
              action={toggleLike}
              icon={Heart}
              activeLabel="Liked"
              inactiveLabel="Like"
            />
            <AddToCollectionMenu repositoryId={repository.id} collections={myCollections} />
            {!isOwner && <ReportButton targetType="REPOSITORY" targetId={repository.id} />}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-6 text-foreground">
          <span className="flex items-center gap-1.5">
            <Star className="size-5" /> {repository.stars.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5">
            <GitFork className="size-5" /> {repository.forks.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-5" /> {repository.watchers.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5">
            <CircleAlert className="size-5" /> {repository.openIssues.toLocaleString()} open
            issues
          </span>
          <span className="flex items-center gap-1.5">
            <HardDrive className="size-5" /> {(repository.sizeKb / 1024).toFixed(1)} MB
          </span>
          <Link
            href={`https://github.com/${repository.fullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:underline"
          >
            <GitHubLogoIcon className="size-5" /> View on GitHub <ExternalLink className="size-3.5" />
          </Link>
          {repository.demoUrl && (
            <Link
              href={repository.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline"
            >
              Live demo <ExternalLink className="size-3.5" />
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {repository.license && <Badge variant="outline">{repository.license}</Badge>}
          {repository.difficulty && <Badge variant="secondary">{repository.difficulty}</Badge>}
          {repository.isArchived && <Badge variant="destructive">Archived</Badge>}
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        {languageEntries.length > 0 && (
          <div className="mt-6">
            <p className="text-16-medium mb-2">Languages</p>
            <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-muted">
              {languageEntries.map(([language, pct]) => (
                <div
                  key={language}
                  className="h-full bg-primary/70 first:bg-primary"
                  style={{ width: `${pct}%` }}
                  title={`${language} ${pct}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-14-normal">
              {languageEntries.slice(0, 6).map(([language, pct]) => (
                <span key={language}>
                  {language} · {pct}%
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <p className="text-16-medium mb-3">Media</p>
          <RepositoryMediaGallery
            repositoryId={repository.id}
            media={repository.media}
            isOwner={isOwner}
          />
        </div>

        {contributors.length > 0 && (
          <div className="mt-8">
            <p className="text-16-medium mb-3">Contributors</p>
            <div className="flex flex-wrap gap-3">
              {contributors.map((contributor) => (
                <Link
                  key={contributor.login}
                  href={contributor.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${contributor.login} · ${contributor.contributions} contributions`}
                >
                  <Image
                    src={contributor.avatarUrl}
                    alt={contributor.login}
                    width={40}
                    height={40}
                    className="rounded-full border border-border"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {releases.length > 0 && (
          <div className="mt-8">
            <p className="text-16-medium mb-3">Latest releases</p>
            <ul className="space-y-3">
              {releases.map((release) => (
                <li
                  key={release.tagName}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex-between">
                    <Link
                      href={release.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {release.name || release.tagName}
                    </Link>
                    {release.publishedAt && (
                      <span className="text-14-normal">{formatDate(release.publishedAt)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {commits.length > 0 && (
          <div className="mt-8">
            <p className="text-16-medium mb-3">Latest commits</p>
            <ul className="space-y-2">
              {commits.map((commit) => (
                <li
                  key={commit.sha}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5"
                >
                  <CalendarClock className="size-4 text-muted-foreground shrink-0" />
                  <Link
                    href={commit.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 line-clamp-1 text-sm hover:text-primary"
                  >
                    {commit.message}
                  </Link>
                  <span className="text-14-normal shrink-0">{commit.authorName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <hr className="divider" />

        <div>
          <p className="text-30-bold mb-4">README</p>
          <ReadmeViewer content={readme} />
        </div>

        <hr className="divider" />

        <div>
          <p className="text-30-bold mb-4">Reviews</p>
          <ReviewSection repositoryId={repository.id} />
        </div>

        <hr className="divider" />

        <div>
          <p className="text-30-bold mb-4">Discussion</p>
          <CommentThread repositoryId={repository.id} repositoryOwnerId={repository.ownerId} />
        </div>

        {similarRepositories.length > 0 && (
          <>
            <hr className="divider" />
            <div>
              <p className="text-30-bold mb-4">Similar repositories</p>
              <ul className="card-grid-sm">
                {similarRepositories.map((similar) => (
                  <RepositoryCard key={similar.id} repository={similar} />
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      <RepositoryViewTracker repositoryId={repository.id} initialViews={repository.viewCount} />
    </>
  );
};

export default Page;
