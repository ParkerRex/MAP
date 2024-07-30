'use client';

import type { Goal as TGoal } from '@/types';
import * as RadixScrollArea from '@radix-ui/react-scroll-area';
import Goal from '../Goal';

type ScrollAreaProps = {
  goals: TGoal[];
  setOptimisticGoals: (
    action: TGoal[] | ((pendingState: TGoal[]) => TGoal[]),
  ) => void;
};

const ScrollArea = ({ goals, setOptimisticGoals }: ScrollAreaProps) => {
  return (
    <RadixScrollArea.Root className="m-auto h-[300px] w-full overflow-hidden rounded">
      <RadixScrollArea.Viewport className="h-full w-full rounded">
        <div className="flex flex-col gap-3">
          {goals.map((goal) => (
            <Goal
              key={goal.id}
              {...goal}
              setOptimisticGoals={setOptimisticGoals}
            />
          ))}
        </div>
      </RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar
        className="duration-&lsqb;160ms&rsqb; flex touch-none select-none bg-slate-200 p-0.5 transition-colors ease-out data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col"
        orientation="vertical"
      >
        <RadixScrollArea.Thumb className="relative flex-1 rounded-[10px] bg-slate-300 before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-[44px] before:w-full before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']" />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Scrollbar
        className="duration-&lsqb;160ms&rsqb; flex touch-none select-none bg-slate-300 p-0.5 transition-colors ease-out data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col"
        orientation="horizontal"
      >
        <RadixScrollArea.Thumb className="relative flex-1 rounded-[10px] bg-slate-300 before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-[44px] before:w-full before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']" />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Corner className="bg-slate-300" />
    </RadixScrollArea.Root>
  );
};

export default ScrollArea;
