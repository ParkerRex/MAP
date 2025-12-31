import { Icons } from "@/components/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  fullfilled: boolean;
};

export function TransactionStatus({ fullfilled }: Props) {
  if (fullfilled) {
    return <Icons.Check />;
  }

  return (
    <TooltipProvider delayDuration={50}>
      <Tooltip>
        <TooltipTrigger>
          <Icons.AlertCircle />
        </TooltipTrigger>
        <TooltipContent
          className="px-3 py-1.5 text-xs"
          side="left"
          sideOffset={10}
        >
          Missing receipt
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
