import Image from "next/image";
import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import RatingStars from "@/components/RatingStars";
import ReviewForm from "@/components/ReviewForm";

const ReviewSection = async ({ repositoryId }: { repositoryId: string }) => {
  const session = await auth();

  const reviews = await prisma.review.findMany({
    where: { repositoryId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true, avatarUrl: true, image: true } } },
  });

  const average =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const myReview = session?.id ? reviews.find((r) => r.userId === session.id) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <RatingStars rating={average} size="md" />
        <span className="text-16-medium">
          {reviews.length > 0 ? average.toFixed(1) : "No ratings yet"}
          {reviews.length > 0 && ` (${reviews.length} review${reviews.length === 1 ? "" : "s"})`}
        </span>
      </div>

      {session?.user && (
        <ReviewForm
          repositoryId={repositoryId}
          existingRating={myReview?.rating}
          existingBody={myReview?.body}
        />
      )}

      {reviews.length > 0 && (
        <ul className="space-y-3">
          {reviews.map((review) => {
            const avatar = review.user.avatarUrl || review.user.image;
            const username = review.user.username ?? review.userId;
            return (
              <li key={review.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  {avatar && (
                    <Image
                      src={avatar}
                      alt={username}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <Link
                      href={`/developers/${username}`}
                      className="text-14-normal font-medium hover:text-primary"
                    >
                      @{username}
                    </Link>
                    <p className="text-14-normal">{formatDate(review.createdAt)}</p>
                  </div>
                  <div className="ml-auto">
                    <RatingStars rating={review.rating} />
                  </div>
                </div>
                {review.body && <p className="mt-2 text-[15px] text-foreground">{review.body}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ReviewSection;
