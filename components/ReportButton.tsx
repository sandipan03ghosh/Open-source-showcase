"use client";

import { useActionState, useEffect, useState } from "react";
import { Flag } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { submitReport } from "@/lib/actions/report";

type ActionState = { error: string; status: "INITIAL" | "SUCCESS" | "ERROR" };
const INITIAL_STATE: ActionState = { error: "", status: "INITIAL" };

const ReportButton = ({
  targetType,
  targetId,
}: {
  targetType: "REPOSITORY" | "COMMENT" | "USER";
  targetId: string;
}) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    submitReport,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.status === "SUCCESS") {
      toast({ title: "Report submitted", description: "Thanks — our moderators will review it." });
      setOpen(false);
    } else if (state.status === "ERROR" && state.error) {
      toast({ title: "Couldn't submit report", description: state.error, variant: "destructive" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
      >
        <Flag className="size-4" />
        Report
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-border bg-card p-3">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <Textarea
        name="reason"
        placeholder="What's wrong with this?"
        className="repo-form_textarea"
        rows={2}
        required
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit report"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ReportButton;
