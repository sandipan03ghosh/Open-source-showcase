"use client";

import { useActionState, useEffect } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createComment } from "@/lib/actions/comment";

type ActionState = { error: string; status: "INITIAL" | "SUCCESS" | "ERROR" };
const INITIAL_STATE: ActionState = { error: "", status: "INITIAL" };

const CommentForm = ({
  repositoryId,
  parentId,
  onPosted,
  placeholder = "Share your thoughts on this repository...",
}: {
  repositoryId: string;
  parentId?: string;
  onPosted?: () => void;
  placeholder?: string;
}) => {
  const { toast } = useToast();
  const action = createComment.bind(null, repositoryId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.status === "SUCCESS") {
      onPosted?.();
    } else if (state.status === "ERROR" && state.error) {
      toast({ title: "Couldn't post comment", description: state.error, variant: "destructive" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-2">
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <Textarea name="body" placeholder={placeholder} className="repo-form_textarea" rows={2} required />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Posting..." : "Post"}
      </Button>
    </form>
  );
};

export default CommentForm;
