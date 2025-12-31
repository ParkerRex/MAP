"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TaskListSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <header className="flex w-full">
        <div className="flex flex-col md:flex-row gap-4 py-4 px-4 container justify-between w-full">
          <Skeleton className="h-8 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </header>

      {/* Tag filter skeleton */}
      <div className="flex gap-2 px-4 pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>

      {/* Task items skeleton */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="container mx-auto">
          <div className="grid gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaskItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card animate-pulse">
      <Skeleton className="h-5 w-5 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  );
}
