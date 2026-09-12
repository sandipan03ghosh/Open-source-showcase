"use client";

import { useState, useTransition } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface EngagementButtonProps {
  targetId: string;
  initialActive: boolean;
  initialCount: number;
  action: (id: string) => Promise<{ status: string; error: string; active?: boolean }>;
  icon: LucideIcon;
  activeLabel: string;
  inactiveLabel: string;
}

const EngagementButton = ({
  targetId,
  initialActive,
  initialCount,
  action,
  icon: Icon,
  activeLabel,
  inactiveLabel,
}: EngagementButtonProps) => {
  const [active, setActive] = useState(initialActive);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleClick = () => {
    const wasActive = active;
    const nextActive = !wasActive;

    setActive(nextActive);
    setCount((current) => current + (nextActive ? 1 : -1));

    startTransition(async () => {
      const result = await action(targetId);
      if (result.status !== "SUCCESS") {
        setActive(wasActive);
        setCount((current) => current + (nextActive ? -1 : 1));
        toast({ title: "Action failed", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium rounded-full border px-3 py-1.5 transition-colors disabled:opacity-60",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className={cn("size-4", active && "fill-current")} />
      {active ? activeLabel : inactiveLabel}
      {count > 0 && <span>· {count.toLocaleString()}</span>}
    </button>
  );
};

export default EngagementButton;
