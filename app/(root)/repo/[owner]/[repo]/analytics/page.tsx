import type { ComponentType } from "react";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Eye, Heart, Bookmark, MessageSquare, Star, TrendingUp } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import RatingStars from "@/components/RatingStars";

export const metadata: Metadata = { title: "Repository analytics" };

type PageParams = { owner: string; repo: string };

const StatTile = ({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="size-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <p className="text-[28px] font-bold text-foreground mt-2">{value}</p>
  </div>
);

const Page = async ({ params }: { params: Promise<PageParams> }) => {
  const { owner, repo } = await params;
  const session = await auth();
  if (!session?.id) redirect(`/repo/${owner}/${repo}`);

  const repository = await prisma.repository.findFirst({
    where: { fullName: { equals: `${owner}/${repo}`, mode: "insensitive" } },
    include: {
      _count: { select: { bookmarks: true, likes: true, comments: true, reviews: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { username: true } } },
      },
    },
  });

  if (!repository) return notFound();
  if (repository.ownerId !== session.id) redirect(`/repo/${owner}/${repo}`);

  const averageRating =
    repository.reviews.length > 0
      ? repository.reviews.reduce((sum, r) => sum + r.rating, 0) / repository.reviews.length
      : 0;

  return (
    <>
      <section className="hero-container !min-h-[180px]">
        <p className="tag">{repository.fullName}</p>
        <h1 className="heading !text-[32px]">Analytics</h1>
      </section>

      <section className="section-container max-w-4xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatTile icon={Eye} label="Views" value={repository.viewCount.toLocaleString()} />
          <StatTile icon={Heart} label="Likes" value={repository._count.likes} />
          <StatTile icon={Bookmark} label="Bookmarks" value={repository._count.bookmarks} />
          <StatTile icon={MessageSquare} label="Comments" value={repository._count.comments} />
          <StatTile
            icon={Star}
            label="Avg. rating"
            value={repository._count.reviews > 0 ? averageRating.toFixed(1) : "—"}
          />
          <StatTile
            icon={TrendingUp}
            label="Trending score"
            value={repository.trendingScore ? repository.trendingScore.toFixed(1) : "—"}
          />
        </div>

        <div className="mt-8">
          <p className="text-16-medium mb-3">Recent reviews ({repository._count.reviews} total)</p>
          {repository.reviews.length > 0 ? (
            <ul className="space-y-3">
              {repository.reviews.map((review) => (
                <li key={review.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex-between">
                    <span className="text-14-normal font-medium">
                      @{review.user.username ?? review.userId}
                    </span>
                    <RatingStars rating={review.rating} />
                  </div>
                  {review.body && <p className="mt-2 text-[15px] text-foreground">{review.body}</p>}
                  <p className="text-14-normal mt-2">{formatDate(review.createdAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-result">No reviews yet.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default Page;
