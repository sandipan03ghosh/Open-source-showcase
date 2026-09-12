"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { toggleFollow } from "@/lib/actions/engagement";

const FollowButton = ({
  userId,
  initialFollowing,
}: {
  userId: string;
  initialFollowing: boolean;
}) => {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleClick = () => {
    const next = !following;
    setFollowing(next);

    startTransition(async () => {
      const result = await toggleFollow(userId);
      if (result.status !== "SUCCESS") {
        setFollowing(!next);
        toast({ title: "Couldn't update follow", description: result.error, variant: "destructive" });
        return;
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium rounded-full px-4 py-2 transition-colors disabled:opacity-60",
        following
          ? "bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
      )}
    >
      {following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
      {following ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;
