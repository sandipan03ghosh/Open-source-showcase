"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createCollection } from "@/lib/actions/collection";

type ActionState = { error: string; status: "INITIAL" | "SUCCESS" | "ERROR"; slug?: string };
const INITIAL_STATE: ActionState = { error: "", status: "INITIAL" };

const CollectionForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createCollection,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.status === "SUCCESS" && state.slug) {
      toast({ title: "Collection created" });
      router.push(`/collections/${state.slug}`);
    } else if (state.status === "ERROR" && state.error) {
      toast({ title: "Couldn't create collection", description: state.error, variant: "destructive" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="repo-form">
      <div>
        <label htmlFor="name" className="repo-form_label">
          Name
        </label>
        <Input id="name" name="name" className="repo-form_input" placeholder="Best React Projects" required />
      </div>

      <div>
        <label htmlFor="description" className="repo-form_label">
          Description (optional)
        </label>
        <Textarea
          id="description"
          name="description"
          className="repo-form_textarea"
          rows={3}
          placeholder="What ties these repositories together?"
        />
      </div>

      <div>
        <label htmlFor="visibility" className="repo-form_label">
          Visibility
        </label>
        <select id="visibility" name="visibility" defaultValue="PUBLIC" className="repo-form_input w-full bg-background">
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
        </select>
      </div>

      <Button type="submit" className="repo-form_btn" disabled={isPending}>
        {isPending ? "Creating..." : "Create collection"}
      </Button>
    </form>
  );
};

export default CollectionForm;
