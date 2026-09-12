"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { connectRepository } from "@/lib/actions/repository";

type ActionState = {
  error: string;
  status: "INITIAL" | "SUCCESS" | "ERROR";
  owner?: string;
  repo?: string;
};

const INITIAL_STATE: ActionState = { error: "", status: "INITIAL" };

const RepositoryForm = () => {
  const router = useRouter();
  const { toast } = useToast();

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    connectRepository,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.status === "SUCCESS" && state.owner && state.repo) {
      toast({ title: "Repository connected", description: "We're syncing it from GitHub now." });
      router.push(`/repo/${state.owner}/${state.repo}`);
    } else if (state.status === "ERROR" && state.error) {
      toast({ title: "Couldn't connect that repository", description: state.error, variant: "destructive" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="repo-form">
      <div>
        <label htmlFor="repoInput" className="repo-form_label">
          GitHub repository
        </label>
        <Input
          id="repoInput"
          name="repoInput"
          className="repo-form_input"
          placeholder="owner/repo or https://github.com/owner/repo"
          required
        />
        <p className="text-14-normal mt-2">
          We&apos;ll pull the description, README, languages, topics, license, and stats
          automatically from GitHub.
        </p>
      </div>

      <div>
        <label htmlFor="demoUrl" className="repo-form_label">
          Live demo URL (optional)
        </label>
        <Input
          id="demoUrl"
          name="demoUrl"
          type="url"
          className="repo-form_input"
          placeholder="https://your-demo.example.com"
        />
      </div>

      <div>
        <label htmlFor="difficulty" className="repo-form_label">
          Difficulty (optional)
        </label>
        <select
          id="difficulty"
          name="difficulty"
          defaultValue=""
          className="repo-form_input w-full bg-background"
        >
          <option value="">Not specified</option>
          <option value="BEGINNER">Beginner friendly</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
      </div>

      <Button type="submit" className="repo-form_btn" disabled={isPending}>
        {isPending ? "Connecting..." : "Connect repository"}
      </Button>
    </form>
  );
};

export default RepositoryForm;
