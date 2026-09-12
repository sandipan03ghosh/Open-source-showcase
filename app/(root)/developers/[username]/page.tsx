import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Building2, Globe, MapPin, Users } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RepositoryCardSkeleton } from "@/components/RepositoryCard";
import UserRepositories from "@/components/UserRepositories";
import FollowButton from "@/components/FollowButton";

export const dynamic = "force-dynamic";

const Page = async ({ params }: { params: Promise<{ username: string }> }) => {
  const { username } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      image: true,
      bio: true,
      githubUrl: true,
      company: true,
      websiteUrl: true,
      location: true,
      followersCount: true,
      followingCount: true,
    },
  });

  if (!user) return notFound();

  const isFollowing =
    session?.id && session.id !== user.id
      ? Boolean(
          await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: session.id, followingId: user.id } },
          }),
        )
      : false;

  const avatar = user.avatarUrl || user.image;

  return (
    <section className="profile-container">
      <div className="profile-card">
        {avatar && (
          <Image
            src={avatar}
            alt={user.name ?? user.username ?? "Developer avatar"}
            width={140}
            height={140}
            className="profile-image"
          />
        )}

        <h3 className="text-24-black uppercase text-center line-clamp-1 mt-5">{user.name}</h3>
        <p className="text-16-medium text-muted-foreground">@{user.username}</p>

        {user.bio && <p className="mt-3 text-center text-14-normal">{user.bio}</p>}

        <div className="flex items-center gap-4 mt-4 text-14-normal">
          <span className="flex items-center gap-1">
            <Users className="size-4" /> {user.followersCount} followers
          </span>
          <span>{user.followingCount} following</span>
        </div>

        {session?.id && session.id !== user.id && (
          <div className="mt-4">
            <FollowButton userId={user.id} initialFollowing={isFollowing} />
          </div>
        )}

        <div className="w-full mt-5 space-y-2">
          {user.company && (
            <p className="flex items-center gap-2 text-14-normal">
              <Building2 className="size-4 shrink-0" /> {user.company}
            </p>
          )}
          {user.location && (
            <p className="flex items-center gap-2 text-14-normal">
              <MapPin className="size-4 shrink-0" /> {user.location}
            </p>
          )}
          {user.websiteUrl && (
            <Link
              href={user.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-14-normal hover:text-primary"
            >
              <Globe className="size-4 shrink-0" /> {user.websiteUrl}
            </Link>
          )}
          {user.githubUrl && (
            <Link
              href={user.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-14-normal hover:text-primary"
            >
              <GitHubLogoIcon className="size-4 shrink-0" /> GitHub profile
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-5 lg:-mt-5">
        <div className="flex-between">
          <p className="text-30-bold">
            {session?.id === user.id ? "Your" : `${user.name ?? user.username}'s`} repositories
          </p>
          <Link
            href={`/collections?owner=${user.username}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View collections
          </Link>
        </div>
        <ul className="card-grid-sm">
          <Suspense fallback={<RepositoryCardSkeleton />}>
            <UserRepositories userId={user.id} />
          </Suspense>
        </ul>
      </div>
    </section>
  );
};

export default Page;
