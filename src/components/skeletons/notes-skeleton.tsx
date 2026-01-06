import { Skeleton } from "@/components/ui/skeleton";

export function NotesSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <header className="border-b bg-background/85 backdrop-blur">
        <div className="flex flex-col gap-4 py-5 px-4 md:px-6">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-36 rounded-full" />
            <Skeleton className="h-9 flex-1 rounded-full" />
          </div>
        </div>
        <div className="border-t bg-muted/30 px-4 md:px-6 py-3">
          <div className="flex gap-2">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex flex-col w-60 border-r p-4 gap-3">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-px w-full" />
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

        <div className="w-[320px] border-r p-4 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>

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

      <div className="shrink-0 border-t bg-background/80 px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
