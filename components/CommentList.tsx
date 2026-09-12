"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";

import { formatDate } from "@/lib/utils";
import CommentForm from "@/components/CommentForm";
import { deleteComment } from "@/lib/actions/comment";
import { useToast } from "@/hooks/use-toast";

export interface CommentData {
  id: string;
  body: string;
  createdAt: Date | string;
  author: { username: string | null; avatarUrl: string | null; image: string | null };
  authorId: string;
  replies: CommentData[];
}

const CommentItem = ({
  comment,
  repositoryId,
  currentUserId,
  canModerate,
}: {
  comment: CommentData;
  repositoryId: string;
  currentUserId?: string;
  canModerate: boolean;
}) => {
  const [replying, setReplying] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const { toast } = useToast();
  const avatar = comment.author.avatarUrl || comment.author.image;
  const username = comment.author.username ?? "user";
  const canDelete = canModerate || comment.authorId === currentUserId;

  if (deleted) return null;

  const handleDelete = async () => {
    const result = await deleteComment(comment.id);
    if (result.status === "SUCCESS") {
      setDeleted(true);
    } else {
      toast({ title: "Couldn't delete comment", description: result.error, variant: "destructive" });
    }
  };

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        {avatar && (
          <Image src={avatar} alt={username} width={28} height={28} className="rounded-full" />
        )}
        <Link href={`/developers/${username}`} className="text-14-normal font-medium hover:text-primary">
          @{username}
        </Link>
        <span className="text-14-normal">{formatDate(comment.createdAt)}</span>
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto text-muted-foreground hover:text-destructive"
            aria-label="Delete comment"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <p className="mt-2 text-[15px] text-foreground whitespace-pre-wrap">{comment.body}</p>

      {currentUserId && (
        <button
          type="button"
          onClick={() => setReplying((v) => !v)}
          className="mt-2 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          {replying ? "Cancel" : "Reply"}
        </button>
      )}

      {replying && (
        <div className="mt-2">
          <CommentForm
            repositoryId={repositoryId}
            parentId={comment.id}
            placeholder="Write a reply..."
            onPosted={() => setReplying(false)}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <ul className="mt-3 ml-6 space-y-3 border-l border-border pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              repositoryId={repositoryId}
              currentUserId={currentUserId}
              canModerate={canModerate}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const CommentList = ({
  comments,
  repositoryId,
  currentUserId,
  canModerate,
}: {
  comments: CommentData[];
  repositoryId: string;
  currentUserId?: string;
  canModerate: boolean;
}) => {
  if (comments.length === 0) {
    return <p className="no-result">No comments yet — start the discussion.</p>;
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          repositoryId={repositoryId}
          currentUserId={currentUserId}
          canModerate={canModerate}
        />
      ))}
    </ul>
  );
};

export default CommentList;
