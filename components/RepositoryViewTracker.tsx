"use client";

import { useEffect, useState } from "react";

import { incrementRepositoryView } from "@/lib/actions/repository";

const RepositoryViewTracker = ({
  repositoryId,
  initialViews,
}: {
  repositoryId: string;
  initialViews: number;
}) => {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    incrementRepositoryView(repositoryId);
    setViews((current) => current + 1);
  }, [repositoryId]);

  return (
    <div className="view-container">
      <div className="relative flex items-center">
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <p className="view-text">{views.toLocaleString()} views</p>
      </div>
    </div>
  );
};

export default RepositoryViewTracker;
