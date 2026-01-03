import { Skeleton } from "@/components/ui/skeleton";

export function NotesSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between py-4 px-4 md:px-6">
          <Skeleton className="h-8 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[200px] md:w-[280px]" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </header>

      {/* Content skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Folder sidebar */}
        <div className="hidden md:flex flex-col w-48 border-r p-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-6" />
            </div>
          ))}
          <Skeleton className="h-px w-full my-2" />
          <Skeleton className="h-8 w-28" />
        </div>

        {/* Note list */}
        <div className="w-72 border-r p-4 flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>

        {/* Note content */}
        <div className="flex-1 p-6 flex flex-col gap-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2 border-b pb-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
