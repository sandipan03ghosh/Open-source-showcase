import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CommentForm from "@/components/CommentForm";
import CommentList, { type CommentData } from "@/components/CommentList";

const AUTHOR_SELECT = { username: true, avatarUrl: true, image: true } as const;

const CommentThread = async ({
  repositoryId,
  repositoryOwnerId,
}: {
  repositoryId: string;
  repositoryOwnerId: string;
}) => {
  const session = await auth();

  const comments = await prisma.comment.findMany({
    where: { repositoryId, parentId: null },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: AUTHOR_SELECT },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: AUTHOR_SELECT } },
      },
    },
  });

  // Replies are only fetched one level deep by design (no further nesting
  // in the UI), so every reply's own `replies` is structurally empty here.
  const threaded: CommentData[] = comments.map((comment) => ({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    authorId: comment.authorId,
    author: comment.author,
    replies: comment.replies.map((reply) => ({
      id: reply.id,
      body: reply.body,
      createdAt: reply.createdAt,
      authorId: reply.authorId,
      author: reply.author,
      replies: [],
    })),
  }));

  const canModerate = Boolean(
    session?.id &&
      (session.id === repositoryOwnerId ||
        session.user.role === "ADMIN" ||
        session.user.role === "MODERATOR"),
  );

  return (
    <div className="space-y-4">
      {session?.user ? (
        <CommentForm repositoryId={repositoryId} />
      ) : (
        <p className="no-result">Sign in to join the discussion.</p>
      )}
      <CommentList
        comments={threaded}
        repositoryId={repositoryId}
        currentUserId={session?.id}
        canModerate={canModerate}
      />
    </div>
  );
};

export default CommentThread;
