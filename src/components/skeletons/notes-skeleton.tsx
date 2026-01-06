import { Skeleton } from "@/components/ui/skeleton";

export function NotesSkeleton() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#f8f8fb] via-[#f4f4f7] to-[#efeff3] dark:from-[#1f1f22] dark:via-[#1c1c1e] dark:to-[#1b1b1d]">
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex flex-col w-64 border-r border-black/10 bg-[#f2f2f7]">
          <div className="px-4 pt-5 pb-3 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="px-3 pb-4 space-y-3">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-px w-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-6" />
              </div>
            ))}
          </div>
        </div>

        <div className="w-[360px] border-r border-black/10 bg-white flex flex-col">
          <div className="border-b border-black/10 bg-[#f7f7f9] px-4 pt-5 pb-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-40" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-9 w-full rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 rounded-lg">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white flex flex-col">
          <div className="border-b border-black/10 px-6 py-5 space-y-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="border-b border-black/10 px-6 py-3">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex-1 p-6 space-y-3">
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
