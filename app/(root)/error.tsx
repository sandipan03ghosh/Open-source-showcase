"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error.digest ?? error.message);
  }, [error]);

  return (
    <section className="section-container flex flex-col items-center text-center gap-4 py-24">
      <h2 className="text-30-bold">Something went wrong</h2>
      <p className="no-result max-w-md">
        We couldn&apos;t load this page. This has been logged — please try again.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </section>
  );
}
