"use client";

import { useActionState, useEffect, useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitReview } from "@/lib/actions/review";

type ActionState = { error: string; status: "INITIAL" | "SUCCESS" | "ERROR" };
const INITIAL_STATE: ActionState = { error: "", status: "INITIAL" };

const ReviewForm = ({
  repositoryId,
  existingRating,
  existingBody,
}: {
  repositoryId: string;
  existingRating?: number;
  existingBody?: string | null;
}) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(existingRating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);

  const action = submitReview.bind(null, repositoryId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.status === "SUCCESS") {
      toast({ title: existingRating ? "Review updated" : "Review posted" });
    } else if (state.status === "ERROR" && state.error) {
      toast({ title: "Couldn't submit review", description: state.error, variant: "destructive" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card p-4 space-y-3">
      <input type="hidden" name="rating" value={rating} />
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Rate ${value} stars`}
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                value <= (hoverRating || rating)
                  ? "fill-primary text-primary"
                  : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        name="body"
        defaultValue={existingBody ?? ""}
        placeholder="Share your thoughts on this repository (optional)"
        className="repo-form_textarea"
        rows={3}
      />
      <Button type="submit" disabled={isPending || rating === 0} size="sm">
        {isPending ? "Saving..." : existingRating ? "Update review" : "Post review"}
      </Button>
    </form>
  );
};

export default ReviewForm;
