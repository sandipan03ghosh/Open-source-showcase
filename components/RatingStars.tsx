import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const RatingStars = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => {
  const dimension = size === "md" ? "size-5" : "size-4";

  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(
            dimension,
            value <= Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground",
          )}
        />
      ))}
    </div>
  );
};

export default RatingStars;
